import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from '../rag/rag.service';

export interface CreateDocumentDto {
  filename: string;
  mimeType: string;
  storagePath: string;
  extractedText: string;
  size?: number;
  project?: string | null;
  category?: string | null;
  version?: number;
}

export interface DocumentListFilters {
  project?: string;
  category?: string;
  keyword?: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
  ) {}

  // Use a typed view of PrismaService to keep model delegate types stable.
  private get db(): PrismaClient {
    return this.prisma as PrismaClient;
  }

  /**
   * Ingests a document, saves metadata, indexes text for RAG, and returns the created record.
   * Validates required fields and trims string inputs.
   * @param data
   * @returns The created document record.
   */
  async ingest(data: CreateDocumentDto) {
    const filename =
      typeof data.filename === 'string' ? data.filename.trim() : '';
    const mimeType =
      typeof data.mimeType === 'string' ? data.mimeType.trim() : '';
    const storagePath =
      typeof data.storagePath === 'string' ? data.storagePath.trim() : '';
    const extractedText =
      typeof data.extractedText === 'string' ? data.extractedText.trim() : '';

    if (!filename || !mimeType || !storagePath || !extractedText) {
      throw new BadRequestException(
        'filename, mimeType, storagePath, and extractedText are required',
      );
    }

    const document = await this.db.document.create({
      data: {
        filename,
        mimeType,
        storagePath,
        extractedText,
        size: data.size,
        project: data.project ?? null,
        category: data.category ?? null,
        version: data.version ?? 1,
      },
    });

    await this.ragService.indexDocument({
      documentId: document.id,
      text: extractedText,
      filename: document.filename,
      project: document.project,
      category: document.category,
    });

    return document;
  }

  /**
   * Returns documents ordered by recency with pagination and filters.
   * @param skip Number of rows to skip from the newest-first list.
   * @param take Maximum number of rows to return.
   * @param filters Optional project, category, and keyword filters.
   * @returns A paginated array of document records.
   */
  findAll(skip = 0, take = 20, filters: DocumentListFilters = {}) {
    const where = {
      ...(filters.project ? { project: filters.project } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.keyword
        ? {
            OR: [
              { filename: { contains: filters.keyword } },
              { extractedText: { contains: filters.keyword } },
              { project: { contains: filters.keyword } },
              { category: { contains: filters.keyword } },
            ],
          }
        : {}),
    };

    return this.db.document.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetches one document and throws when not found.
   * @param id Document unique identifier.
   * @returns The matching document record.
   */
  async findOne(id: string) {
    const doc = await this.db.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

  /**
   * Deletes one document after existence verification.
   * @param id Document unique identifier.
   * @returns The deleted document record.
   */
  async remove(id: string) {
    // Ensure the document exists before attempting delete
    const existing = await this.db.document.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Document not found');
    }

    await this.ragService.deleteDocumentIndex(id);

    return this.db.document.delete({ where: { id } });
  }
}
