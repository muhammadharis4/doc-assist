import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { QueriesService } from './queries.service';
import type { CreateSavedQueryDto, ExecuteQueryDto } from './queries.service';

@Controller('queries')
export class QueriesController {
  constructor(private readonly queriesService: QueriesService) {}

  /**
   * Returns recent query history, bounded by a safe limit.
   * @param limit Maximum number of history rows to return.
   * @returns A list of recent query history records.
   */
  @Get('history')
  getHistory(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : undefined;
    const safeLimit = parsed && parsed > 0 && parsed <= 100 ? parsed : 20;
    return this.queriesService.getHistory(safeLimit);
  }

  /**
   * Returns all saved queries.
   * @returns A list of saved queries ordered by recency.
   */
  @Get('saved')
  getSaved() {
    return this.queriesService.getSaved();
  }

  /**
   * Executes a natural-language query.
   * @param body Query payload containing question text and optional user id.
   * @returns The persisted query history record with sources.
   */
  @Post()
  executeQuery(@Body() body: ExecuteQueryDto) {
    return this.queriesService.executeQuery(body);
  }

  /**
   * Persists a saved query for later reuse.
   * @param body Saved-query payload containing title and query text.
   * @returns The created saved-query record.
   */
  @Post('saved')
  createSaved(@Body() body: CreateSavedQueryDto) {
    return this.queriesService.createSaved(body);
  }

  /**
   * Removes a saved query by id.
   * @param id Saved query unique identifier.
   * @returns The deleted saved-query record.
   */
  @Delete('saved/:id')
  removeSaved(@Param('id') id: string) {
    return this.queriesService.removeSaved(id);
  }
}
