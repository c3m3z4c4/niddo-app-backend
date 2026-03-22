import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GreenAreaReservation } from './reservation.entity';
import { DuesPayment } from '../dues/dues-payment.entity';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GreenAreaReservation, DuesPayment])],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
