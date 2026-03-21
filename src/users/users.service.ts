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
import { Role, UNIQUE_ROLES } from '../auth/roles.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private async ensureUniqueRole(role: Role, excludeUserId?: string) {
    if (!UNIQUE_ROLES.includes(role)) return;
    const existing = await this.usersRepository.findOne({ where: { role } });
    if (existing && existing.id !== excludeUserId) {
      throw new ConflictException(
        `Ya existe un usuario con el rol ${role}`,
      );
    }
  }

  private sanitize(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }

  async findAll() {
    const users = await this.usersRepository.find({
      relations: ['house'],
      order: { createdAt: 'DESC' },
    });
    return users.map(this.sanitize);
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['house'],
    });
    if (!user) throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    return this.sanitize(user);
  }

  async create(dto: CreateUserDto, requestingRole: Role) {
    // Only SUPER_ADMIN can create other admins or super_admins
    if (
      dto.role &&
      dto.role !== Role.VECINO &&
      requestingRole !== Role.SUPER_ADMIN
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
      await this.ensureUniqueRole(dto.role);
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      name: dto.name,
      lastName: dto.lastName,
      email: dto.email,
      password: hashed,
      phone: dto.phone,
      address: dto.address,
      role: dto.role ?? Role.VECINO,
      houseId: dto.houseId || undefined,
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
      dto.role !== Role.VECINO &&
      requestingRole !== Role.SUPER_ADMIN
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
      await this.ensureUniqueRole(dto.role, id);
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

  // Used internally for seeding
  async createSuperAdmin(
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
      role: Role.SUPER_ADMIN,
      isActive: true,
    });
    await this.usersRepository.save(user);
  }

  async createSeedVecino(
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
      role: Role.VECINO,
      isActive: true,
    });
    await this.usersRepository.save(user);
  }
}
