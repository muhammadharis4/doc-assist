import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [PrismaModule, RagModule],
  providers: [DocumentsService],
  controllers: [DocumentsController],
})
export class DocumentsModule {}
