import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateDocumentDto, DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll() {
    return this.documentsService.findAll();
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
}
