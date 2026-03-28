import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GreenAreaEvent } from './events.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ConflictService } from '../shared/conflict.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(GreenAreaEvent)
    private eventsRepo: Repository<GreenAreaEvent>,
    private conflictService: ConflictService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(condominiumId: string | null): Promise<GreenAreaEvent[]> {
    return this.eventsRepo.find({
      where: condominiumId ? { condominiumId } : {},
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findOne(id: string, condominiumId: string | null): Promise<GreenAreaEvent> {
    const where: any = { id };
    if (condominiumId) where.condominiumId = condominiumId;
    const event = await this.eventsRepo.findOne({ where });
    if (!event)
      throw new NotFoundException(`Evento con id ${id} no encontrado`);
    return event;
  }

  async create(dto: CreateEventDto, userId?: string, condominiumId?: string | null): Promise<GreenAreaEvent> {
    const conflict = await this.conflictService.checkConflict(
      dto.date,
      dto.startTime,
      dto.endTime,
      undefined,
      undefined,
      condominiumId,
    );
    if (conflict)
      throw new ConflictException(
        'Ya existe un evento o reunión en ese horario',
      );

    const event = this.eventsRepo.create({
      ...dto,
      createdById: userId,
      condominiumId: condominiumId ?? undefined,
    });
    return this.eventsRepo.save(event);
  }

  async update(id: string, dto: UpdateEventDto, condominiumId: string | null): Promise<GreenAreaEvent> {
    const event = await this.findOne(id, condominiumId);

    const date = dto.date ?? event.date;
    const startTime = dto.startTime ?? event.startTime;
    const endTime = dto.endTime ?? event.endTime;

    const conflict = await this.conflictService.checkConflict(
      date,
      startTime,
      endTime,
      id,
      undefined,
      condominiumId,
    );
    if (conflict)
      throw new ConflictException(
        'Ya existe un evento o reunión en ese horario',
      );

    Object.assign(event, dto);
    return this.eventsRepo.save(event);
  }

  async remove(id: string, condominiumId: string | null): Promise<void> {
    const event = await this.findOne(id, condominiumId);
    await this.eventsRepo.remove(event);
  }

  async cancel(id: string, reason?: string, condominiumId?: string | null): Promise<GreenAreaEvent> {
    const event = await this.findOne(id, condominiumId ?? null);
    event.status = 'cancelled';
    if (reason) event.cancelReason = reason;
    const saved = await this.eventsRepo.save(event);
    await this.notificationsService.createForAllVecinos(
      'cancelled_event',
      `Evento cancelado: ${event.title}`,
      reason
        ? `El evento del ${event.date} ha sido cancelado. Motivo: ${reason}`
        : `El evento del ${event.date} ha sido cancelado.`,
      id,
      'event',
      condominiumId ?? null,
    );
    return saved;
  }

  async postpone(
    id: string,
    dto: { date: string; startTime: string; endTime?: string },
    condominiumId?: string | null,
  ): Promise<GreenAreaEvent> {
    const event = await this.findOne(id, condominiumId ?? null);
    event.originalDate = event.originalDate ?? event.date;
    event.originalStartTime = event.originalStartTime ?? event.startTime;
    event.date = dto.date;
    event.startTime = dto.startTime;
    if (dto.endTime !== undefined) event.endTime = dto.endTime;
    event.status = 'postponed';
    const saved = await this.eventsRepo.save(event);
    await this.notificationsService.createForAllVecinos(
      'postponed_event',
      `Evento reprogramado: ${event.title}`,
      `El evento ha sido reprogramado al ${dto.date} a las ${dto.startTime}.`,
      id,
      'event',
      condominiumId ?? null,
    );
    return saved;
  }
}
