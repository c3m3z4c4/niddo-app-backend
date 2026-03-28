import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { RsvpsService } from './rsvps.service';
import { UpsertRsvpDto } from './dto/upsert-rsvp.dto';

@Controller('rsvps')
@UseGuards(JwtAuthGuard)
export class RsvpsController {
  constructor(private rsvpsService: RsvpsService) {}

  @Get()
  findAll(@Request() req) {
    return this.rsvpsService.findAllForUser(req.user.userId);
  }

  @Get(':targetType/:targetId/attendance')
  @UseGuards(RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  getAttendance(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    return this.rsvpsService.findAllForTargetWithUsers(targetType, targetId);
  }

  @Post()
  upsert(@Request() req, @Body() dto: UpsertRsvpDto) {
    return this.rsvpsService.upsert(req.user.userId, dto);
  }

  @Delete(':targetType/:targetId')
  remove(
    @Request() req,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    return this.rsvpsService.remove(req.user.userId, targetType, targetId);
  }
}
