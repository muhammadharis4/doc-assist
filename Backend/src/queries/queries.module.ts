import { Module } from '@nestjs/common';
import { QueriesService } from './queries.service';
import { QueriesController } from './queries.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [PrismaModule, RagModule],
  providers: [QueriesService],
  controllers: [QueriesController],
})
export class QueriesModule {}
