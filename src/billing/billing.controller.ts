import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { randomUUID } from 'crypto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { BillingService } from './billing.service';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CreateSaasPaymentDto } from './dto/create-saas-payment.dto';
import { ReviewPaymentDto } from './dto/review-payment.dto';

const PROOF_ALLOWED_TYPES = /\.(jpg|jpeg|png|pdf|heic|webp)$/i;

@ApiTags('Facturación')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ── Licenses ─────────────────────────────────────────────────────────────

  @Get('licenses')
  @Roles(Role.PLATFORM_ADMIN)
  getAllLicenses() {
    return this.billingService.getAllLicenses();
  }

  @Get('licenses/:condoId')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  getLicense(@Param('condoId') condoId: string) {
    return this.billingService.getLicense(condoId);
  }

  @Patch('licenses/:condoId')
  @Roles(Role.PLATFORM_ADMIN)
  updateLicense(@Param('condoId') condoId: string, @Body() dto: UpdateLicenseDto) {
    return this.billingService.updateLicense(condoId, dto);
  }

  // ── Platform Settings ─────────────────────────────────────────────────────

  @Get('settings')
  async getSettings(@Request() req) {
    await this.billingService.assertSettingsReadAccess(req.user.role);
    const settings = await this.billingService.getSettings();
    return this.billingService.sanitizeSettings(settings, req.user.role);
  }

  @Patch('settings')
  @Roles(Role.PLATFORM_ADMIN)
  async updateSettings(@Body() dto: UpdateSettingsDto, @Request() req) {
    const settings = await this.billingService.updateSettings(dto);
    return this.billingService.sanitizeSettings(settings, req.user.role);
  }

  // ── SaaS Payments ─────────────────────────────────────────────────────────

  @Get('payments')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.TESORERO)
  getPayments(@Request() req) {
    return this.billingService.getPayments(req.user.condominiumId ?? null, req.user.role);
  }

  @Post('payments')
  @Roles(Role.CONDO_ADMIN, Role.PRESIDENTE, Role.TESORERO)
  createPayment(@Request() req, @Body() dto: CreateSaasPaymentDto) {
    if (!req.user.condominiumId) {
      throw new BadRequestException('Usuario sin condominio asignado');
    }
    return this.billingService.createPayment(
      req.user.condominiumId,
      req.user.userId,
      dto,
    );
  }

  @Post('payments/:id/proof')
  @Roles(Role.CONDO_ADMIN, Role.PRESIDENTE, Role.TESORERO, Role.PLATFORM_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: resolve(process.cwd(), 'uploads', 'saas-proofs'),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!PROOF_ALLOWED_TYPES.test(extname(file.originalname))) {
          return cb(new BadRequestException('Formato de archivo no permitido'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async uploadProof(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const fileUrl = `/uploads/saas-proofs/${file.filename}`;
    return this.billingService.attachProof(
      id,
      req.user.condominiumId ?? '',
      req.user.role,
      fileUrl,
    );
  }

  @Patch('payments/:id/review')
  @Roles(Role.PLATFORM_ADMIN)
  reviewPayment(
    @Param('id') id: string,
    @Body() dto: ReviewPaymentDto,
    @Request() req,
  ) {
    return this.billingService.reviewPayment(id, req.user.userId, dto);
  }
}
