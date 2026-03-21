import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { House } from './houses.entity';
import { User } from '../users/users.entity';
import { HousesService } from './houses.service';
import { HousesController } from './houses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([House, User])],
  controllers: [HousesController],
  providers: [HousesService],
  exports: [HousesService],
})
export class HousesModule {}
