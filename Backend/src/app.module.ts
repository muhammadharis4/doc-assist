import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DocumentsModule } from './documents/documents.module';
import { QueriesModule } from './queries/queries.module';
import { RagModule } from './rag/rag.module';

@Module({
  imports: [PrismaModule, DocumentsModule, QueriesModule, RagModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
