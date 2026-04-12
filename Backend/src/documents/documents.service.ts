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

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: RagService,
  ) {}

  private get db(): PrismaClient {
    return this.prisma as PrismaClient;
  }

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

  findAll(skip = 0, take = 20) {
    return this.db.document.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const doc = await this.db.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

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
