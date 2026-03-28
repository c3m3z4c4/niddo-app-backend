import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { User } from '../users/users.entity';
import { Role } from '../auth/roles.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async createForAllVecinos(
    type: 'new_event' | 'new_meeting' | 'cancelled_event' | 'cancelled_meeting' | 'postponed_event' | 'postponed_meeting',
    title: string,
    message: string,
    targetId: string,
    targetType: 'event' | 'meeting',
    condominiumId?: string | null,
  ) {
    const condoFilter = condominiumId ? { condominiumId } : {};
    const users = await this.usersRepo.find({
      where: [
        { role: Role.RESIDENT, isActive: true, ...condoFilter },
        { role: Role.CONDO_ADMIN, isActive: true, ...condoFilter },
      ],
    });

    const notifications = users.map((user) =>
      this.notificationsRepo.create({
        userId: user.id,
        type,
        title,
        message,
        targetId,
        targetType,
        condominiumId: condominiumId ?? undefined,
      }),
    );

    return this.notificationsRepo.save(notifications);
  }

  async findAllForUser(userId: string, condominiumId?: string | null) {
    const where: any = { userId };
    if (condominiumId) where.condominiumId = condominiumId;
    return this.notificationsRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string, condominiumId?: string | null): Promise<{ count: number }> {
    const where: any = { userId, read: false };
    if (condominiumId) where.condominiumId = condominiumId;
    const count = await this.notificationsRepo.count({ where });
    return { count };
  }

  async markAsRead(id: string, userId: string, condominiumId?: string | null) {
    const where: any = { id };
    if (condominiumId) where.condominiumId = condominiumId;
    const notification = await this.notificationsRepo.findOne({ where });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    return this.notificationsRepo.save(notification);
  }

  async markAllAsRead(userId: string, condominiumId?: string | null) {
    const where: any = { userId, read: false };
    if (condominiumId) where.condominiumId = condominiumId;
    await this.notificationsRepo.update(where, { read: true });
    return { success: true };
  }
}
