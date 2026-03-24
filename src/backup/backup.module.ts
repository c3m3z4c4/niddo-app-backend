import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

@Module({
  imports: [ScheduleModule],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
