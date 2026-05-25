import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { HousesService } from './houses.service';
import { House } from './houses.entity';
import { User } from '../users/users.entity';
import { CreateHouseDto } from './dto/create-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';

const baseHouse = {
  id: 'house-uuid-1',
  houseNumber: 'A-01',
  address: 'Calle Principal 1',
  status: 'active',
  residents: [],
  createdAt: new Date(),
  condominiumId: null as any,
  condominium: null as any,
};

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('HousesService', () => {
  let service: HousesService;

  const mockUserRepo = { find: jest.fn(), findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HousesService,
        { provide: getRepositoryToken(House), useValue: mockRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<HousesService>(HousesService);
    jest.clearAllMocks();
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all houses', async () => {
      mockRepo.find.mockResolvedValue([baseHouse]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].houseNumber).toBe('A-01');
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return house when found', async () => {
      mockRepo.findOne.mockResolvedValue(baseHouse);

      const result = await service.findOne('house-uuid-1');

      expect(result.id).toBe('house-uuid-1');
    });

    it('should throw NotFoundException when house does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateHouseDto = {
      houseNumber: 'B-02',
      address: 'Calle 2',
      status: 'active',
    };

    it('should create and return a house', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ ...baseHouse, houseNumber: 'B-02' });
      mockRepo.save.mockResolvedValue({ ...baseHouse, houseNumber: 'B-02' });

      const result = await service.create(dto);

      expect(result.houseNumber).toBe('B-02');
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when houseNumber already exists', async () => {
      mockRepo.findOne.mockResolvedValue(baseHouse);

      await expect(service.create({ ...dto, houseNumber: 'A-01' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should default status to active when not provided', async () => {
      const dtoNoStatus: CreateHouseDto = { houseNumber: 'C-03', address: 'Calle 3' };
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ ...baseHouse, houseNumber: 'C-03', status: 'active' });
      mockRepo.save.mockResolvedValue({ ...baseHouse, houseNumber: 'C-03', status: 'active' });

      const result = await service.create(dtoNoStatus);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' }),
      );
      expect(result.status).toBe('active');
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NotFoundException when house does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('bad-id', {} as UpdateHouseDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when new houseNumber is already taken', async () => {
      const anotherHouse = { ...baseHouse, id: 'house-uuid-2', houseNumber: 'B-02' };
      mockRepo.findOne
        .mockResolvedValueOnce(baseHouse)    // findOne inside findOne (base)
        .mockResolvedValueOnce(anotherHouse); // houseNumber conflict check

      await expect(
        service.update('house-uuid-1', { houseNumber: 'B-02' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should update and return house', async () => {
      mockRepo.findOne.mockResolvedValue(baseHouse);
      mockRepo.save.mockResolvedValue({ ...baseHouse, address: 'Nueva Calle' });

      const result = await service.update('house-uuid-1', { address: 'Nueva Calle' });

      expect(result.address).toBe('Nueva Calle');
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should throw NotFoundException when house does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should remove the house', async () => {
      mockRepo.findOne.mockResolvedValue(baseHouse);
      mockRepo.remove.mockResolvedValue(undefined);

      await service.remove('house-uuid-1');

      expect(mockRepo.remove).toHaveBeenCalledWith(baseHouse);
    });
  });
});
