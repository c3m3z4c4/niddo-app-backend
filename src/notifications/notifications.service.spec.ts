import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';
import { User } from '../users/users.entity';
import { Role } from '../auth/roles.enum';

const mockNotificationsRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
};

const mockUsersRepo = {
  find: jest.fn(),
};

const baseNotification: Partial<Notification> = {
  id: 'notif-1',
  userId: 'user-1',
  type: 'new_meeting',
  title: 'Nueva reunión',
  message: 'Se programó una reunión',
  targetId: 'meet-1',
  targetType: 'meeting',
  read: false,
  createdAt: new Date(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: mockNotificationsRepo },
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  // ─── createForAllVecinos ──────────────────────────────────────────────────────

  describe('createForAllVecinos', () => {
    it('should create notifications for all active vecinos and admins', async () => {
      const vecino: Partial<User> = { id: 'u1', role: Role.RESIDENT, isActive: true };
      const admin: Partial<User> = { id: 'u2', role: Role.CONDO_ADMIN, isActive: true };
      mockUsersRepo.find.mockResolvedValue([vecino, admin]);
      mockNotificationsRepo.create.mockImplementation((data) => ({ ...data }));
      mockNotificationsRepo.save.mockResolvedValue([]);

      await service.createForAllVecinos('new_meeting', 'Reunión', 'Mensaje', 'meet-1', 'meeting');

      expect(mockNotificationsRepo.create).toHaveBeenCalledTimes(2);
      expect(mockNotificationsRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: 'u1', type: 'new_meeting' }),
          expect.objectContaining({ userId: 'u2', type: 'new_meeting' }),
        ]),
      );
    });

    it('should not create notifications when no matching users exist', async () => {
      mockUsersRepo.find.mockResolvedValue([]);
      mockNotificationsRepo.save.mockResolvedValue([]);

      await service.createForAllVecinos('new_event', 'Evento', 'Msg', 'evt-1', 'event');

      expect(mockNotificationsRepo.create).not.toHaveBeenCalled();
    });
  });

  // ─── findAllForUser ───────────────────────────────────────────────────────────

  describe('findAllForUser', () => {
    it('should return notifications for given user ordered by date', async () => {
      mockNotificationsRepo.find.mockResolvedValue([baseNotification]);

      const result = await service.findAllForUser('user-1');

      expect(result).toHaveLength(1);
      expect(mockNotificationsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });

  // ─── getUnreadCount ───────────────────────────────────────────────────────────

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      mockNotificationsRepo.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-1');

      expect(result).toEqual({ count: 3 });
      expect(mockNotificationsRepo.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
      });
    });
  });

  // ─── markAsRead ───────────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notif = { ...baseNotification, read: false };
      mockNotificationsRepo.findOne.mockResolvedValue(notif);
      mockNotificationsRepo.save.mockResolvedValue({ ...notif, read: true });

      const result = await service.markAsRead('notif-1', 'user-1');

      expect(result.read).toBe(true);
      expect(mockNotificationsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ read: true }),
      );
    });

    it('should throw NotFoundException when notification does not exist', async () => {
      mockNotificationsRepo.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when notification belongs to another user', async () => {
      mockNotificationsRepo.findOne.mockResolvedValue({ ...baseNotification, userId: 'other-user' });

      await expect(service.markAsRead('notif-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── markAllAsRead ────────────────────────────────────────────────────────────

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for user', async () => {
      mockNotificationsRepo.update.mockResolvedValue({ affected: 2 });

      const result = await service.markAllAsRead('user-1');

      expect(result).toEqual({ success: true });
      expect(mockNotificationsRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1', read: false },
        { read: true },
      );
    });
  });
});
