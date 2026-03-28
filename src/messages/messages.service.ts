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

  async send(senderId: string, dto: CreateMessageDto, condominiumId: string | null) {
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
        condominiumId: condominiumId ?? undefined,
      });
      return this.messagesRepo.save(message);
    }

    // Broadcast to all active vecinos
    const vecinoWhere: any = { role: Role.RESIDENT, isActive: true };
    if (condominiumId) vecinoWhere.condominiumId = condominiumId;
    const vecinos = await this.usersRepo.find({ where: vecinoWhere });

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
        condominiumId: condominiumId ?? undefined,
      }),
    );

    await this.messagesRepo.save(messages);
    return { sent: messages.length, broadcastId };
  }

  async getInbox(userId: string, condominiumId: string | null) {
    const where: any = { recipientId: userId };
    if (condominiumId) where.condominiumId = condominiumId;
    return this.messagesRepo.find({
      where,
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async getSent(senderId: string, condominiumId: string | null) {
    const where: any = { senderId };
    if (condominiumId) where.condominiumId = condominiumId;
    const messages = await this.messagesRepo.find({
      where,
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

  async getUnreadCount(userId: string, condominiumId: string | null): Promise<{ count: number }> {
    const where: any = { recipientId: userId, read: false };
    if (condominiumId) where.condominiumId = condominiumId;
    const count = await this.messagesRepo.count({ where });
    return { count };
  }

  async markAsRead(id: string, userId: string, condominiumId: string | null) {
    const where: any = { id };
    if (condominiumId) where.condominiumId = condominiumId;
    const message = await this.messagesRepo.findOne({ where });
    if (!message) throw new NotFoundException('Mensaje no encontrado');
    if (message.recipientId !== userId) throw new NotFoundException('Mensaje no encontrado');

    message.read = true;
    return this.messagesRepo.save(message);
  }

  async markAllAsRead(userId: string, condominiumId: string | null) {
    const where: any = { recipientId: userId, read: false };
    if (condominiumId) where.condominiumId = condominiumId;
    await this.messagesRepo.update(where, { read: true });
    return { success: true };
  }

  async getOne(id: string, userId: string, condominiumId: string | null) {
    const where: any = { id };
    if (condominiumId) where.condominiumId = condominiumId;
    const message = await this.messagesRepo.findOne({
      where,
      relations: ['sender', 'recipient'],
    });
    if (!message) throw new NotFoundException('Mensaje no encontrado');
    if (message.recipientId !== userId && message.senderId !== userId) {
      throw new ForbiddenException('No tienes acceso a este mensaje');
    }
    return message;
  }
}
