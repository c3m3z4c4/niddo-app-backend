import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { addMonths, addYears } from 'date-fns';
import { CondominiumLicense } from './condominium-license.entity';
import { PlatformSettings } from './platform-settings.entity';
import { SaasPayment } from './saas-payment.entity';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CreateSaasPaymentDto } from './dto/create-saas-payment.dto';
import { ReviewPaymentDto } from './dto/review-payment.dto';
import { Role } from '../auth/roles.enum';
import { House } from '../houses/houses.entity';

const BLOCKED_FROM_SETTINGS = [
  Role.RESIDENT,
  Role.PRESIDENTE,
  Role.SECRETARIO,
  Role.TESORERO,
];

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(CondominiumLicense)
    private readonly licenseRepo: Repository<CondominiumLicense>,
    @InjectRepository(PlatformSettings)
    private readonly settingsRepo: Repository<PlatformSettings>,
    @InjectRepository(SaasPayment)
    private readonly paymentsRepo: Repository<SaasPayment>,
    @InjectRepository(House)
    private readonly houseRepo: Repository<House>,
  ) {}

  // ── Licenses ────────────────────────────────────────────────────────────

  /** Returns all licenses with condominium info (PLATFORM_ADMIN only) */
  async getAllLicenses() {
    return this.licenseRepo.find({
      relations: ['condominium'],
      order: { createdAt: 'ASC' },
    });
  }

  /** Gets (or lazily creates) the license for a condominium */
  async getLicense(condominiumId: string): Promise<CondominiumLicense> {
    let license = await this.licenseRepo.findOne({
      where: { condominiumId },
      relations: ['condominium'],
    });
    if (!license) {
      license = this.licenseRepo.create({ condominiumId, status: 'TRIAL' });
      license = await this.licenseRepo.save(license);
      license = await this.licenseRepo.findOne({
        where: { id: license.id },
        relations: ['condominium'],
      });
    }
    return license!;
  }

  /** PLATFORM_ADMIN updates license status/dates/cycle */
  async updateLicense(condominiumId: string, dto: UpdateLicenseDto) {
    const license = await this.getLicense(condominiumId);
    if (dto.status !== undefined) license.status = dto.status;
    if (dto.billingCycle !== undefined) license.billingCycle = dto.billingCycle;
    if (dto.planTier !== undefined) license.planTier = dto.planTier;
    if (dto.trialEndsAt !== undefined) {
      license.trialEndsAt = dto.trialEndsAt ? new Date(dto.trialEndsAt) : null;
    }
    if (dto.currentPeriodEndsAt !== undefined) {
      license.currentPeriodEndsAt = dto.currentPeriodEndsAt
        ? new Date(dto.currentPeriodEndsAt)
        : null;
    }
    return this.licenseRepo.save(license);
  }

  // ── Platform Settings ───────────────────────────────────────────────────

  /** Returns the singleton platform settings row, creating it if absent */
  async getSettings(): Promise<PlatformSettings> {
    const rows = await this.settingsRepo.find({ take: 1 });
    if (rows.length) return rows[0];
    const settings = this.settingsRepo.create({});
    return this.settingsRepo.save(settings);
  }

  /** Checks whether the requesting role is allowed to read platform settings */
  async assertSettingsReadAccess(role: Role) {
    if (role === Role.PLATFORM_ADMIN) return;
    if (BLOCKED_FROM_SETTINGS.includes(role)) {
      throw new ForbiddenException('No tienes acceso a la configuración de la plataforma');
    }
    const settings = await this.getSettings();
    if (!settings.visibleToRoles.includes(role)) {
      throw new ForbiddenException('No tienes acceso a la configuración de la plataforma');
    }
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<PlatformSettings> {
    const settings = await this.getSettings();
    if (dto.paymentInstructions !== undefined) {
      settings.paymentInstructions = dto.paymentInstructions;
    }
    if (dto.acceptedMethods !== undefined) {
      settings.acceptedMethods = dto.acceptedMethods;
    }
    if (dto.monthlyPrice !== undefined) settings.monthlyPrice = dto.monthlyPrice;
    if (dto.annualPrice !== undefined) settings.annualPrice = dto.annualPrice;
    if (dto.visibleToRoles !== undefined) {
      const invalid = dto.visibleToRoles.filter(r =>
        BLOCKED_FROM_SETTINGS.includes(r as Role),
      );
      if (invalid.length) {
        throw new BadRequestException(
          `Roles no permitidos en visibleToRoles: ${invalid.join(', ')}`,
        );
      }
      settings.visibleToRoles = dto.visibleToRoles;
    }

    if (dto.activeGateway !== undefined) {
      settings.activeGateway = dto.activeGateway;
    }
    if (dto.stripePublicKey !== undefined) {
      settings.stripePublicKey = dto.stripePublicKey;
    }
    if (dto.stripeSecretKey !== undefined) {
      if (dto.stripeSecretKey !== '••••••••') {
        settings.stripeSecretKey = dto.stripeSecretKey;
      }
    }
    if (dto.stripeWebhookSecret !== undefined) {
      if (dto.stripeWebhookSecret !== '••••••••') {
        settings.stripeWebhookSecret = dto.stripeWebhookSecret;
      }
    }
    if (dto.conektaPublicKey !== undefined) {
      settings.conektaPublicKey = dto.conektaPublicKey;
    }
    if (dto.conektaPrivateKey !== undefined) {
      if (dto.conektaPrivateKey !== '••••••••') {
        settings.conektaPrivateKey = dto.conektaPrivateKey;
      }
    }
    if (dto.conektaWebhookSecret !== undefined) {
      if (dto.conektaWebhookSecret !== '••••••••') {
        settings.conektaWebhookSecret = dto.conektaWebhookSecret;
      }
    }

    return this.settingsRepo.save(settings);
  }

  sanitizeSettings(settings: PlatformSettings, role: Role): any {
    const {
      stripePublicKey,
      stripeSecretKey,
      stripeWebhookSecret,
      conektaPublicKey,
      conektaPrivateKey,
      conektaWebhookSecret,
      ...rest
    } = settings;

    if (role === Role.PLATFORM_ADMIN) {
      return {
        ...rest,
        stripePublicKey,
        stripeSecretKey: stripeSecretKey ? '••••••••' : null,
        stripeWebhookSecret: stripeWebhookSecret ? '••••••••' : null,
        conektaPublicKey,
        conektaPrivateKey: conektaPrivateKey ? '••••••••' : null,
        conektaWebhookSecret: conektaWebhookSecret ? '••••••••' : null,
      };
    } else {
      return {
        ...rest,
        stripePublicKey: null,
        stripeSecretKey: null,
        stripeWebhookSecret: null,
        conektaPublicKey: null,
        conektaPrivateKey: null,
        conektaWebhookSecret: null,
      };
    }
  }

  // ── SaaS Payments ───────────────────────────────────────────────────────

  /** PLATFORM_ADMIN gets all payments; CONDO_ADMIN roles get own condominium only */
  async getPayments(condominiumId: string | null, role: Role) {
    const query = this.paymentsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.condominium', 'condo')
      .leftJoinAndSelect('p.submittedBy', 'sub')
      .leftJoinAndSelect('p.approvedBy', 'appr')
      .orderBy('p.createdAt', 'DESC');

    if (role !== Role.PLATFORM_ADMIN) {
      if (!condominiumId) throw new ForbiddenException();
      query.where('p.condominiumId = :condominiumId', { condominiumId });
    }

    return query.getMany();
  }

  /** CondoAdmin submits a payment report — amount pulled dynamically based on active houses */
  async createPayment(
    condominiumId: string,
    submittedById: string,
    dto: CreateSaasPaymentDto,
  ): Promise<SaasPayment> {
    const settings = await this.getSettings();
    
    // Count active houses for this condominium
    const activeHousesCount = await this.houseRepo.count({
      where: { condominiumId, status: 'active' },
    });

    const unitPrice =
      dto.billingCycle === 'ANNUAL'
        ? Number(settings.annualPrice)
        : Number(settings.monthlyPrice);

    const amount = activeHousesCount * unitPrice;

    const payment = this.paymentsRepo.create({
      condominiumId,
      submittedById,
      billingCycle: dto.billingCycle,
      amount,
      periodCoveredFrom: dto.periodCoveredFrom ?? null,
      periodCoveredTo: dto.periodCoveredTo ?? null,
      notes: dto.notes ?? null,
      status: 'PENDING_APPROVAL',
    });
    return this.paymentsRepo.save(payment);
  }

  /** Attaches an uploaded file URL to a payment */
  async attachProof(paymentId: string, condominiumId: string, role: Role, fileUrl: string) {
    const payment = await this.paymentsRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');

    if (role !== Role.PLATFORM_ADMIN && payment.condominiumId !== condominiumId) {
      throw new ForbiddenException('No puedes modificar este pago');
    }
    if (payment.status === 'APPROVED') {
      throw new BadRequestException('No se puede modificar un pago ya aprobado');
    }

    payment.proofOfPaymentUrl = fileUrl;
    return this.paymentsRepo.save(payment);
  }

  /** PLATFORM_ADMIN approves or rejects; approval activates the license */
  async reviewPayment(
    paymentId: string,
    reviewerId: string,
    dto: ReviewPaymentDto,
  ): Promise<SaasPayment> {
    const payment = await this.paymentsRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Este pago ya fue revisado');
    }

    payment.status = dto.decision;
    payment.approvedById = reviewerId;
    payment.approvedAt = new Date();
    if (dto.notes) payment.notes = dto.notes;

    await this.paymentsRepo.save(payment);

    if (dto.decision === 'APPROVED') {
      await this.activateLicenseAfterPayment(payment);
    }

    return this.paymentsRepo.findOne({
      where: { id: paymentId },
      relations: ['condominium', 'submittedBy', 'approvedBy'],
    }) as Promise<SaasPayment>;
  }

  private async activateLicenseAfterPayment(payment: SaasPayment) {
    const license = await this.getLicense(payment.condominiumId);
    license.status = 'ACTIVE';
    license.billingCycle = payment.billingCycle as 'MONTHLY' | 'ANNUAL';

    const base = new Date();
    license.currentPeriodEndsAt =
      payment.billingCycle === 'ANNUAL' ? addYears(base, 1) : addMonths(base, 1);

    await this.licenseRepo.save(license);
  }
}
