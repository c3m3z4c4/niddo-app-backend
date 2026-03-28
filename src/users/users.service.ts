import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './users.entity';
import { House } from '../houses/houses.entity';
import { Role, UNIQUE_ROLES } from '../auth/roles.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ImportUserDto } from './dto/import-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(House)
    private housesRepository: Repository<House>,
  ) {}

  private async ensureUniqueRole(role: Role, condominiumId: string | null, excludeUserId?: string) {
    if (!UNIQUE_ROLES.includes(role)) return;
    // Unique roles are scoped per condominium
    const existing = await this.usersRepository.findOne({
      where: { role, condominiumId: condominiumId ?? undefined },
    });
    if (existing && existing.id !== excludeUserId) {
      throw new ConflictException(
        `Ya existe un usuario con el rol ${role} en este condominio`,
      );
    }
  }

  private sanitize(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }

  async findAll(condominiumId?: string | null) {
    const where: any = {};
    if (condominiumId) where.condominiumId = condominiumId;
    const users = await this.usersRepository.find({
      where: Object.keys(where).length > 0 ? where : undefined,
      relations: ['house'],
      order: { createdAt: 'DESC' },
    });
    return users.map(this.sanitize);
  }

  async findOne(id: string, condominiumId?: string | null) {
    const where: any = { id };
    if (condominiumId) where.condominiumId = condominiumId;
    const user = await this.usersRepository.findOne({
      where,
      relations: ['house'],
    });
    if (!user) throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    return this.sanitize(user);
  }

  async create(dto: CreateUserDto, requestingRole: Role) {
    // Only SUPER_ADMIN can create other admins or super_admins
    if (
      dto.role &&
      dto.role !== Role.RESIDENT &&
      requestingRole !== Role.PLATFORM_ADMIN
    ) {
      throw new ForbiddenException(
        'Solo el super administrador puede crear administradores',
      );
    }

    const exists = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (exists)
      throw new ConflictException(
        `El correo "${dto.email}" ya está registrado`,
      );

    if (dto.role) {
      await this.ensureUniqueRole(dto.role, (dto as any).condominiumId ?? null);
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      name: dto.name,
      lastName: dto.lastName,
      email: dto.email,
      password: hashed,
      phone: dto.phone,
      address: dto.address,
      role: dto.role ?? Role.RESIDENT,
      houseId: dto.houseId || undefined,
      condominiumId: (dto as any).condominiumId ?? null,
    });

    const saved = await this.usersRepository.save(user);
    return this.sanitize(saved);
  }

  async update(id: string, dto: UpdateUserDto, requestingRole: Role) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario con id ${id} no encontrado`);

    // Only SUPER_ADMIN can change roles to ADMIN/SUPER_ADMIN
    if (
      dto.role &&
      dto.role !== Role.RESIDENT &&
      requestingRole !== Role.PLATFORM_ADMIN
    ) {
      throw new ForbiddenException(
        'Solo el super administrador puede cambiar roles de administrador',
      );
    }

    if (dto.email && dto.email !== user.email) {
      const exists = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (exists)
        throw new ConflictException(
          `El correo "${dto.email}" ya está registrado`,
        );
    }

    if (dto.role) {
      await this.ensureUniqueRole(dto.role, user.condominiumId, id);
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, {
      ...dto,
      houseId: dto.houseId !== undefined ? dto.houseId || null : user.houseId,
    });

    const saved = await this.usersRepository.save(user);
    return this.sanitize(saved);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    await this.usersRepository.remove(user);
  }

  async importUsers(
    dtos: ImportUserDto[],
  ): Promise<{ created: number; updated: number; skipped: number; skippedEmails: string[] }> {
    const houses = await this.housesRepository.find();
    const houseByNumber = new Map(houses.map((h) => [h.houseNumber, h.id]));

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const skippedEmails: string[] = [];

    const DEFAULT_PASSWORD = 'Bienvenido2026!';
    const PLACEHOLDER = 'Por Llenar';

    for (const dto of dtos) {
      const exists = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (exists) {
        const newName = dto.name && dto.name !== PLACEHOLDER ? dto.name : null;
        const newLastName = dto.lastName && dto.lastName !== PLACEHOLDER ? dto.lastName : null;
        const newPhone = dto.phone && dto.phone !== PLACEHOLDER && dto.phone !== '-' ? dto.phone : null;
        const needsUpdate =
          (exists.name === PLACEHOLDER && newName) ||
          (exists.lastName === PLACEHOLDER && newLastName) ||
          (!exists.phone && newPhone);
        if (needsUpdate) {
          if (exists.name === PLACEHOLDER && newName) exists.name = newName;
          if (exists.lastName === PLACEHOLDER && newLastName) exists.lastName = newLastName;
          if (!exists.phone && newPhone) exists.phone = newPhone;
          await this.usersRepository.save(exists);
          updated++;
        } else {
          skipped++;
          skippedEmails.push(dto.email);
        }
        continue;
      }

      const rawPassword = dto.password && dto.password !== PLACEHOLDER
        ? dto.password
        : DEFAULT_PASSWORD;
      const hashed = await bcrypt.hash(rawPassword, 10);
      const houseId = dto.houseNumber
        ? houseByNumber.get(dto.houseNumber)
        : undefined;

      const user = this.usersRepository.create({
        name: dto.name || PLACEHOLDER,
        lastName: dto.lastName || PLACEHOLDER,
        email: dto.email,
        password: hashed,
        phone: dto.phone && dto.phone !== PLACEHOLDER ? dto.phone : undefined,
        role: dto.role ?? Role.RESIDENT,
        houseId: houseId || undefined,
      });
      await this.usersRepository.save(user);
      created++;
    }

    return { created, updated, skipped, skippedEmails };
  }

  async getMe(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['houses'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.sanitize(user);
  }

  async updateMe(id: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(user, dto);
    const saved = await this.usersRepository.save(user);
    return this.sanitize(saved);
  }

  async updateAvatar(id: string, filename: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.avatarUrl = `/uploads/avatars/${filename}`;
    const saved = await this.usersRepository.save(user);
    return { avatarUrl: saved.avatarUrl };
  }

  // Used internally for seeding
  async createPlatformAdmin(
    name: string,
    lastName: string,
    email: string,
    password: string,
  ): Promise<void> {
    const exists = await this.usersRepository.findOne({ where: { email } });
    if (exists) return;

    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      name,
      lastName,
      email,
      password: hashed,
      role: Role.PLATFORM_ADMIN,
      isActive: true,
    });
    await this.usersRepository.save(user);
  }

  async createSeedResident(
    name: string,
    lastName: string,
    email: string,
    password: string,
    condominiumId: string,
  ): Promise<void> {
    const exists = await this.usersRepository.findOne({ where: { email } });
    if (exists) {
      // Backfill condominiumId if missing
      if (!exists.condominiumId) {
        exists.condominiumId = condominiumId;
        await this.usersRepository.save(exists);
      }
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      name,
      lastName,
      email,
      password: hashed,
      role: Role.RESIDENT,
      isActive: true,
      condominiumId,
    });
    await this.usersRepository.save(user);
  }
}
