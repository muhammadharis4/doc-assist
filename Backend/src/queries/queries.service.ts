import { BadRequestException, Injectable } from '@nestjs/common';
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

  async executeQuery(data: ExecuteQueryDto) {
    const query = typeof data.query === 'string' ? data.query.trim() : '';
    if (!query) {
      throw new BadRequestException('query is required');
    }

    const result = await this.ragService.query(query);

    const history = await this.prisma.queryHistory.create({
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

  getHistory(limit = 20) {
    return this.prisma.queryHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  getSaved() {
    return this.prisma.savedQuery.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  createSaved(data: CreateSavedQueryDto) {
    const { title, query } = data;
    return this.prisma.savedQuery.create({
      data: {
        title,
        query,
        userId: null,
      },
    });
  }

  removeSaved(id: string) {
    return this.prisma.savedQuery.delete({ where: { id } });
  }
}
