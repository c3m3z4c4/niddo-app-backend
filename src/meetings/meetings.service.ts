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

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private meetingsRepo: Repository<Meeting>,
    private conflictService: ConflictService,
    private usersService: UsersService,
    private mailService: MailService,
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

  async sendInvitation(id: string): Promise<{ sent: number; failed: number }> {
    const meeting = await this.findOne(id);
    const users = await this.usersService.findAll();
    const emails = users
      .filter((u) => u.isActive !== false && u.email)
      .map((u) => u.email);
    return this.mailService.sendMeetingInvitation(emails, meeting);
  }
}
