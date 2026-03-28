import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { EventsService } from './events.service';
import { GreenAreaEvent } from './events.entity';
import { ConflictService } from '../shared/conflict.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateEventDto } from './dto/create-event.dto';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockConflictService = { checkConflict: jest.fn() };
const mockNotificationsService = { createForAllVecinos: jest.fn() };

const baseEvent = {
  id: 'evt-1',
  title: 'Feria del vecino',
  greenArea: 'Parque Central',
  date: '2025-05-10',
  startTime: '10:00',
  endTime: '12:00',
  description: 'Evento familiar',
  status: 'active',
  cancelReason: null as any,
  originalDate: null as any,
  originalStartTime: null as any,
  createdAt: new Date(),
  createdById: 'user-1',
};

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(GreenAreaEvent), useValue: mockRepo },
        { provide: ConflictService, useValue: mockConflictService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    jest.clearAllMocks();
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all events ordered by date', async () => {
      mockRepo.find.mockResolvedValue([baseEvent]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Feria del vecino');
      expect(mockRepo.find).toHaveBeenCalledWith({ order: { date: 'ASC', startTime: 'ASC' } });
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return event when found', async () => {
      mockRepo.findOne.mockResolvedValue(baseEvent);

      const result = await service.findOne('evt-1');

      expect(result.id).toBe('evt-1');
    });

    it('should throw NotFoundException when event does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateEventDto = {
      title: 'Nuevo evento',
      greenArea: 'Cancha',
      date: '2025-06-01',
      startTime: '09:00',
      endTime: '11:00',
      description: 'Test',
    };

    it('should create event when no conflict', async () => {
      mockConflictService.checkConflict.mockResolvedValue(false);
      mockRepo.create.mockReturnValue({ ...baseEvent, ...dto });
      mockRepo.save.mockResolvedValue({ ...baseEvent, ...dto });

      const result = await service.create(dto, 'user-1');

      expect(result.title).toBe('Nuevo evento');
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when schedule conflict exists', async () => {
      mockConflictService.checkConflict.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NotFoundException when event does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.update('bad-id', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when update causes schedule conflict', async () => {
      mockRepo.findOne.mockResolvedValue(baseEvent);
      mockConflictService.checkConflict.mockResolvedValue(true);

      await expect(service.update('evt-1', { startTime: '11:00' })).rejects.toThrow(ConflictException);
    });

    it('should update and return event when no conflict', async () => {
      mockRepo.findOne.mockResolvedValue(baseEvent);
      mockConflictService.checkConflict.mockResolvedValue(false);
      mockRepo.save.mockResolvedValue({ ...baseEvent, title: 'Actualizado' });

      const result = await service.update('evt-1', { title: 'Actualizado' });

      expect(result.title).toBe('Actualizado');
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should throw NotFoundException when event does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should remove the event', async () => {
      mockRepo.findOne.mockResolvedValue(baseEvent);
      mockRepo.remove.mockResolvedValue(undefined);

      await service.remove('evt-1');

      expect(mockRepo.remove).toHaveBeenCalledWith(baseEvent);
    });
  });

  // ─── cancel ──────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('should set status to cancelled and send notification', async () => {
      mockRepo.findOne.mockResolvedValue({ ...baseEvent });
      const saved = { ...baseEvent, status: 'cancelled', cancelReason: 'Lluvia' };
      mockRepo.save.mockResolvedValue(saved);
      mockNotificationsService.createForAllVecinos.mockResolvedValue([]);

      const result = await service.cancel('evt-1', 'Lluvia');

      expect(result.status).toBe('cancelled');
      expect(result.cancelReason).toBe('Lluvia');
      expect(mockNotificationsService.createForAllVecinos).toHaveBeenCalledWith(
        'cancelled_event',
        expect.stringContaining(baseEvent.title),
        expect.stringContaining('Lluvia'),
        'evt-1',
        'event',
      );
    });

    it('should cancel without reason when reason not provided', async () => {
      mockRepo.findOne.mockResolvedValue({ ...baseEvent });
      mockRepo.save.mockResolvedValue({ ...baseEvent, status: 'cancelled' });
      mockNotificationsService.createForAllVecinos.mockResolvedValue([]);

      await service.cancel('evt-1');

      expect(mockNotificationsService.createForAllVecinos).toHaveBeenCalled();
    });
  });

  // ─── postpone ────────────────────────────────────────────────────────────────

  describe('postpone', () => {
    it('should reschedule event and send notification', async () => {
      const event = { ...baseEvent };
      mockRepo.findOne.mockResolvedValue(event);
      const newDate = { date: '2025-05-20', startTime: '10:00', endTime: '12:00' };
      mockRepo.save.mockResolvedValue({ ...event, ...newDate, status: 'postponed' });
      mockNotificationsService.createForAllVecinos.mockResolvedValue([]);

      const result = await service.postpone('evt-1', newDate);

      expect(result.status).toBe('postponed');
      expect(mockNotificationsService.createForAllVecinos).toHaveBeenCalledWith(
        'postponed_event',
        expect.any(String),
        expect.stringContaining('2025-05-20'),
        'evt-1',
        'event',
      );
    });

    it('should preserve originalDate if not yet set', async () => {
      const event = { ...baseEvent, originalDate: null };
      mockRepo.findOne.mockResolvedValue(event);
      mockRepo.save.mockImplementation(async (e) => e);
      mockNotificationsService.createForAllVecinos.mockResolvedValue([]);

      await service.postpone('evt-1', { date: '2025-06-01', startTime: '09:00' });

      expect(event.originalDate).toBe(baseEvent.date);
    });
  });
});
