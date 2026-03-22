import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting } from './meetings.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { ConflictService } from '../shared/conflict.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private meetingsRepo: Repository<Meeting>,
    private conflictService: ConflictService,
    private usersService: UsersService,
    private mailService: MailService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(): Promise<Meeting[]> {
    return this.meetingsRepo.find({ order: { date: 'ASC', startTime: 'ASC' } });
  }

  async findOne(id: string): Promise<Meeting> {
    const meeting = await this.meetingsRepo.findOne({ where: { id } });
    if (!meeting)
      throw new NotFoundException(`Reunión con id ${id} no encontrada`);
    return meeting;
  }

  async create(dto: CreateMeetingDto, userId?: string): Promise<Meeting> {
    const conflict = await this.conflictService.checkConflict(
      dto.date,
      dto.startTime,
      dto.endTime,
    );
    if (conflict)
      throw new ConflictException(
        'Ya existe un evento o reunión en ese horario',
      );

    const meeting = this.meetingsRepo.create({
      ...dto,
      createdById: userId,
    });
    return this.meetingsRepo.save(meeting);
  }

  async update(id: string, dto: UpdateMeetingDto): Promise<Meeting> {
    const meeting = await this.findOne(id);

    const date = dto.date ?? meeting.date;
    const startTime = dto.startTime ?? meeting.startTime;
    const endTime = dto.endTime ?? meeting.endTime;

    const conflict = await this.conflictService.checkConflict(
      date,
      startTime,
      endTime,
      undefined,
      id,
    );
    if (conflict)
      throw new ConflictException(
        'Ya existe un evento o reunión en ese horario',
      );

    Object.assign(meeting, dto);
    return this.meetingsRepo.save(meeting);
  }

  async remove(id: string): Promise<void> {
    const meeting = await this.findOne(id);
    await this.meetingsRepo.remove(meeting);
  }

  async cancel(id: string, reason?: string): Promise<Meeting> {
    const meeting = await this.findOne(id);
    meeting.status = 'cancelled';
    if (reason) meeting.cancelReason = reason;
    const saved = await this.meetingsRepo.save(meeting);
    await this.notificationsService.createForAllVecinos(
      'cancelled_meeting',
      `Reunión cancelada: ${meeting.title}`,
      reason
        ? `La reunión del ${meeting.date} ha sido cancelada. Motivo: ${reason}`
        : `La reunión del ${meeting.date} ha sido cancelada.`,
      id,
      'meeting',
    );
    return saved;
  }

  async postpone(
    id: string,
    dto: { date: string; startTime: string; endTime?: string },
  ): Promise<Meeting> {
    const meeting = await this.findOne(id);
    const prevDate = meeting.date;
    const prevStartTime = meeting.startTime;
    meeting.originalDate = meeting.originalDate ?? prevDate;
    meeting.originalStartTime = meeting.originalStartTime ?? prevStartTime;
    meeting.date = dto.date;
    meeting.startTime = dto.startTime;
    if (dto.endTime !== undefined) meeting.endTime = dto.endTime;
    meeting.status = 'postponed';
    const saved = await this.meetingsRepo.save(meeting);
    await this.notificationsService.createForAllVecinos(
      'postponed_meeting',
      `Reunión reprogramada: ${meeting.title}`,
      `La reunión ha sido reprogramada al ${dto.date} a las ${dto.startTime}.`,
      id,
      'meeting',
    );
    return saved;
  }

  async sendInvitation(
    id: string,
    emails?: string[],
  ): Promise<{ sent: number; failed: number }> {
    const meeting = await this.findOne(id);
    let targets = emails;
    if (!targets || targets.length === 0) {
      const users = await this.usersService.findAll();
      targets = users
        .filter((u) => u.isActive !== false && u.email)
        .map((u) => u.email);
    }
    return this.mailService.sendMeetingInvitation(targets, meeting);
  }
}
