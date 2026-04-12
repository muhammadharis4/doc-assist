import { BadRequestException, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from '../rag/rag.service';

export interface CreateSavedQueryDto {
  title: string;
  query: string;
}

export interface ExecuteQueryDto {
  query: string;
  userId?: string | null;
}

@Injectable()
export class QueriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
  ) {}

  /**
   * Exposes Prisma with explicit client typing for delegate inference.
   */
  // Mirror the documents service typing pattern for delegate inference.
  private get db(): PrismaClient {
    return this.prisma as PrismaClient;
  }

  /**
   * Executes a query, retrieves an answer, and persists history with sources.
   * @param data Query payload from the controller.
   */
  async executeQuery(data: ExecuteQueryDto) {
    const query = typeof data.query === 'string' ? data.query.trim() : '';
    if (!query) {
      throw new BadRequestException('query is required');
    }

    const result = await this.ragService.query(query);

    const history = await this.db.queryHistory.create({
      data: {
        query,
        answer: result.answer,
        userId: data.userId ?? null,
        sources: {
          create: result.sources.map((source) => ({
            documentId: source.documentId ?? null,
            snippet: source.snippet ?? '',
            score: source.score ?? null,
          })),
        },
      },
      include: {
        sources: true,
      },
    });

    return history;
  }

  /**
   * Returns recent query history ordered by newest first.
   * @param limit Maximum number of history rows to return.
   */
  getHistory(limit = 20) {
    return this.db.queryHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Returns all saved queries ordered by recency.
   */
  getSaved() {
    return this.db.savedQuery.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Persists a named query for future reuse.
   * @param data Saved-query payload containing title and query text.
   */
  createSaved(data: CreateSavedQueryDto) {
    const { title, query } = data;
    return this.db.savedQuery.create({
      data: {
        title,
        query,
        userId: null,
      },
    });
  }

  /**
   * Deletes one saved query by id.
   * @param id Saved query unique identifier.
   */
  removeSaved(id: string) {
    return this.db.savedQuery.delete({ where: { id } });
  }
}
