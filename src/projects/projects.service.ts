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

  async findAll(userRole: Role): Promise<Project[]> {
    if (userRole === Role.RESIDENT) {
      return this.projectRepo.find({
        where: { visibleToVecinos: true },
        order: { updatedAt: 'DESC' },
      });
    }
    return this.projectRepo.find({ order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string, userRole: Role): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException(`Proyecto con id ${id} no encontrado`);
    if (userRole === Role.RESIDENT && !project.visibleToVecinos) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
    return project;
  }

  async create(dto: CreateProjectDto, userId: string): Promise<Project> {
    const project = this.projectRepo.create({ ...dto, createdById: userId });
    return this.projectRepo.save(project);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException(`Proyecto con id ${id} no encontrado`);
    if ((dto as any).status === 'completed') {
      (dto as any).completionPercentage = 100;
    }
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException(`Proyecto con id ${id} no encontrado`);
    await this.projectRepo.remove(project);
  }

  async toggleVisibility(id: string): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException(`Proyecto con id ${id} no encontrado`);
    project.visibleToVecinos = !project.visibleToVecinos;
    return this.projectRepo.save(project);
  }
}
