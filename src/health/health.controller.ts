import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('api/health')
export class HealthController {
  private readonly startedAt = new Date();

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  async check() {
    const uptimeSeconds = Math.floor((Date.now() - this.startedAt.getTime()) / 1000);
    const mem = process.memoryUsage();

    let dbStatus: 'ok' | 'error' = 'error';
    let dbLatencyMs: number | null = null;
    let dbError: string | null = null;

    try {
      const t0 = Date.now();
      await this.dataSource.query('SELECT 1');
      dbLatencyMs = Date.now() - t0;
      dbStatus = 'ok';
    } catch (e: any) {
      dbError = e.message;
    }

    const overall = dbStatus === 'ok' ? 'ok' : 'degraded';

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        human: formatUptime(uptimeSeconds),
      },
      services: {
        api: { status: 'ok', version: '1.0.0', environment: process.env.NODE_ENV ?? 'development' },
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          ...(dbError ? { error: dbError } : {}),
        },
      },
      memory: {
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        rssMb: Math.round(mem.rss / 1024 / 1024),
      },
      node: process.version,
    };
  }
}

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${sec}s`].filter(Boolean).join(' ');
}
