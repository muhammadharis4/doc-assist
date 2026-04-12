import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateSavedQueryDto,
  ExecuteQueryDto,
  QueriesService,
} from './queries.service';

@Controller('queries')
export class QueriesController {
  constructor(private readonly queriesService: QueriesService) {}

  @Get('history')
  getHistory(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : undefined;
    const safeLimit = parsed && parsed > 0 && parsed <= 100 ? parsed : 20;
    return this.queriesService.getHistory(safeLimit);
  }

  @Get('saved')
  getSaved() {
    return this.queriesService.getSaved();
  }

  @Post()
  executeQuery(@Body() body: ExecuteQueryDto) {
    return this.queriesService.executeQuery(body);
  }

  @Post('saved')
  createSaved(@Body() body: CreateSavedQueryDto) {
    return this.queriesService.createSaved(body);
  }

  @Delete('saved/:id')
  removeSaved(@Param('id') id: string) {
    return this.queriesService.removeSaved(id);
  }
}
