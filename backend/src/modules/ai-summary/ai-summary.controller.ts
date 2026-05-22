import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  MessageEvent,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AiSummaryService } from './ai-summary.service';
import { GenerateSummaryDto } from './dto/generate-summary.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';

@Controller('ai-summary')
@Roles('super_admin')
export class AiSummaryController {
  constructor(private readonly aiSummaryService: AiSummaryService) {}

  @Post('generate')
  generate(@Body() dto: GenerateSummaryDto, @Req() req: { user: RequestUser }) {
    return this.aiSummaryService.generate(dto, req.user.id);
  }

  @Get('generate-stream')
  @Sse('generate-stream')
  generateStream(
    @Query() dto: GenerateSummaryDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ): Observable<MessageEvent> {
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');

    return new Observable<MessageEvent>((subscriber) => {
      let closed = false;

      req.on('close', () => {
        closed = true;
        subscriber.complete();
      });

      void (async () => {
        let iterator: AsyncGenerator<Record<string, any>>;
        try {
          iterator = this.aiSummaryService.generateStream(dto, req.user.id);
        } catch (err: any) {
          subscriber.next({ data: { type: 'error', message: err.message || '初始化失败' } } as any);
          subscriber.complete();
          return;
        }

        const cleanup = async () => {
          if (typeof iterator.return === 'function') {
            try { await iterator.return(undefined); } catch { /* ignore */ }
          }
        };

        try {
          for await (const event of iterator) {
            if (closed) return;
            subscriber.next({ data: event } as any);
          }
          subscriber.complete();
        } catch (error: any) {
          if (!closed) {
            subscriber.next({ data: { type: 'error', message: error.message || '流式生成失败' } } as any);
          }
          subscriber.complete();
        } finally {
          await cleanup();
        }
      })();

      return () => {
        closed = true;
      };
    });
  }

  @Get('history')
  getHistory(
    @Query('page', new DefaultValuePipe(1)) page: number,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize: number,
  ) {
    return this.aiSummaryService.getHistory(page, pageSize);
  }

  @Get(':id')
  getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.aiSummaryService.getDetail(id);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.aiSummaryService.delete(id);
  }
}
