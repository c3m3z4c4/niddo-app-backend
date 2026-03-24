import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface BackupMeta {
  filename: string;
  size: number;
  createdAt: string;
}

export interface BackupConfig {
  enabled: boolean;
  cronExpression: string;
  maxBackups: number;
  lastRunAt?: string;
}

const DEFAULT_CONFIG: BackupConfig = {
  enabled: false,
  cronExpression: '0 2 * * *',
  maxBackups: 10,
};

const CRON_JOB_NAME = 'auto-backup';

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly backupDir: string;
  private readonly configFile: string;

  constructor(private schedulerRegistry: SchedulerRegistry) {
    this.backupDir = process.env.BACKUP_DIR ?? path.join(process.cwd(), 'backups');
    this.configFile = path.join(this.backupDir, 'schedule.json');
    fs.mkdirSync(this.backupDir, { recursive: true });
  }

  async onModuleInit() {
    const config = this.readConfig();
    if (config.enabled && config.cronExpression) {
      this.applyCronJob(config.cronExpression);
    }
  }

  // ── Config ────────────────────────────────────────────────────────────────

  readConfig(): BackupConfig {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(this.configFile, 'utf8')) };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  private writeConfig(config: BackupConfig) {
    fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
  }

  getSchedule(): BackupConfig {
    return this.readConfig();
  }

  setSchedule(dto: Partial<BackupConfig>): BackupConfig {
    const config = { ...this.readConfig(), ...dto };
    this.writeConfig(config);
    if (config.enabled && config.cronExpression) {
      this.applyCronJob(config.cronExpression);
    } else {
      this.removeCronJob();
    }
    return config;
  }

  // ── Cron management ───────────────────────────────────────────────────────

  private applyCronJob(expression: string) {
    this.removeCronJob();
    const job = new CronJob(expression, () => this.runScheduledBackup());
    this.schedulerRegistry.addCronJob(CRON_JOB_NAME, job as any);
    job.start();
    console.log(`[Backup] Scheduled: ${expression}`);
  }

  private removeCronJob() {
    try {
      this.schedulerRegistry.deleteCronJob(CRON_JOB_NAME);
    } catch {}
  }

  private async runScheduledBackup() {
    console.log('[Backup] Running scheduled backup...');
    try {
      await this.runBackup();
      const config = this.readConfig();
      config.lastRunAt = new Date().toISOString();
      this.writeConfig(config);
      this.pruneOldBackups(config.maxBackups);
      console.log('[Backup] Scheduled backup completed.');
    } catch (e) {
      console.error('[Backup] Scheduled backup failed:', e.message);
    }
  }

  // ── Backup operations ─────────────────────────────────────────────────────

  async runBackup(): Promise<BackupMeta> {
    const { host, port, user, password, database } = this.dbEnv();
    const date = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const filename = `backup_${database}_${date}.dump`;
    const filepath = path.join(this.backupDir, filename);

    execSync(
      `pg_dump -h ${host} -p ${port} -U ${user} -F c -f "${filepath}" ${database}`,
      { env: { ...process.env, PGPASSWORD: password } },
    );

    const stat = fs.statSync(filepath);
    return { filename, size: stat.size, createdAt: stat.mtime.toISOString() };
  }

  getLiveBackup(): Buffer {
    const { host, port, user, password, database } = this.dbEnv();
    return execSync(
      `pg_dump -h ${host} -p ${port} -U ${user} ${database}`,
      { env: { ...process.env, PGPASSWORD: password }, maxBuffer: 200 * 1024 * 1024 },
    );
  }

  listBackups(): BackupMeta[] {
    return fs.readdirSync(this.backupDir)
      .filter(f => f.endsWith('.dump') || f.endsWith('.sql'))
      .map(f => {
        const stat = fs.statSync(path.join(this.backupDir, f));
        return { filename: f, size: stat.size, createdAt: stat.mtime.toISOString() };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getFilePath(filename: string): string {
    return path.join(this.backupDir, path.basename(filename));
  }

  deleteBackup(filename: string) {
    fs.unlinkSync(this.getFilePath(filename));
  }

  private pruneOldBackups(max: number) {
    const files = this.listBackups();
    files.slice(max).forEach(f => {
      try { fs.unlinkSync(path.join(this.backupDir, f.filename)); } catch {}
    });
  }

  private dbEnv() {
    return {
      host: process.env.DB_HOST!,
      port: process.env.DB_PORT || '5432',
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
    };
  }
}
