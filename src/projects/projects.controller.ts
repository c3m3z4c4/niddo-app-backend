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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.projectsService.findAll(req.user.role, condominiumId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @Request() req,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.projectsService.findOne(id, req.user.role, condominiumId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.CONDO_ADMIN,
    Role.PRESIDENTE,
    Role.SECRETARIO,
    Role.TESORERO,
  )
  create(
    @Body() dto: CreateProjectDto,
    @Request() req,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.projectsService.create(dto, req.user.sub, condominiumId);
  }

  @Patch(':id/toggle-visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.CONDO_ADMIN,
    Role.PRESIDENTE,
    Role.SECRETARIO,
    Role.TESORERO,
  )
  toggleVisibility(@Param('id') id: string, @CurrentTenant() condominiumId: string | null) {
    return this.projectsService.toggleVisibility(id, condominiumId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.CONDO_ADMIN,
    Role.PRESIDENTE,
    Role.SECRETARIO,
    Role.TESORERO,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.projectsService.update(id, dto, condominiumId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.PLATFORM_ADMIN,
    Role.CONDO_ADMIN,
    Role.PRESIDENTE,
    Role.SECRETARIO,
    Role.TESORERO,
  )
  remove(@Param('id') id: string, @CurrentTenant() condominiumId: string | null) {
    return this.projectsService.remove(id, condominiumId);
  }
}
