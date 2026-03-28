import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Condominium } from './condominium.entity';
import { CondominiumsService } from './condominiums.service';
import { CondominiumsController } from './condominiums.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Condominium])],
  controllers: [CondominiumsController],
  providers: [CondominiumsService],
  exports: [CondominiumsService, TypeOrmModule],
})
export class CondominiumsModule {}
