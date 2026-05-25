import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { MessagesService } from './messages.service';
import { DirectMessage } from './message.entity';
import { User } from '../users/users.entity';
import { Role } from '../auth/roles.enum';

const mockMessagesRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
};

const mockUsersRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
};

const baseMessage = {
  id: 'msg-1',
  senderId: 'sender-1',
  recipientId: 'recipient-1',
  subject: 'Hola',
  body: 'Cuerpo del mensaje',
  isBroadcast: false,
  broadcastId: null,
  read: false,
  condominiumId: null,
  createdAt: new Date(),
};

const vecinoA = { id: 'vecino-a', role: Role.RESIDENT, isActive: true, email: 'a@test.com', condominiumId: null };
const vecinoB = { id: 'vecino-b', role: Role.RESIDENT, isActive: true, email: 'b@test.com', condominiumId: null };

describe('MessagesService', () => {
  let service: MessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getRepositoryToken(DirectMessage), useValue: mockMessagesRepo },
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    jest.clearAllMocks();
  });

  // ─── send (direct) ───────────────────────────────────────────────────────────

  describe('send (direct message)', () => {
    it('should throw NotFoundException when recipient does not exist', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.send('sender-1', { recipientId: 'bad-id', subject: 'Hi', body: 'Test' }, null),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create and return a direct message', async () => {
      mockUsersRepo.findOne.mockResolvedValue(vecinoA);
      mockMessagesRepo.create.mockReturnValue(baseMessage);
      mockMessagesRepo.save.mockResolvedValue(baseMessage);

      const result = await service.send(
        'sender-1',
        { recipientId: 'vecino-a', subject: 'Hola', body: 'Cuerpo del mensaje' },
        null,
      );

      expect(mockMessagesRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({ senderId: 'sender-1' });
    });
  });

  // ─── send (broadcast) ────────────────────────────────────────────────────────

  describe('send (broadcast)', () => {
    it('should return sent=0 when no active vecinos found', async () => {
      mockUsersRepo.find.mockResolvedValue([]);

      const result = await service.send('sender-1', { subject: 'Anuncio', body: 'Texto' }, null);

      expect(result).toEqual({ sent: 0 });
      expect(mockMessagesRepo.save).not.toHaveBeenCalled();
    });

    it('should create N copies when broadcasting to N vecinos', async () => {
      mockUsersRepo.find.mockResolvedValue([vecinoA, vecinoB]);
      mockMessagesRepo.create.mockImplementation((data) => data);
      mockMessagesRepo.save.mockResolvedValue([]);

      const result = await service.send('sender-1', { subject: 'Anuncio', body: 'Texto' }, null) as any;

      expect(result.sent).toBe(2);
      expect(mockMessagesRepo.create).toHaveBeenCalledTimes(2);
    });

    it('should share the same broadcastId across all copies', async () => {
      mockUsersRepo.find.mockResolvedValue([vecinoA, vecinoB]);

      const createdMessages: any[] = [];
      mockMessagesRepo.create.mockImplementation((data) => {
        createdMessages.push(data);
        return data;
      });
      mockMessagesRepo.save.mockResolvedValue([]);

      await service.send('sender-1', { subject: 'Anuncio', body: 'Texto' }, null);

      const ids = createdMessages.map((m) => m.broadcastId);
      expect(ids[0]).toBeTruthy();
      expect(ids[0]).toBe(ids[1]);
    });

    it('should mark broadcast messages with isBroadcast=true', async () => {
      mockUsersRepo.find.mockResolvedValue([vecinoA]);

      let created: any;
      mockMessagesRepo.create.mockImplementation((data) => {
        created = data;
        return data;
      });
      mockMessagesRepo.save.mockResolvedValue([]);

      await service.send('sender-1', { subject: 'Anuncio', body: 'Texto' }, null);

      expect(created.isBroadcast).toBe(true);
    });
  });

  // ─── getSent ─────────────────────────────────────────────────────────────────

  describe('getSent', () => {
    it('should deduplicate broadcasts — return one row per broadcastId', async () => {
      const broadcastId = 'bc-uuid-1';
      const raw = [
        { ...baseMessage, id: 'msg-a', isBroadcast: true, broadcastId, recipientId: 'vecino-a' },
        { ...baseMessage, id: 'msg-b', isBroadcast: true, broadcastId, recipientId: 'vecino-b' },
      ];
      mockMessagesRepo.find.mockResolvedValue(raw);

      const result = await service.getSent('sender-1', null);

      expect(result).toHaveLength(1);
      expect(result[0].broadcastId).toBe(broadcastId);
    });

    it('should include all direct messages without deduplication', async () => {
      const raw = [
        { ...baseMessage, id: 'msg-1', isBroadcast: false, broadcastId: null },
        { ...baseMessage, id: 'msg-2', isBroadcast: false, broadcastId: null },
      ];
      mockMessagesRepo.find.mockResolvedValue(raw);

      const result = await service.getSent('sender-1', null);

      expect(result).toHaveLength(2);
    });
  });

  // ─── getInbox ────────────────────────────────────────────────────────────────

  describe('getInbox', () => {
    it('should return messages for the given user', async () => {
      mockMessagesRepo.find.mockResolvedValue([baseMessage]);

      const result = await service.getInbox('recipient-1', null);

      expect(result).toHaveLength(1);
      expect(mockMessagesRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ recipientId: 'recipient-1' }) }),
      );
    });
  });

  // ─── markAsRead ──────────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('should throw NotFoundException when message not found', async () => {
      mockMessagesRepo.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('bad-id', 'recipient-1', null)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user is not the recipient', async () => {
      mockMessagesRepo.findOne.mockResolvedValue({ ...baseMessage, recipientId: 'other-user' });

      await expect(service.markAsRead('msg-1', 'recipient-1', null)).rejects.toThrow(NotFoundException);
    });

    it('should set read=true and save the message', async () => {
      const message = { ...baseMessage, read: false };
      mockMessagesRepo.findOne.mockResolvedValue(message);
      mockMessagesRepo.save.mockResolvedValue({ ...message, read: true });

      await service.markAsRead('msg-1', 'recipient-1', null);

      expect(mockMessagesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ read: true }),
      );
    });
  });

  // ─── getOne ──────────────────────────────────────────────────────────────────

  describe('getOne', () => {
    it('should throw ForbiddenException when user is neither sender nor recipient', async () => {
      mockMessagesRepo.findOne.mockResolvedValue({ ...baseMessage, senderId: 'x', recipientId: 'y' });

      await expect(service.getOne('msg-1', 'unrelated-user', null)).rejects.toThrow(ForbiddenException);
    });

    it('should return message for the sender', async () => {
      mockMessagesRepo.findOne.mockResolvedValue({ ...baseMessage, senderId: 'sender-1' });

      const result = await service.getOne('msg-1', 'sender-1', null);

      expect(result.senderId).toBe('sender-1');
    });
  });
});
