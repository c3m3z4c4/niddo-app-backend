import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread-count')
  getUnreadCount(@Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.notificationsService.getUnreadCount(req.user.userId, condominiumId);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.notificationsService.markAllAsRead(req.user.userId, condominiumId);
  }

  @Get()
  findAll(@Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.notificationsService.findAllForUser(req.user.userId, condominiumId);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Request() req,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.notificationsService.markAsRead(id, req.user.userId, condominiumId);
  }
}
