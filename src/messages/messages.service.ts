import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { DirectMessage } from './message.entity';
import { User } from '../users/users.entity';
import { Role } from '../auth/roles.enum';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(DirectMessage)
    private readonly messagesRepo: Repository<DirectMessage>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async send(senderId: string, dto: CreateMessageDto) {
    const { recipientId, subject, body } = dto;

    if (recipientId) {
      const recipient = await this.usersRepo.findOne({ where: { id: recipientId } });
      if (!recipient) throw new NotFoundException('Destinatario no encontrado');

      const message = this.messagesRepo.create({
        senderId,
        recipientId,
        subject,
        body,
        isBroadcast: false,
        broadcastId: null,
      });
      return this.messagesRepo.save(message);
    }

    // Broadcast to all active vecinos
    const vecinos = await this.usersRepo.find({
      where: { role: Role.RESIDENT, isActive: true },
    });

    if (vecinos.length === 0) {
      return { sent: 0 };
    }

    const broadcastId = randomUUID();
    const messages = vecinos.map((v) =>
      this.messagesRepo.create({
        senderId,
        recipientId: v.id,
        subject,
        body,
        isBroadcast: true,
        broadcastId,
      }),
    );

    await this.messagesRepo.save(messages);
    return { sent: messages.length, broadcastId };
  }

  async getInbox(userId: string) {
    return this.messagesRepo.find({
      where: { recipientId: userId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async getSent(senderId: string) {
    const messages = await this.messagesRepo.find({
      where: { senderId },
      relations: ['recipient'],
      order: { createdAt: 'DESC' },
      take: 500,
    });

    // For broadcasts: keep one row per broadcastId (the first/most recent)
    const seen = new Set<string>();
    const result: DirectMessage[] = [];

    for (const msg of messages) {
      if (msg.isBroadcast && msg.broadcastId) {
        if (!seen.has(msg.broadcastId)) {
          seen.add(msg.broadcastId);
          result.push(msg);
        }
      } else {
        result.push(msg);
      }
    }

    return result;
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.messagesRepo.count({
      where: { recipientId: userId, read: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const message = await this.messagesRepo.findOne({ where: { id } });
    if (!message) throw new NotFoundException('Mensaje no encontrado');
    if (message.recipientId !== userId) throw new NotFoundException('Mensaje no encontrado');

    message.read = true;
    return this.messagesRepo.save(message);
  }

  async markAllAsRead(userId: string) {
    await this.messagesRepo.update({ recipientId: userId, read: false }, { read: true });
    return { success: true };
  }

  async getOne(id: string, userId: string) {
    const message = await this.messagesRepo.findOne({
      where: { id },
      relations: ['sender', 'recipient'],
    });
    if (!message) throw new NotFoundException('Mensaje no encontrado');
    if (message.recipientId !== userId && message.senderId !== userId) {
      throw new ForbiddenException('No tienes acceso a este mensaje');
    }
    return message;
  }
}
