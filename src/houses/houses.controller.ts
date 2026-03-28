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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { HousesService } from './houses.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';
import { ImportHousesDto } from './dto/import-houses.dto';
import { AssignResidentsDto } from './dto/assign-residents.dto';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('houses')
export class HousesController {
  constructor(private readonly housesService: HousesService) {}

  @Get()
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  findAll(@CurrentTenant() condominiumId: string | null) {
    return this.housesService.findAll(condominiumId);
  }

  @Get(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  findOne(@Param('id') id: string, @CurrentTenant() condominiumId: string | null) {
    return this.housesService.findOne(id, condominiumId);
  }

  @Post()
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  create(@Body() dto: CreateHouseDto, @CurrentTenant() condominiumId: string | null) {
    return this.housesService.create(dto, condominiumId);
  }

  @Patch(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHouseDto,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.housesService.update(id, dto, condominiumId);
  }

  @Patch(':id/residents')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  assignResidents(
    @Param('id') id: string,
    @Body() dto: AssignResidentsDto,
    @CurrentTenant() condominiumId: string | null,
  ) {
    return this.housesService.assignResidents(id, dto.userIds, condominiumId);
  }

  @Post('import')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  importHouses(@Body() dto: ImportHousesDto, @CurrentTenant() condominiumId: string | null) {
    return this.housesService.importHouses(dto.houses, condominiumId);
  }

  @Delete(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  remove(@Param('id') id: string, @CurrentTenant() condominiumId: string | null) {
    return this.housesService.remove(id, condominiumId);
  }
}
