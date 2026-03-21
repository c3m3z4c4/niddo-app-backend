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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('houses')
export class HousesController {
  constructor(private readonly housesService: HousesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  findAll() {
    return this.housesService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  findOne(@Param('id') id: string) {
    return this.housesService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  create(@Body() dto: CreateHouseDto) {
    return this.housesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  update(@Param('id') id: string, @Body() dto: UpdateHouseDto) {
    return this.housesService.update(id, dto);
  }

  @Patch(':id/residents')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  assignResidents(@Param('id') id: string, @Body() dto: AssignResidentsDto) {
    return this.housesService.assignResidents(id, dto.userIds);
  }

  @Post('import')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  importHouses(@Body() dto: ImportHousesDto) {
    return this.housesService.importHouses(dto.houses);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  remove(@Param('id') id: string) {
    return this.housesService.remove(id);
  }
}
