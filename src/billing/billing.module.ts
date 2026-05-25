import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CondominiumLicense } from './condominium-license.entity';
import { PlatformSettings } from './platform-settings.entity';
import { SaasPayment } from './saas-payment.entity';

import { House } from '../houses/houses.entity';

// Ensure upload directory exists at module load time
const proofsDir = resolve(process.cwd(), 'uploads', 'saas-proofs');
if (!existsSync(proofsDir)) mkdirSync(proofsDir, { recursive: true });

@Module({
  imports: [
    TypeOrmModule.forFeature([CondominiumLicense, PlatformSettings, SaasPayment, House]),
    MulterModule.register({ dest: proofsDir }),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
