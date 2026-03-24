import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  Res, UseGuards, NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { BackupService } from './backup.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  /** Live SQL download (plain text, same as before) */
  @Get('download')
  downloadLive(@Res() res: Response) {
    const dump = this.backupService.getLiveBackup();
    const date = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="backup_${date}.sql"`);
    res.send(dump);
  }

  /** Trigger an on-demand compressed backup and store it */
  @Post('trigger')
  async triggerBackup() {
    return this.backupService.runBackup();
  }

  /** List stored backups */
  @Get('list')
  listBackups() {
    return this.backupService.listBackups();
  }

  /** Download a stored backup file */
  @Get('file/:filename')
  downloadFile(@Param('filename') filename: string, @Res() res: Response) {
    const filepath = this.backupService.getFilePath(filename);
    if (!fs.existsSync(filepath)) throw new NotFoundException('Backup no encontrado');
    res.download(filepath, filename);
  }

  /** Delete a stored backup */
  @Delete('file/:filename')
  deleteFile(@Param('filename') filename: string) {
    const filepath = this.backupService.getFilePath(filename);
    if (!fs.existsSync(filepath)) throw new NotFoundException('Backup no encontrado');
    this.backupService.deleteBackup(filename);
    return { message: 'Backup eliminado' };
  }

  /** Get backup schedule config */
  @Get('schedule')
  getSchedule() {
    return this.backupService.getSchedule();
  }

  /** Update backup schedule config */
  @Patch('schedule')
  setSchedule(@Body() body: {
    enabled?: boolean;
    cronExpression?: string;
    maxBackups?: number;
  }) {
    return this.backupService.setSchedule(body);
  }
}
