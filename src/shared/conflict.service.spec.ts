import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ConflictService } from './conflict.service';
import { Meeting } from '../meetings/meetings.entity';
import { GreenAreaEvent } from '../events/events.entity';

const mockMeetingsRepo = { find: jest.fn() };
const mockEventsRepo = { find: jest.fn() };

function makeMeeting(startTime: string, endTime?: string): Meeting {
  return { id: 'm1', startTime, endTime, date: '2025-04-01' } as Meeting;
}

function makeEvent(startTime: string, endTime?: string): GreenAreaEvent {
  return { id: 'e1', startTime, endTime, date: '2025-04-01' } as GreenAreaEvent;
}

describe('ConflictService', () => {
  let service: ConflictService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConflictService,
        { provide: getRepositoryToken(Meeting), useValue: mockMeetingsRepo },
        { provide: getRepositoryToken(GreenAreaEvent), useValue: mockEventsRepo },
      ],
    }).compile();

    service = module.get<ConflictService>(ConflictService);
    jest.clearAllMocks();
  });

  // ─── No existing items ────────────────────────────────────────────────────────

  describe('when there are no existing meetings or events', () => {
    it('should return false', async () => {
      mockMeetingsRepo.find.mockResolvedValue([]);
      mockEventsRepo.find.mockResolvedValue([]);

      const result = await service.checkConflict('2025-04-01', '10:00', '11:00');

      expect(result).toBe(false);
    });
  });

  // ─── Overlap with meeting ─────────────────────────────────────────────────────

  describe('overlap with existing meeting', () => {
    it('should return true when new event overlaps meeting (same window)', async () => {
      mockMeetingsRepo.find.mockResolvedValue([makeMeeting('10:00', '11:00')]);
      mockEventsRepo.find.mockResolvedValue([]);

      const result = await service.checkConflict('2025-04-01', '10:00', '11:00');

      expect(result).toBe(true);
    });

    it('should return true when new event starts inside existing meeting', async () => {
      mockMeetingsRepo.find.mockResolvedValue([makeMeeting('09:00', '11:00')]);
      mockEventsRepo.find.mockResolvedValue([]);

      const result = await service.checkConflict('2025-04-01', '10:00', '12:00');

      expect(result).toBe(true);
    });

    it('should return false when new event ends exactly when meeting starts', async () => {
      mockMeetingsRepo.find.mockResolvedValue([makeMeeting('11:00', '12:00')]);
      mockEventsRepo.find.mockResolvedValue([]);

      // new: 09:00–11:00  existing: 11:00–12:00  → no overlap
      const result = await service.checkConflict('2025-04-01', '09:00', '11:00');

      expect(result).toBe(false);
    });

    it('should skip excluded meeting id', async () => {
      mockMeetingsRepo.find.mockResolvedValue([makeMeeting('10:00', '11:00')]);
      mockEventsRepo.find.mockResolvedValue([]);

      const result = await service.checkConflict('2025-04-01', '10:00', '11:00', undefined, 'm1');

      expect(result).toBe(false);
    });
  });

  // ─── Overlap with event ───────────────────────────────────────────────────────

  describe('overlap with existing event', () => {
    it('should return true when new meeting overlaps event', async () => {
      mockMeetingsRepo.find.mockResolvedValue([]);
      mockEventsRepo.find.mockResolvedValue([makeEvent('14:00', '16:00')]);

      const result = await service.checkConflict('2025-04-01', '15:00', '17:00');

      expect(result).toBe(true);
    });

    it('should skip excluded event id', async () => {
      mockMeetingsRepo.find.mockResolvedValue([]);
      mockEventsRepo.find.mockResolvedValue([makeEvent('14:00', '16:00')]);

      const result = await service.checkConflict('2025-04-01', '15:00', '17:00', 'e1');

      expect(result).toBe(false);
    });
  });

  // ─── Default endTime (startTime + 120 min) ───────────────────────────────────

  describe('default endTime (no endTime provided)', () => {
    it('should use startTime + 120min when endTime is absent in existing meeting', async () => {
      // existing meeting: 10:00 → 12:00 (default 120 min)
      mockMeetingsRepo.find.mockResolvedValue([makeMeeting('10:00')]); // no endTime
      mockEventsRepo.find.mockResolvedValue([]);

      // new: 11:00–13:00 → overlaps [10:00–12:00]
      const result = await service.checkConflict('2025-04-01', '11:00', '13:00');

      expect(result).toBe(true);
    });

    it('should use startTime + 120min for new item when endTime not provided', async () => {
      // existing: 13:00–14:00
      mockMeetingsRepo.find.mockResolvedValue([makeMeeting('13:00', '14:00')]);
      mockEventsRepo.find.mockResolvedValue([]);

      // new: 12:00, no endTime → 12:00–14:00 → overlaps [13:00–14:00]
      const result = await service.checkConflict('2025-04-01', '12:00');

      expect(result).toBe(true);
    });
  });
});
