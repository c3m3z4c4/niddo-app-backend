import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { MeetingsService } from './meetings.service';
import { Meeting } from './meetings.entity';
import { ConflictService } from '../shared/conflict.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockConflictService = { checkConflict: jest.fn() };
const mockUsersService = { findAll: jest.fn() };
const mockMailService = { sendMeetingInvitation: jest.fn() };
const mockNotificationsService = { createForAllVecinos: jest.fn() };

const baseMeeting = {
  id: 'meet-1',
  title: 'Asamblea general',
  description: 'Puntos del mes',
  location: 'Salón comunal',
  date: '2025-05-15',
  startTime: '18:00',
  endTime: '20:00',
  status: 'active',
  cancelReason: null as any,
  originalDate: null as any,
  originalStartTime: null as any,
  minutes: null as any,
  minutesAgreements: null as any,
  minutesResponsibles: null as any,
  minutesClosingTime: null as any,
  createdAt: new Date(),
  createdById: 'user-1',
};

describe('MeetingsService', () => {
  let service: MeetingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingsService,
        { provide: getRepositoryToken(Meeting), useValue: mockRepo },
        { provide: ConflictService, useValue: mockConflictService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: MailService, useValue: mockMailService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<MeetingsService>(MeetingsService);
    jest.clearAllMocks();
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all meetings ordered by date', async () => {
      mockRepo.find.mockResolvedValue([baseMeeting]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Asamblea general');
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: { date: 'ASC', startTime: 'ASC' } }),
      );
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return meeting when found', async () => {
      mockRepo.findOne.mockResolvedValue(baseMeeting);

      const result = await service.findOne('meet-1');

      expect(result.id).toBe('meet-1');
    });

    it('should throw NotFoundException when meeting does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateMeetingDto = {
      title: 'Nueva reunión',
      description: 'Agenda',
      location: 'Salón',
      date: '2025-06-10',
      startTime: '18:00',
      endTime: '20:00',
    };

    it('should create meeting when no conflict', async () => {
      mockConflictService.checkConflict.mockResolvedValue(false);
      mockRepo.create.mockReturnValue({ ...baseMeeting, ...dto });
      mockRepo.save.mockResolvedValue({ ...baseMeeting, ...dto });

      const result = await service.create(dto, 'user-1');

      expect(result.title).toBe('Nueva reunión');
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
    it('should throw NotFoundException when meeting does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.update('bad-id', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when update causes schedule conflict', async () => {
      mockRepo.findOne.mockResolvedValue(baseMeeting);
      mockConflictService.checkConflict.mockResolvedValue(true);

      await expect(service.update('meet-1', { startTime: '19:00' })).rejects.toThrow(ConflictException);
    });

    it('should update and return meeting when no conflict', async () => {
      mockRepo.findOne.mockResolvedValue(baseMeeting);
      mockConflictService.checkConflict.mockResolvedValue(false);
      mockRepo.save.mockResolvedValue({ ...baseMeeting, title: 'Actualizada' });

      const result = await service.update('meet-1', { title: 'Actualizada' });

      expect(result.title).toBe('Actualizada');
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should throw NotFoundException when meeting does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should remove the meeting', async () => {
      mockRepo.findOne.mockResolvedValue(baseMeeting);
      mockRepo.remove.mockResolvedValue(undefined);

      await service.remove('meet-1');

      expect(mockRepo.remove).toHaveBeenCalledWith(baseMeeting);
    });
  });

  // ─── cancel ──────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('should set status to cancelled with reason and notify', async () => {
      mockRepo.findOne.mockResolvedValue({ ...baseMeeting });
      const saved = { ...baseMeeting, status: 'cancelled', cancelReason: 'Quórum insuficiente' };
      mockRepo.save.mockResolvedValue(saved);
      mockNotificationsService.createForAllVecinos.mockResolvedValue([]);

      const result = await service.cancel('meet-1', 'Quórum insuficiente');

      expect(result.status).toBe('cancelled');
      expect(result.cancelReason).toBe('Quórum insuficiente');
      expect(mockNotificationsService.createForAllVecinos).toHaveBeenCalledWith(
        'cancelled_meeting',
        expect.any(String),
        expect.stringContaining('Quórum insuficiente'),
        'meet-1',
        'meeting',
        null,
      );
    });

    it('should cancel without reason', async () => {
      mockRepo.findOne.mockResolvedValue({ ...baseMeeting });
      mockRepo.save.mockResolvedValue({ ...baseMeeting, status: 'cancelled' });
      mockNotificationsService.createForAllVecinos.mockResolvedValue([]);

      await service.cancel('meet-1');

      expect(mockNotificationsService.createForAllVecinos).toHaveBeenCalled();
    });
  });

  // ─── postpone ────────────────────────────────────────────────────────────────

  describe('postpone', () => {
    it('should reschedule meeting and send notification', async () => {
      const meeting = { ...baseMeeting };
      mockRepo.findOne.mockResolvedValue(meeting);
      const newDate = { date: '2025-05-25', startTime: '18:00', endTime: '20:00' };
      mockRepo.save.mockResolvedValue({ ...meeting, ...newDate, status: 'postponed' });
      mockNotificationsService.createForAllVecinos.mockResolvedValue([]);

      const result = await service.postpone('meet-1', newDate);

      expect(result.status).toBe('postponed');
      expect(mockNotificationsService.createForAllVecinos).toHaveBeenCalledWith(
        'postponed_meeting',
        expect.any(String),
        expect.stringContaining('2025-05-25'),
        'meet-1',
        'meeting',
        null,
      );
    });

    it('should preserve originalDate on first postpone', async () => {
      const meeting = { ...baseMeeting, originalDate: null };
      mockRepo.findOne.mockResolvedValue(meeting);
      mockRepo.save.mockImplementation(async (m) => m);
      mockNotificationsService.createForAllVecinos.mockResolvedValue([]);

      await service.postpone('meet-1', { date: '2025-06-01', startTime: '18:00' });

      expect(meeting.originalDate).toBe(baseMeeting.date);
      expect(meeting.originalStartTime).toBe(baseMeeting.startTime);
    });
  });

  // ─── sendInvitation ──────────────────────────────────────────────────────────

  describe('sendInvitation', () => {
    it('should send to provided emails list', async () => {
      mockRepo.findOne.mockResolvedValue(baseMeeting);
      mockMailService.sendMeetingInvitation.mockResolvedValue({ sent: 2, failed: 0 });

      const result = await service.sendInvitation('meet-1', null, ['a@test.com', 'b@test.com']);

      expect(result).toEqual({ sent: 2, failed: 0 });
      expect(mockMailService.sendMeetingInvitation).toHaveBeenCalledWith(
        ['a@test.com', 'b@test.com'],
        baseMeeting,
      );
    });

    it('should send to all active users when no emails provided', async () => {
      mockRepo.findOne.mockResolvedValue(baseMeeting);
      mockUsersService.findAll.mockResolvedValue([
        { email: 'x@test.com', isActive: true },
        { email: 'y@test.com', isActive: false },
      ]);
      mockMailService.sendMeetingInvitation.mockResolvedValue({ sent: 1, failed: 0 });

      const result = await service.sendInvitation('meet-1', null);

      expect(mockMailService.sendMeetingInvitation).toHaveBeenCalledWith(
        ['x@test.com'],
        baseMeeting,
      );
      expect(result).toEqual({ sent: 1, failed: 0 });
    });
  });
});
