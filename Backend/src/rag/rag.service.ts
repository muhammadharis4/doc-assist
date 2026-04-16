import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RagSource {
  documentId?: string;
  filename?: string;
  snippet?: string;
  score?: number;
}

export interface RagQueryResult {
  answer: string;
  sources: RagSource[];
}

@Injectable()
export class RagService {
  constructor(private readonly prisma: PrismaService) {}

  private get externalServiceUrl(): string | null {
    const value = process.env.RAG_SERVICE_URL?.trim();
    return value ? value.replace(/\/+$/, '') : null;
  }

  private async queryExternalService(
    query: string,
  ): Promise<RagQueryResult | null> {
    const serviceUrl = this.externalServiceUrl;
    if (!serviceUrl) {
      return null;
    }

    const fetchFn = globalThis.fetch;
    if (typeof fetchFn !== 'function') {
      return null;
    }

    try {
      const response = await fetchFn(`${serviceUrl}/query`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as Partial<RagQueryResult> | null;
      if (!payload || typeof payload.answer !== 'string') {
        return null;
      }

      return {
        answer: payload.answer,
        sources: Array.isArray(payload.sources)
          ? payload.sources
              .filter((source): source is RagSource => Boolean(source))
              .map((source) => ({
                documentId: source.documentId,
                filename: source.filename,
                snippet: source.snippet,
                score: source.score,
              }))
          : [],
      };
    } catch {
      return null;
    }
  }

  private tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3);
  }

  private buildSnippet(text: string, terms: string[]): string {
    const normalizedText = text.replace(/\s+/g, ' ').trim();
    if (!normalizedText) {
      return '';
    }

    const matchIndex = terms
      .map((term) => normalizedText.toLowerCase().indexOf(term.toLowerCase()))
      .find((index) => index >= 0);

    if (matchIndex === undefined) {
      return normalizedText.slice(0, 240);
    }

    const start = Math.max(0, matchIndex - 80);
    const end = Math.min(normalizedText.length, matchIndex + 160);
    return normalizedText.slice(start, end);
  }

  private scoreDocument(
    queryTerms: string[],
    document: {
      filename: string;
      project: string | null;
      category: string | null;
      extractedText: string | null;
    },
  ): number {
    const searchableText = [
      document.filename,
      document.project,
      document.category,
      document.extractedText,
    ]
      .filter(
        (value): value is string =>
          typeof value === 'string' && value.length > 0,
      )
      .join(' ')
      .toLowerCase();

    if (queryTerms.length === 0 || searchableText.length === 0) {
      return 0;
    }

    return queryTerms.reduce(
      (score, term) => score + (searchableText.includes(term) ? 1 : 0),
      0,
    );
  }

  private async queryLocalService(query: string): Promise<RagQueryResult> {
    const queryTerms = this.tokenize(query);
    const documents = await this.prisma.document.findMany({
      where: {
        extractedText: {
          not: null,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const scoredDocuments = documents
      .map((document) => ({
        document,
        score: this.scoreDocument(queryTerms, document),
      }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);

    if (scoredDocuments.length === 0) {
      return {
        answer: `No matching documents were found for: "${query}".`,
        sources: [],
      };
    }

    const sources: RagSource[] = scoredDocuments.map(({ document, score }) => ({
      documentId: document.id,
      filename: document.filename,
      snippet: this.buildSnippet(document.extractedText ?? '', queryTerms),
      score,
    }));

    const directAnswer =
      sources[0]?.snippet?.trim() ||
      `No direct answer could be generated for "${query}" from matched documents.`;
    const sourceLabels = Array.from(
      new Set(
        sources
          .map((source) => source.filename ?? source.documentId)
          .filter(
            (label): label is string =>
              typeof label === 'string' && label.trim().length > 0,
          ),
      ),
    );
    const sourcesSuffix = sourceLabels.length
      ? `\n\nSources: ${sourceLabels.join(', ')}`
      : '';

    return {
      answer: `${directAnswer}${sourcesSuffix}`,
      sources,
    };
  }

  async query(query: string): Promise<RagQueryResult> {
    if (!query.trim()) {
      return {
        answer: 'Please provide a question to search for.',
        sources: [],
      };
    }

    const externalResult = await this.queryExternalService(query);
    if (externalResult) {
      return externalResult;
    }

    return this.queryLocalService(query);
  }

  async indexDocument(_args: {
    documentId: string;
    text: string;
    filename?: string;
    project?: string | null;
    category?: string | null;
  }): Promise<void> {
    const serviceUrl = this.externalServiceUrl;
    if (!serviceUrl) {
      return;
    }

    const fetchFn = globalThis.fetch;
    if (typeof fetchFn !== 'function') {
      return;
    }

    try {
      await fetchFn(`${serviceUrl}/documents`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(_args),
      });
    } catch {
      return;
    }
  }

  async deleteDocumentIndex(_documentId: string): Promise<void> {
    const serviceUrl = this.externalServiceUrl;
    if (!serviceUrl) {
      return;
    }

    const fetchFn = globalThis.fetch;
    if (typeof fetchFn !== 'function') {
      return;
    }

    try {
      await fetchFn(
        `${serviceUrl}/documents/${encodeURIComponent(_documentId)}`,
        {
          method: 'DELETE',
        },
      );
    } catch {
      return;
    }
  }
}
