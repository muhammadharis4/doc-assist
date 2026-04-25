"""OpenSearch indexing and hybrid retrieval helpers."""

from __future__ import annotations

import logging
from functools import lru_cache

from opensearchpy import OpenSearch

from src.config import settings
from src.constants import EMBEDDING_DIMENSIONS

logger = logging.getLogger(__name__)


def _infer_document_types_for_query(query: str) -> set[str]:
    """
    Infers likely target document types from user query keywords.

    Args:
        query (str): Raw user query text.

    Returns:
        set[str]: Candidate document type labels.
    """

    lowered = query.lower()
    inferred: set[str] = set()

    if any(token in lowered for token in {"miet", "rent", "wohnung", "kaltmiete", "warmmiete"}):
        inferred.add("rental_contract")
    if any(
        token in lowered
        for token in {
            "arbeits",
            "employment",
            "arbeitgeber",
            "arbeitnehmer",
            "vertrag",
        }
    ):
        inferred.add("work_contract")
    if any(token in lowered for token in {"gehalt", "salary", "lohn", "abrechnung", "brutto", "netto"}):
        inferred.add("salary_slip")
    if any(
        token in lowered
        for token in {"versicherung", "insurance", "renten", "krankenkasse", "sozialversicherung"}
    ):
        inferred.add("insurance")
    if any(token in lowered for token in {"steuer", "tax", "steuer-id", "steuerid", "finanzamt"}):
        inferred.add("tax")
    if any(token in lowered for token in {"anmeldung", "meldung", "wohnsitz", "register", "registration"}):
        inferred.add("registration")

    return inferred


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
                "document_type": {"type": "keyword"},
                "chunk_text": {"type": "text"},
                "chunk_index": {"type": "integer"},
                "embedding": {
                    "type": "knn_vector",
                    "dimension": EMBEDDING_DIMENSIONS,
                    "method": {
                        "name": "hnsw",
                        "space_type": "cosinesimil",
                        "engine": "faiss",
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
    document_type: str,
    chunks: list[str],
    embeddings: list[list[float]],
    created_at: str,
) -> None:
    """
    Indexes all chunks for a document in one bulk request.

    Args:
        document_id (str): The document identifier.
        filename (str): The source filename.
        document_type (str): The document category.
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
                "document_type": document_type,
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


def hybrid_search(
    query: str,
    query_embedding: list[float],
    top_k: int,
    document_ids: list[str] | None = None,
) -> list[dict[str, object]]:
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

    candidate_multiplier = max(2, settings.rag_candidate_multiplier)
    candidate_size = max(top_k * candidate_multiplier, top_k)

    base_query: dict[str, object] = {
        "hybrid": {
            "queries": [
                {
                    "match": {
                        "chunk_text": {
                            "query": query,
                            "operator": "and",
                        }
                    }
                },
                {
                    "match": {
                        "chunk_text": {
                            "query": query,
                            "operator": "or",
                        }
                    }
                },
                {
                    "knn": {
                        "embedding": {
                            "vector": query_embedding,
                            "k": candidate_size,
                        }
                    }
                },
            ]
        }
    }

    final_query: dict[str, object] = base_query
    if document_ids:
        final_query = {
            "bool": {
                "must": [base_query],
                "filter": [
                    {
                        "terms": {
                            "document_id": document_ids,
                        }
                    }
                ],
            }
        }

    body = {
        "size": candidate_size,
        "query": final_query,
        "_source": ["document_id", "filename", "document_type", "chunk_text", "chunk_index"],
    }

    response = client.search(
        index=settings.opensearch_index_name,
        body=body,
        params={"search_pipeline": settings.opensearch_pipeline_name},
    )

    hits = response.get("hits", {}).get("hits", [])
    max_per_document = max(1, settings.rag_max_results_per_document)
    inferred_types = _infer_document_types_for_query(query)

    prepared_hits: list[dict[str, object]] = []
    for hit in hits:
        source = hit.get("_source", {})
        document_type = str(source.get("document_type") or "other")
        adjusted_score = float(hit.get("_score", 0.0))
        if document_type in inferred_types:
            adjusted_score += settings.doc_type_score_boost

        prepared_hits.append(
            {
                "_source": source,
                "_score": adjusted_score,
            }
        )

    prepared_hits.sort(key=lambda item: float(item.get("_score", 0.0)), reverse=True)

    ranked_hits: list[dict[str, object]] = []
    per_document_counts: dict[str, int] = {}

    for hit in prepared_hits:
        source = hit.get("_source", {})
        document_id = str(source.get("document_id") or "")
        if not document_id:
            continue

        if per_document_counts.get(document_id, 0) >= max_per_document:
            continue

        ranked_hits.append(
            {
                "documentId": document_id,
                "filename": source.get("filename"),
                "documentType": source.get("document_type") or "other",
                "content": source.get("chunk_text", ""),
                "chunkIndex": source.get("chunk_index"),
                "score": float(hit.get("_score", 0.0)),
            }
        )
        per_document_counts[document_id] = per_document_counts.get(document_id, 0) + 1

        if len(ranked_hits) >= top_k:
            break

    return ranked_hits
