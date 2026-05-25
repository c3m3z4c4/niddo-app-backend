import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ProjectsService } from './projects.service';
import { Project } from './project.entity';
import { Role } from '../auth/roles.enum';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const baseProject: Project = {
  id: 'proj-1',
  name: 'Reparación de banquetas',
  description: 'Arreglar banquetas dañadas',
  completionPercentage: 30,
  status: 'started',
  visibleToVecinos: true,
  createdById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(), condominiumId: null, condominium: null as any,
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    jest.clearAllMocks();
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all projects for ADMIN', async () => {
      mockRepo.find.mockResolvedValue([baseProject]);

      const result = await service.findAll(Role.CONDO_ADMIN);

      expect(result).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: { updatedAt: 'DESC' } }),
      );
    });

    it('should return only visible projects for VECINO', async () => {
      mockRepo.find.mockResolvedValue([baseProject]);

      const result = await service.findAll(Role.RESIDENT);

      expect(result).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { visibleToVecinos: true },
        order: { updatedAt: 'DESC' },
      });
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return project when found by ADMIN', async () => {
      mockRepo.findOne.mockResolvedValue(baseProject);

      const result = await service.findOne('proj-1', Role.CONDO_ADMIN);

      expect(result.id).toBe('proj-1');
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id', Role.CONDO_ADMIN)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when VECINO tries to access hidden project', async () => {
      mockRepo.findOne.mockResolvedValue({ ...baseProject, visibleToVecinos: false });

      await expect(service.findOne('proj-1', Role.RESIDENT)).rejects.toThrow(ForbiddenException);
    });

    it('should return project when VECINO accesses a visible project', async () => {
      mockRepo.findOne.mockResolvedValue({ ...baseProject, visibleToVecinos: true });

      const result = await service.findOne('proj-1', Role.RESIDENT);

      expect(result.id).toBe('proj-1');
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateProjectDto = {
      name: 'Pintura de barda',
      description: 'Repintar la barda perimetral',
      completionPercentage: 0,
      status: 'planned',
      visibleToVecinos: false,
    };

    it('should create and return project', async () => {
      mockRepo.create.mockReturnValue({ ...baseProject, ...dto });
      mockRepo.save.mockResolvedValue({ ...baseProject, ...dto });

      const result = await service.create(dto, 'user-1');

      expect(result.name).toBe('Pintura de barda');
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ createdById: 'user-1' }));
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NotFoundException when project does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.update('bad-id', {} as UpdateProjectDto)).rejects.toThrow(NotFoundException);
    });

    it('should update and return project', async () => {
      mockRepo.findOne.mockResolvedValue(baseProject);
      mockRepo.save.mockResolvedValue({ ...baseProject, name: 'Actualizado' });

      const result = await service.update('proj-1', { name: 'Actualizado' });

      expect(result.name).toBe('Actualizado');
    });

    it('should set completionPercentage to 100 when status is completed', async () => {
      const project = { ...baseProject };
      mockRepo.findOne.mockResolvedValue(project);
      mockRepo.save.mockImplementation(async (p) => p);

      await service.update('proj-1', { status: 'completed' } as UpdateProjectDto);

      expect(project.completionPercentage).toBe(100);
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should throw NotFoundException when project does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should remove the project', async () => {
      mockRepo.findOne.mockResolvedValue(baseProject);
      mockRepo.remove.mockResolvedValue(undefined);

      await service.remove('proj-1');

      expect(mockRepo.remove).toHaveBeenCalledWith(baseProject);
    });
  });

  // ─── toggleVisibility ────────────────────────────────────────────────────────

  describe('toggleVisibility', () => {
    it('should throw NotFoundException when project does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.toggleVisibility('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should toggle visibleToVecinos from true to false', async () => {
      const project = { ...baseProject, visibleToVecinos: true };
      mockRepo.findOne.mockResolvedValue(project);
      mockRepo.save.mockImplementation(async (p) => p);

      const result = await service.toggleVisibility('proj-1');

      expect(result.visibleToVecinos).toBe(false);
    });

    it('should toggle visibleToVecinos from false to true', async () => {
      const project = { ...baseProject, visibleToVecinos: false };
      mockRepo.findOne.mockResolvedValue(project);
      mockRepo.save.mockImplementation(async (p) => p);

      const result = await service.toggleVisibility('proj-1');

      expect(result.visibleToVecinos).toBe(true);
    });
  });
});
