import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DuesConfig } from './dues-config.entity';
import { DuesPayment } from './dues-payment.entity';
import { DuesPromotion } from './dues-promotion.entity';
import { User } from '../users/users.entity';
import { Role, ADMIN_ROLES } from '../auth/roles.enum';
import { CreateDuesConfigDto } from './dto/create-dues-config.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ImportPaymentItemDto } from './dto/import-payments.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

const EXEMPT_ROLES: Role[] = [Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO];

@Injectable()
export class DuesService {
  constructor(
    @InjectRepository(DuesConfig)
    private configRepo: Repository<DuesConfig>,
    @InjectRepository(DuesPayment)
    private paymentRepo: Repository<DuesPayment>,
    @InjectRepository(DuesPromotion)
    private promotionRepo: Repository<DuesPromotion>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getConfig(): Promise<DuesConfig | null> {
    return this.configRepo.findOne({
      where: {},
      order: { effectiveFrom: 'DESC' },
    });
  }

  async setConfig(dto: CreateDuesConfigDto, requestingRole: Role): Promise<DuesConfig> {
    if (requestingRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Solo SUPER_ADMIN puede configurar el monto de cuotas');
    }

    const now = new Date();
    const effectiveFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const config = this.configRepo.create({
      amount: dto.amount,
      effectiveFrom,
    });
    return this.configRepo.save(config);
  }

  async generateMonthlyDues(
    month: number,
    year: number,
  ): Promise<{ generated: number; exempt: number }> {
    const config = await this.getConfig();
    if (!config) {
      throw new NotFoundException('No hay configuración de cuotas. Configure el monto primero.');
    }

    const activeUsers = await this.userRepo.find({
      where: { isActive: true },
    });

    let generated = 0;
    let exempt = 0;

    for (const user of activeUsers) {
      const existing = await this.paymentRepo.findOne({
        where: { userId: user.id, month, year },
      });
      if (existing) continue;

      const isExempt = EXEMPT_ROLES.includes(user.role);

      const payment = new DuesPayment();
      payment.userId = user.id;
      payment.houseId = user.houseId || null;
      payment.month = month;
      payment.year = year;
      payment.amount = isExempt ? 0 : Number(config.amount);
      payment.status = isExempt ? 'exempt' : 'pending';
      payment.paidAt = null;
      await this.paymentRepo.save(payment);

      if (isExempt) {
        exempt++;
      } else {
        generated++;
      }
    }

    return { generated, exempt };
  }

  async findAll(user: { userId: string; role: Role }): Promise<DuesPayment[]> {
    const canSeeAll = [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.PRESIDENTE,
      Role.SECRETARIO,
      Role.TESORERO,
    ].includes(user.role);

    if (canSeeAll) {
      return this.paymentRepo.find({
        relations: ['user', 'house'],
        order: { year: 'DESC', month: 'DESC' },
      });
    }

    // VECINO: return payments for their assigned house
    const userRecord = await this.userRepo.findOne({ where: { id: user.userId } });

    if (userRecord?.houseId) {
      return this.paymentRepo.find({
        where: { houseId: userRecord.houseId },
        relations: ['user', 'house'],
        order: { year: 'DESC', month: 'DESC' },
      });
    }

    // No house assigned: only their own payments
    return this.paymentRepo.find({
      where: { userId: user.userId },
      relations: ['user', 'house'],
      order: { year: 'DESC', month: 'DESC' },
    });
  }

  async findOne(id: string): Promise<DuesPayment> {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: ['user', 'house'],
    });
    if (!payment) throw new NotFoundException(`Pago con id ${id} no encontrado`);
    return payment;
  }

  async createPayment(dto: CreatePaymentDto): Promise<DuesPayment> {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException(`Usuario con id ${dto.userId} no encontrado`);

    const existing = await this.paymentRepo.findOne({
      where: { userId: dto.userId, month: dto.month, year: dto.year },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe un registro de pago para este usuario en ${dto.month}/${dto.year}`,
      );
    }

    const config = await this.getConfig();
    const isExempt = EXEMPT_ROLES.includes(user.role);

    const payment = new DuesPayment();
    payment.userId = dto.userId;
    payment.houseId = user.houseId || null;
    payment.month = dto.month;
    payment.year = dto.year;
    payment.amount = isExempt ? 0 : (config ? Number(config.amount) : 0);
    payment.status = isExempt ? 'exempt' : (dto.status || 'pending');
    payment.paidAt = isExempt ? null : (dto.paidAt || null);
    payment.notes = dto.notes || null;
    return this.paymentRepo.save(payment);
  }

  async importPayments(
    items: ImportPaymentItemDto[],
  ): Promise<{ created: number; updated: number; skipped: number; errors: string[] }> {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of items) {
      const user = await this.userRepo.findOne({ where: { email: item.email } });
      if (!user) {
        errors.push(`Usuario no encontrado: ${item.email}`);
        skipped++;
        continue;
      }

      const isExempt = EXEMPT_ROLES.includes(user.role);
      if (isExempt) {
        errors.push(`${item.email} está exento de cuotas (${user.role})`);
        skipped++;
        continue;
      }

      const existing = await this.paymentRepo.findOne({
        where: { userId: user.id, month: item.month, year: item.year },
      });

      if (existing) {
        if (existing.status === 'paid') {
          skipped++;
          continue;
        }
        existing.status = 'paid';
        existing.paidAt = item.paidAt || new Date().toISOString().split('T')[0];
        if (item.notes) existing.notes = item.notes;
        await this.paymentRepo.save(existing);
        updated++;
      } else {
        const config = await this.getConfig();
        const payment = new DuesPayment();
        payment.userId = user.id;
        payment.houseId = user.houseId || null;
        payment.month = item.month;
        payment.year = item.year;
        payment.amount = config ? Number(config.amount) : 0;
        payment.status = 'paid';
        payment.paidAt = item.paidAt || new Date().toISOString().split('T')[0];
        payment.notes = item.notes || null;
        await this.paymentRepo.save(payment);
        created++;
      }
    }

    return { created, updated, skipped, errors };
  }

  async updatePayment(id: string, dto: UpdatePaymentDto): Promise<DuesPayment> {
    const payment = await this.findOne(id);
    if (dto.status !== undefined) payment.status = dto.status;
    if (dto.notes !== undefined) payment.notes = dto.notes;
    if (dto.paidAt !== undefined) payment.paidAt = dto.paidAt;
    if (dto.status === 'paid' && !payment.paidAt) {
      payment.paidAt = new Date().toISOString().split('T')[0];
    }
    return this.paymentRepo.save(payment);
  }

  async getSummary(month: number, year: number) {
    const payments = await this.paymentRepo.find({
      where: { month, year },
    });

    const total = payments.length;
    const paid = payments.filter((p) => p.status === 'paid').length;
    const pending = payments.filter((p) => p.status === 'pending').length;
    const exempt = payments.filter((p) => p.status === 'exempt').length;
    const totalAmount = payments
      .filter((p) => p.status !== 'exempt')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const collectedAmount = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return { total, paid, pending, exempt, totalAmount, collectedAmount };
  }

  // ── Promotions ──────────────────────────────────────────────

  async getActivePromotions(): Promise<DuesPromotion[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.promotionRepo
      .createQueryBuilder('p')
      .where('p.isActive = :active', { active: true })
      .andWhere('p.validTo >= :today', { today })
      .orderBy('p.monthCount', 'ASC')
      .getMany();
  }

  async getAllPromotions(): Promise<DuesPromotion[]> {
    return this.promotionRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createPromotion(
    dto: CreatePromotionDto,
    role: Role,
  ): Promise<DuesPromotion> {
    if (role !== Role.SUPER_ADMIN) throw new ForbiddenException();
    return this.promotionRepo.save(this.promotionRepo.create(dto));
  }

  async updatePromotion(
    id: string,
    dto: UpdatePromotionDto,
    role: Role,
  ): Promise<DuesPromotion> {
    if (role !== Role.SUPER_ADMIN) throw new ForbiddenException();
    const promo = await this.promotionRepo.findOne({ where: { id } });
    if (!promo) throw new NotFoundException();
    Object.assign(promo, dto);
    return this.promotionRepo.save(promo);
  }

  async deletePromotion(id: string, role: Role): Promise<void> {
    if (role !== Role.SUPER_ADMIN) throw new ForbiddenException();
    const promo = await this.promotionRepo.findOne({ where: { id } });
    if (!promo) throw new NotFoundException();
    await this.promotionRepo.remove(promo);
  }
}
