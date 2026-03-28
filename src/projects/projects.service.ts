import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Role } from '../auth/roles.enum';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
  ) {}

  async findAll(userRole: Role, condominiumId: string | null): Promise<Project[]> {
    const condoFilter = condominiumId ? { condominiumId } : {};
    if (userRole === Role.RESIDENT) {
      return this.projectRepo.find({
        where: { visibleToVecinos: true, ...condoFilter },
        order: { updatedAt: 'DESC' },
      });
    }
    return this.projectRepo.find({
      where: condoFilter,
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string, userRole: Role, condominiumId: string | null): Promise<Project> {
    const where: any = { id };
    if (condominiumId) where.condominiumId = condominiumId;
    const project = await this.projectRepo.findOne({ where });
    if (!project) throw new NotFoundException(`Proyecto con id ${id} no encontrado`);
    if (userRole === Role.RESIDENT && !project.visibleToVecinos) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
    return project;
  }

  async create(dto: CreateProjectDto, userId: string, condominiumId: string | null): Promise<Project> {
    const project = this.projectRepo.create({
      ...dto,
      createdById: userId,
      condominiumId: condominiumId ?? undefined,
    });
    return this.projectRepo.save(project);
  }

  async update(id: string, dto: UpdateProjectDto, condominiumId: string | null): Promise<Project> {
    const where: any = { id };
    if (condominiumId) where.condominiumId = condominiumId;
    const project = await this.projectRepo.findOne({ where });
    if (!project) throw new NotFoundException(`Proyecto con id ${id} no encontrado`);
    if ((dto as any).status === 'completed') {
      (dto as any).completionPercentage = 100;
    }
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  async remove(id: string, condominiumId: string | null): Promise<void> {
    const where: any = { id };
    if (condominiumId) where.condominiumId = condominiumId;
    const project = await this.projectRepo.findOne({ where });
    if (!project) throw new NotFoundException(`Proyecto con id ${id} no encontrado`);
    await this.projectRepo.remove(project);
  }

  async toggleVisibility(id: string, condominiumId: string | null): Promise<Project> {
    const where: any = { id };
    if (condominiumId) where.condominiumId = condominiumId;
    const project = await this.projectRepo.findOne({ where });
    if (!project) throw new NotFoundException(`Proyecto con id ${id} no encontrado`);
    project.visibleToVecinos = !project.visibleToVecinos;
    return this.projectRepo.save(project);
  }
}
