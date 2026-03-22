import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReviewReservationDto } from './dto/review-reservation.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Post()
  create(@Body() dto: CreateReservationDto, @Request() req) {
    return this.service.create(dto, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user);
  }

  @Patch(':id/review')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  review(
    @Param('id') id: string,
    @Body() dto: ReviewReservationDto,
    @Request() req,
  ) {
    return this.service.review(id, dto, req.user);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @Request() req) {
    return this.service.cancel(id, req.user);
  }
}
