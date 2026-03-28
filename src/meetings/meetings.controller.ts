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
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentTenant() condominiumId: string | null) {
    return this.meetingsService.findAll(condominiumId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentTenant() condominiumId: string | null) {
    return this.meetingsService.findOne(id, condominiumId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  create(
    @Body() dto: CreateMeetingDto,
    @Request() req: any,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.meetingsService.create(dto, req.user?.id, condominiumId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.meetingsService.update(id, dto, condominiumId);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.meetingsService.cancel(id, body?.reason, condominiumId);
  }

  @Patch(':id/postpone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  postpone(
    @Param('id') id: string,
    @Body() body: { date: string; startTime: string; endTime?: string },
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.meetingsService.postpone(id, body, condominiumId);
  }

  @Post(':id/send-invitation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  sendInvitation(
    @Param('id') id: string,
    @Body() body: { emails?: string[] },
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.meetingsService.sendInvitation(id, condominiumId, body?.emails);
  }

  @Post(':id/draft-minutes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  draftMinutes(@Param('id') id: string, @CurrentTenant() condominiumId: string | null) {
    return this.meetingsService.draftMinutes(id, condominiumId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  remove(@Param('id') id: string, @CurrentTenant() condominiumId: string | null) {
    return this.meetingsService.remove(id, condominiumId);
  }
}
