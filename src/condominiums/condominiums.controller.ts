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
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Controller('condominiums')
export class CondominiumsController {
  constructor(
    private readonly service: CondominiumsService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

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

  /** PLATFORM_ADMIN only: backfill condominiumId for all legacy rows */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PLATFORM_ADMIN)
  @Post(':id/backfill')
  async backfill(@Param('id') condominiumId: string) {
    const tables = [
      'houses', 'green_area_events', 'meetings', 'rsvps',
      'dues_config', 'dues_payments', 'dues_promotions', 'dues_policy',
      'extraordinary_income', 'green_area_reservations', 'projects',
      'direct_messages', 'notifications',
    ];
    const results: Record<string, number> = {};
    for (const table of tables) {
      try {
        await this.dataSource.query(
          `UPDATE "${table}" SET "condominiumId" = $1 WHERE "condominiumId" IS NULL`,
          [condominiumId],
        );
        const [{ count }] = await this.dataSource.query(
          `SELECT COUNT(*) AS count FROM "${table}" WHERE "condominiumId" = $1`,
          [condominiumId],
        );
        results[table] = parseInt(count, 10);
      } catch (err: any) {
        results[table] = err.message; // return error message for diagnosis
      }
    }
    // Also backfill users
    await this.dataSource.query(
      `UPDATE users SET "condominiumId" = $1 WHERE "condominiumId" IS NULL AND role NOT IN ('PLATFORM_ADMIN')`,
      [condominiumId],
    );
    const [{ userCount }] = await this.dataSource.query(
      `SELECT COUNT(*) AS "userCount" FROM users WHERE "condominiumId" = $1`,
      [condominiumId],
    );
    results['users'] = parseInt(userCount, 10);
    return { condominiumId, results };
  }
}
