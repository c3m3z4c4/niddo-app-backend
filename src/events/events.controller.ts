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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentTenant() condominiumId: string | null) {
    return this.eventsService.findAll(condominiumId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentTenant() condominiumId: string | null) {
    return this.eventsService.findOne(id, condominiumId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  create(
    @Body() dto: CreateEventDto,
    @Request() req: any,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.eventsService.create(dto, req.user?.id, condominiumId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.eventsService.update(id, dto, condominiumId);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.eventsService.cancel(id, body?.reason, condominiumId);
  }

  @Patch(':id/postpone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  postpone(
    @Param('id') id: string,
    @Body() body: { date: string; startTime: string; endTime?: string },
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.eventsService.postpone(id, body, condominiumId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  remove(@Param('id') id: string, @CurrentTenant() condominiumId: string | null) {
    return this.eventsService.remove(id, condominiumId);
  }
}
