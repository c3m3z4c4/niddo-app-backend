import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting } from '../meetings/meetings.entity';
import { GreenAreaEvent } from '../events/events.entity';

@Injectable()
export class ConflictService {
  constructor(
    @InjectRepository(Meeting)
    private meetingsRepo: Repository<Meeting>,
    @InjectRepository(GreenAreaEvent)
    private eventsRepo: Repository<GreenAreaEvent>,
  ) {}

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private getEndMinutes(startTime: string, endTime?: string): number {
    if (endTime) return this.toMinutes(endTime);
    return this.toMinutes(startTime) + 120;
  }

  async checkConflict(
    date: string,
    startTime: string,
    endTime?: string,
    excludeEventId?: string,
    excludeMeetingId?: string,
    condominiumId?: string | null,
  ): Promise<boolean> {
    const newStart = this.toMinutes(startTime);
    const newEnd = this.getEndMinutes(startTime, endTime);

    const baseWhere = condominiumId ? { date, condominiumId } : { date };

    const meetings = await this.meetingsRepo.find({ where: baseWhere });
    for (const m of meetings) {
      if (excludeMeetingId && m.id === excludeMeetingId) continue;
      const mStart = this.toMinutes(m.startTime);
      const mEnd = this.getEndMinutes(m.startTime, m.endTime);
      if (newStart < mEnd && newEnd > mStart) return true;
    }

    const events = await this.eventsRepo.find({ where: baseWhere });
    for (const e of events) {
      if (excludeEventId && e.id === excludeEventId) continue;
      const eStart = this.toMinutes(e.startTime);
      const eEnd = this.getEndMinutes(e.startTime, e.endTime);
      if (newStart < eEnd && newEnd > eStart) return true;
    }

    return false;
  }
}
