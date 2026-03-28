import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

const CONDO_ADMIN_ROLES = [
  Role.PLATFORM_ADMIN,
  Role.CONDO_ADMIN,
  Role.PRESIDENTE,
  Role.SECRETARIO,
  Role.TESORERO,
];

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(RolesGuard)
  @Roles(...CONDO_ADMIN_ROLES)
  @Post()
  send(
    @Request() req,
    @Body() dto: CreateMessageDto,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.messagesService.send(req.user.userId, dto, condominiumId);
  }

  @Get('inbox')
  getInbox(@Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.messagesService.getInbox(req.user.userId, condominiumId);
  }

  @UseGuards(RolesGuard)
  @Roles(...CONDO_ADMIN_ROLES)
  @Get('sent')
  getSent(@Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.messagesService.getSent(req.user.userId, condominiumId);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.messagesService.getUnreadCount(req.user.userId, condominiumId);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.messagesService.markAllAsRead(req.user.userId, condominiumId);
  }

  @Get(':id')
  getOne(
    @Param('id') id: string,
    @Request() req,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.messagesService.getOne(id, req.user.userId, condominiumId);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Request() req,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.messagesService.markAsRead(id, req.user.userId, condominiumId);
  }
}
