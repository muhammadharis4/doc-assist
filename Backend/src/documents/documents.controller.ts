import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import type { CreateDocumentDto } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Returns a paginated and filterable list of documents.
   * @param skip Number of rows to skip from the newest-first list.
   * @param take Number of rows to return, capped at 100.
   * @param project Exact project filter.
   * @param category Exact category filter.
   * @param keyword Keyword search across document fields.
   * @returns A paginated array of document records.
   */
  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('project') project?: string,
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
  ) {
    const parsedSkip = this.parseQueryNumber(skip, 0, 'skip');
    const parsedTake = this.parseQueryNumber(take, 20, 'take');
    const normalizedProject = this.parseOptionalText(project);
    const normalizedCategory = this.parseOptionalText(category);
    const normalizedKeyword = this.parseOptionalText(keyword);

    // Keep responses bounded to avoid accidental large scans.
    return this.documentsService.findAll(
      parsedSkip,
      Math.min(parsedTake, 100),
      {
        project: normalizedProject,
        category: normalizedCategory,
        keyword: normalizedKeyword,
      },
    );
  }

  /**
   * Ingests a document payload and stores it for retrieval.
   * @param body Document content and metadata.
   * @returns The created document record.
   */
  @Post()
  ingest(@Body() body: CreateDocumentDto) {
    return this.documentsService.ingest(body);
  }

  /**
   * Returns a single document by id.
   * @param id Document unique identifier.
   * @returns The matching document record.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  /**
   * Deletes a document and its retrieval index entry.
   * @param id Document unique identifier.
   * @returns The deleted document record.
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  /**
   * Parses and validates an optional pagination query value.
   * @param value Raw query string input.
   * @param fallback Default numeric value when input is missing.
   * @param fieldName Field label used in validation error messages.
   * @returns A validated non-negative integer.
   */
  private parseQueryNumber(
    value: string | undefined,
    fallback: number,
    fieldName: 'skip' | 'take',
  ) {
    // Missing query params should use defaults, not fail validation.
    if (value === undefined) {
      return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      throw new BadRequestException(
        `${fieldName} must be a non-negative integer`,
      );
    }

    return parsed;
  }

  /**
   * Normalizes optional text filters.
   * @param value Raw query string input.
   * @returns A trimmed string or undefined when empty.
   */
  private parseOptionalText(value: string | undefined) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return normalized || undefined;
  }
}
