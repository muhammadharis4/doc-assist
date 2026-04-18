"""OpenSearch indexing and hybrid retrieval helpers."""

from __future__ import annotations

import logging
from functools import lru_cache

from opensearchpy import OpenSearch

from src.config import settings
from src.constants import EMBEDDING_DIMENSIONS

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_client() -> OpenSearch:
    """
    Creates and caches an OpenSearch client.

    Returns:
        OpenSearch: The cached OpenSearch client.
    """

    return OpenSearch(hosts=[settings.opensearch_url])


def ensure_index_and_pipeline() -> None:
    """
    Creates index and hybrid pipeline if they do not exist yet.

    Returns:
        None: This function only performs setup.
    """

    client = get_client()

    pipeline_body = {
        "description": "Post processor for hybrid search",
        "phase_results_processors": [
            {
                "normalization-processor": {
                    "normalization": {"technique": "min_max"},
                    "combination": {
                        "technique": "arithmetic_mean",
                        "parameters": {
                            "weights": [
                                settings.text_score_weight,
                                settings.vector_score_weight,
                            ]
                        },
                    },
                }
            }
        ],
    }
    client.transport.perform_request(
        method="PUT",
        url=f"/_search/pipeline/{settings.opensearch_pipeline_name}",
        body=pipeline_body,
    )

    if client.indices.exists(index=settings.opensearch_index_name):
        return

    index_body = {
        "settings": {"index": {"knn": True}},
        "mappings": {
            "properties": {
                "document_id": {"type": "keyword"},
                "filename": {"type": "keyword"},
                "chunk_text": {"type": "text"},
                "chunk_index": {"type": "integer"},
                "embedding": {
                    "type": "knn_vector",
                    "dimension": EMBEDDING_DIMENSIONS,
                    "method": {
                        "name": "hnsw",
                        "space_type": "cosinesimil",
                        "engine": "nmslib",
                    },
                },
                "created_at": {"type": "date"},
            }
        },
    }
    client.indices.create(index=settings.opensearch_index_name, body=index_body)
    logger.info("Created OpenSearch index: %s", settings.opensearch_index_name)


def upsert_document_chunks(
    document_id: str,
    filename: str,
    chunks: list[str],
    embeddings: list[list[float]],
    created_at: str,
) -> None:
    """
    Indexes all chunks for a document in one bulk request.

    Args:
        document_id (str): The document identifier.
        filename (str): The source filename.
        chunks (list[str]): Chunked document text.
        embeddings (list[list[float]]): Embedding vectors for each chunk.
        created_at (str): Document creation timestamp.

    Returns:
        None: This function only writes to OpenSearch.
    """

    if not chunks:
        return

    client = get_client()

    bulk_lines: list[dict[str, object]] = []
    for index, chunk in enumerate(chunks):
        bulk_lines.append(
            {
                "index": {
                    "_index": settings.opensearch_index_name,
                    "_id": f"{document_id}:{index}",
                }
            }
        )
        bulk_lines.append(
            {
                "document_id": document_id,
                "filename": filename,
                "chunk_text": chunk,
                "chunk_index": index,
                "embedding": embeddings[index],
                "created_at": created_at,
            }
        )

    client.bulk(body=bulk_lines, refresh=True)


def delete_document_chunks(document_id: str) -> None:
    """
    Removes all indexed chunks that belong to one document id.

    Args:
        document_id (str): The document identifier.

    Returns:
        None: This function only deletes from OpenSearch.
    """

    client = get_client()
    client.delete_by_query(
        index=settings.opensearch_index_name,
        body={"query": {"term": {"document_id": document_id}}},
        refresh=True,
    )


def hybrid_search(query: str, query_embedding: list[float], top_k: int) -> list[dict[str, object]]:
    """
    Runs OpenSearch hybrid search (BM25 + KNN) through the search pipeline.

    Args:
        query (str): The user query text.
        query_embedding (list[float]): The query embedding vector.
        top_k (int): Maximum number of hits to return.

    Returns:
        list[dict[str, object]]: Ranked hybrid search hits.
    """

    client = get_client()

    body = {
        "size": top_k,
        "query": {
            "hybrid": {
                "queries": [
                    {"match": {"chunk_text": {"query": query}}},
                    {"knn": {"embedding": {"vector": query_embedding, "k": max(top_k * 3, top_k)}}},
                ]
            }
        },
        "_source": ["document_id", "filename", "chunk_text"],
    }

    response = client.search(
        index=settings.opensearch_index_name,
        body=body,
        params={"search_pipeline": settings.opensearch_pipeline_name},
    )

    hits = response.get("hits", {}).get("hits", [])
    return [
        {
            "documentId": hit.get("_source", {}).get("document_id"),
            "filename": hit.get("_source", {}).get("filename"),
            "content": hit.get("_source", {}).get("chunk_text", ""),
            "score": float(hit.get("_score", 0.0)),
        }
        for hit in hits
    ]
