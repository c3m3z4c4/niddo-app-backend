import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Rsvp } from './rsvp.entity';
import { UpsertRsvpDto } from './dto/upsert-rsvp.dto';
import { User } from '../users/users.entity';

@Injectable()
export class RsvpsService {
  constructor(
    @InjectRepository(Rsvp)
    private rsvpsRepo: Repository<Rsvp>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async findAllForUser(userId: string): Promise<Rsvp[]> {
    return this.rsvpsRepo.find({ where: { userId } });
  }

  async findAllForTarget(targetType: string, targetId: string): Promise<Rsvp[]> {
    return this.rsvpsRepo.find({ where: { targetType: targetType as any, targetId } });
  }

  async findAllForTargetWithUsers(targetType: string, targetId: string): Promise<any[]> {
    const rsvps = await this.rsvpsRepo.find({ where: { targetType: targetType as any, targetId } });
    const userIds = [...new Set(rsvps.map(r => r.userId))];
    const users = await this.usersRepo.find({ where: { id: In(userIds) }, relations: ['house'] });
    const usersMap = new Map(users.map(u => [u.id, {
      id: u.id,
      name: u.name,
      lastName: u.lastName,
      email: u.email,
      houseId: u.houseId,
      house: u.house ? { houseNumber: u.house.houseNumber, address: u.house.address } : undefined,
    }]));
    return rsvps.map(r => ({ ...r, user: usersMap.get(r.userId) }));
  }

  async upsert(userId: string, dto: UpsertRsvpDto): Promise<Rsvp> {
    const existing = await this.rsvpsRepo.findOne({
      where: { userId, targetType: dto.targetType, targetId: dto.targetId },
    });
    if (existing) {
      existing.status = dto.status;
      return this.rsvpsRepo.save(existing);
    }
    const rsvp = this.rsvpsRepo.create({ userId, ...dto });
    return this.rsvpsRepo.save(rsvp);
  }

  async remove(userId: string, targetType: string, targetId: string): Promise<void> {
    const rsvp = await this.rsvpsRepo.findOne({
      where: { userId, targetType: targetType as any, targetId },
    });
    if (rsvp) await this.rsvpsRepo.remove(rsvp);
  }
}
