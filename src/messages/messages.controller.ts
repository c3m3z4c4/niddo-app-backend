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

const ADMIN_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.PRESIDENTE,
  Role.SECRETARIO,
  Role.TESORERO,
];

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Post()
  send(@Request() req, @Body() dto: CreateMessageDto) {
    return this.messagesService.send(req.user.userId, dto);
  }

  @Get('inbox')
  getInbox(@Request() req) {
    return this.messagesService.getInbox(req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('sent')
  getSent(@Request() req) {
    return this.messagesService.getSent(req.user.userId);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.messagesService.getUnreadCount(req.user.userId);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req) {
    return this.messagesService.markAllAsRead(req.user.userId);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Request() req) {
    return this.messagesService.getOne(id, req.user.userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.messagesService.markAsRead(id, req.user.userId);
  }
}
