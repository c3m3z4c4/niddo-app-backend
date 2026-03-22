import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GreenAreaReservation } from './reservation.entity';
import { DuesPayment } from '../dues/dues-payment.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReviewReservationDto } from './dto/review-reservation.dto';
import { CloseReservationDto } from './dto/close-reservation.dto';
import { User } from '../users/users.entity';
import { Role } from '../auth/roles.enum';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(GreenAreaReservation)
    private readonly repo: Repository<GreenAreaReservation>,
    @InjectRepository(DuesPayment)
    private readonly duesRepo: Repository<DuesPayment>,
  ) {}

  async create(dto: CreateReservationDto, user: User): Promise<GreenAreaReservation> {
    // Check for pending dues — admin/mesa directiva are exempt
    const adminRoles: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO];
    if (!adminRoles.includes(user.role as Role)) {
      const pendingCount = await this.duesRepo.count({
        where: { userId: user.id, status: 'pending' },
      });
      if (pendingCount > 0) {
        throw new ForbiddenException(
          'No puedes solicitar el área verde con adeudos pendientes de pago.',
        );
      }
    }

    const reservation = this.repo.create({
      ...dto,
      userId: user.id,
      status: 'pending',
    });
    return this.repo.save(reservation);
  }

  async findAll(user: User): Promise<GreenAreaReservation[]> {
    const adminRoles: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO];
    const isAdmin = adminRoles.includes(user.role as Role);

    if (isAdmin) {
      return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    return this.repo.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });
  }

  async review(
    id: string,
    dto: ReviewReservationDto,
    reviewer: User,
  ): Promise<GreenAreaReservation> {
    const reservation = await this.repo.findOne({ where: { id } });
    if (!reservation) throw new NotFoundException('Solicitud no encontrada');
    if (reservation.status !== 'pending') {
      throw new ForbiddenException('Solo se pueden revisar solicitudes pendientes');
    }

    reservation.status = dto.status;
    reservation.adminNotes = dto.adminNotes ?? undefined;
    reservation.reviewedById = reviewer.id;
    return this.repo.save(reservation);
  }

  async close(
    id: string,
    dto: CloseReservationDto,
    closer: User,
  ): Promise<GreenAreaReservation> {
    const reservation = await this.repo.findOne({ where: { id } });
    if (!reservation) throw new NotFoundException('Solicitud no encontrada');
    if (reservation.status !== 'approved') {
      throw new ForbiddenException('Solo se pueden cerrar reservaciones aprobadas');
    }

    reservation.status = 'closed';
    reservation.checklistBanos = dto.checklistBanos;
    reservation.checklistInstalaciones = dto.checklistInstalaciones;
    reservation.closureNotes = dto.closureNotes;
    reservation.chargeAmount = dto.chargeAmount;
    reservation.closedById = closer.id;
    reservation.closedAt = new Date();
    return this.repo.save(reservation);
  }

  async cancel(id: string, user: User): Promise<void> {
    const reservation = await this.repo.findOne({ where: { id } });
    if (!reservation) throw new NotFoundException('Solicitud no encontrada');

    const adminRoles: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO];
    const isAdmin = adminRoles.includes(user.role as Role);

    if (!isAdmin && reservation.userId !== user.id) {
      throw new ForbiddenException('No tienes permiso para cancelar esta solicitud');
    }
    if (reservation.status !== 'pending') {
      throw new ForbiddenException('Solo se pueden cancelar solicitudes pendientes');
    }

    reservation.status = 'cancelled';
    await this.repo.save(reservation);
  }
}
