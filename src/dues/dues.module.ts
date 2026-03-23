import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DuesConfig } from './dues-config.entity';
import { DuesPayment } from './dues-payment.entity';
import { DuesPromotion } from './dues-promotion.entity';
import { DuesPolicy } from './dues-policy.entity';
import { ExtraordinaryIncome } from './extraordinary-income.entity';
import { User } from '../users/users.entity';
import { House } from '../houses/houses.entity';
import { DuesService } from './dues.service';
import { DuesController } from './dues.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DuesConfig, DuesPayment, DuesPromotion, DuesPolicy, ExtraordinaryIncome, User, House])],
  controllers: [DuesController],
  providers: [DuesService],
  exports: [DuesService],
})
export class DuesModule {}
