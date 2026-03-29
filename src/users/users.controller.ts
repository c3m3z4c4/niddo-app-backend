import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ImportUsersBodyDto } from './dto/import-users-body.dto';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

const AVATARS_DIR = join(process.cwd(), 'uploads', 'avatars');

const avatarStorage = diskStorage({
  destination: (_req, _file, cb) => {
    if (!existsSync(AVATARS_DIR)) mkdirSync(AVATARS_DIR, { recursive: true });
    cb(null, AVATARS_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Own profile (any authenticated user) ─────────────────────────────────

  @Get('me')
  getMe(@Request() req) {
    return this.usersService.getMe(req.user.userId);
  }

  @Patch('me')
  updateMe(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMe(req.user.userId, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp|gif)$/)) {
        return cb(new BadRequestException('Solo se permiten imágenes (jpg, png, webp, gif)'), false);
      }
      cb(null, true);
    },
  }))
  uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return this.usersService.updateAvatar(req.user.userId, file.filename);
  }

  // ─── Admin CRUD ────────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  findAll(@CurrentTenant() condominiumId: string | null) {
    return this.usersService.findAll(condominiumId);
  }

  @Get(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  findOne(@Param('id') id: string, @CurrentTenant() condominiumId: string | null) {
    return this.usersService.findOne(id, condominiumId);
  }

  @Post()
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  create(@Body() dto: CreateUserDto, @Request() req) {
    return this.usersService.create(dto, req.user.role);
  }

  @Post('import')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  importUsers(@Body() body: ImportUsersBodyDto) {
    return this.usersService.importUsers(body.users);
  }

  @Patch(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req) {
    return this.usersService.update(id, dto, req.user.role);
  }

  @Delete('all-residents')
  @Roles(Role.PLATFORM_ADMIN)
  deleteAllResidents(@CurrentTenant() condominiumId: string | null) {
    return this.usersService.deleteAllResidents(condominiumId);
  }

  @Delete(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
