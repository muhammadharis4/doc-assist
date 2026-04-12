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

  @Get()
  findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    const parsedSkip = this.parseQueryNumber(skip, 0, 'skip');
    const parsedTake = this.parseQueryNumber(take, 20, 'take');

    return this.documentsService.findAll(parsedSkip, Math.min(parsedTake, 100));
  }

  @Post()
  ingest(@Body() body: CreateDocumentDto) {
    return this.documentsService.ingest(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  private parseQueryNumber(
    value: string | undefined,
    fallback: number,
    fieldName: 'skip' | 'take',
  ) {
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
}
