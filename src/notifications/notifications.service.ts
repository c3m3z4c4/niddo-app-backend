import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
  ) {
    const users = await this.usersRepo.find({
      where: [
        { role: Role.VECINO, isActive: true },
        { role: Role.ADMIN, isActive: true },
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
      }),
    );

    return this.notificationsRepo.save(notifications);
  }

  async findAllForUser(userId: string) {
    return this.notificationsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationsRepo.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationsRepo.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    return this.notificationsRepo.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepo.update({ userId, read: false }, { read: true });
    return { success: true };
  }
}
