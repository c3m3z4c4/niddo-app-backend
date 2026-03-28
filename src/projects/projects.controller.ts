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

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req) {
    return this.projectsService.findAll(req.user.role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req) {
    return this.projectsService.findOne(id, req.user.role);
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
  create(@Body() dto: CreateProjectDto, @Request() req) {
    return this.projectsService.create(dto, req.user.sub);
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
  toggleVisibility(@Param('id') id: string) {
    return this.projectsService.toggleVisibility(id);
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
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
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
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
