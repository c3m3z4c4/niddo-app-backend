import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CondominiumsService } from './condominiums.service';
import { CreateCondominiumDto } from './dto/create-condominium.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('condominiums')
export class CondominiumsController {
  constructor(private readonly service: CondominiumsService) {}

  /** Public: fetch branding by slug (used by frontend on load) */
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  /** Public: fetch branding by id — used after login when user has condominiumId */
  @Get(':id/public')
  findPublic(@Param('id') id: string) {
    return this.service.findPublic(id);
  }

  /** PLATFORM_ADMIN only: list all condominiums */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /** PLATFORM_ADMIN only: aggregate SaaS KPIs */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN)
  @Get('stats')
  getPlatformStats() {
    return this.service.getPlatformStats();
  }

  /** PLATFORM_ADMIN only: get one condominium */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /** PLATFORM_ADMIN only: create condominium */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN)
  @Post()
  create(@Body() dto: CreateCondominiumDto) {
    return this.service.create(dto);
  }

  /** PLATFORM_ADMIN or CONDO_ADMIN: update info */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateCondominiumDto>) {
    return this.service.update(id, dto);
  }

  /** PLATFORM_ADMIN or CONDO_ADMIN: update branding */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE)
  @Patch(':id/branding')
  updateBranding(@Param('id') id: string, @Body() dto: UpdateBrandingDto) {
    return this.service.updateBranding(id, dto);
  }

  /** PLATFORM_ADMIN only: delete condominium */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
