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
import { CloseReservationDto } from './dto/close-reservation.dto';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Post()
  create(
    @Body() dto: CreateReservationDto,
    @Request() req,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.service.create(dto, req.user, condominiumId);
  }

  @Get()
  findAll(@Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.service.findAll(req.user, condominiumId);
  }

  @Patch(':id/review')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  review(
    @Param('id') id: string,
    @Body() dto: ReviewReservationDto,
    @Request() req,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.service.review(id, dto, req.user, condominiumId);
  }

  @Patch(':id/close')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  close(
    @Param('id') id: string,
    @Body() dto: CloseReservationDto,
    @Request() req,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.service.close(id, dto, req.user, condominiumId);
  }

  @Delete(':id')
  cancel(
    @Param('id') id: string,
    @Request() req,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.service.cancel(id, req.user, condominiumId);
  }
}
