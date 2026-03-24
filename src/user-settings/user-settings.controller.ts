import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserSettingsService } from './user-settings.service';

@UseGuards(JwtAuthGuard)
@Controller('user-settings')
export class UserSettingsController {
  constructor(private readonly service: UserSettingsService) {}

  @Get()
  getSettings(@Request() req) {
    return this.service.getSettings(req.user.userId);
  }

  @Patch()
  updateSettings(@Request() req, @Body() body: Record<string, any>) {
    return this.service.updateSettings(req.user.userId, body);
  }
}
