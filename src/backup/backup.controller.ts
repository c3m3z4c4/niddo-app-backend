import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { execSync } from 'child_process';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('backup')
export class BackupController {
  @Get('download')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  downloadBackup(@Res() res: Response) {
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT || '5432';
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_NAME;

    const date = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const filename = `backup_${database}_${date}.sql`;

    const dump = execSync(
      `pg_dump -h ${host} -p ${port} -U ${user} ${database}`,
      { env: { ...process.env, PGPASSWORD: password }, maxBuffer: 200 * 1024 * 1024 },
    );

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(dump);
  }
}
