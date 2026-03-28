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

  async findAllForUser(userId: string, condominiumId: string | null): Promise<Rsvp[]> {
    const where: any = { userId };
    if (condominiumId) where.condominiumId = condominiumId;
    return this.rsvpsRepo.find({ where });
  }

  async findAllForTarget(targetType: string, targetId: string, condominiumId: string | null): Promise<Rsvp[]> {
    const where: any = { targetType: targetType as any, targetId };
    if (condominiumId) where.condominiumId = condominiumId;
    return this.rsvpsRepo.find({ where });
  }

  async findAllForTargetWithUsers(targetType: string, targetId: string, condominiumId: string | null): Promise<any[]> {
    const where: any = { targetType: targetType as any, targetId };
    if (condominiumId) where.condominiumId = condominiumId;
    const rsvps = await this.rsvpsRepo.find({ where });
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

  async upsert(userId: string, dto: UpsertRsvpDto, condominiumId: string | null): Promise<Rsvp> {
    const where: any = { userId, targetType: dto.targetType, targetId: dto.targetId };
    if (condominiumId) where.condominiumId = condominiumId;
    const existing = await this.rsvpsRepo.findOne({ where });
    if (existing) {
      existing.status = dto.status;
      return this.rsvpsRepo.save(existing);
    }
    const rsvp = this.rsvpsRepo.create({
      userId,
      ...dto,
      condominiumId: condominiumId ?? undefined,
    });
    return this.rsvpsRepo.save(rsvp);
  }

  async remove(userId: string, targetType: string, targetId: string, condominiumId: string | null): Promise<void> {
    const where: any = { userId, targetType: targetType as any, targetId };
    if (condominiumId) where.condominiumId = condominiumId;
    const rsvp = await this.rsvpsRepo.findOne({ where });
    if (rsvp) await this.rsvpsRepo.remove(rsvp);
  }
}
