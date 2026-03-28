import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { DuesService } from './dues.service';
import { CreateDuesConfigDto } from './dto/create-dues-config.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { GenerateDuesDto } from './dto/generate-dues.dto';
import { ImportPaymentsDto } from './dto/import-payments.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { CreateDuesPolicyDto } from './dto/create-dues-policy.dto';
import { ApplyPromotionDto } from './dto/apply-promotion.dto';
import { CreateExtraordinaryDto } from './dto/create-extraordinary.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dues')
export class DuesController {
  constructor(private readonly duesService: DuesService) {}

  @Get('config')
  getConfig(@CurrentTenant() condominiumId: string | null) {
    return this.duesService.getConfig(condominiumId);
  }

  @Post('config')
  @Roles(Role.PLATFORM_ADMIN)
  setConfig(@Body() dto: CreateDuesConfigDto, @Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.duesService.setConfig(dto, req.user.role, condominiumId);
  }

  @Get('summary')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  getSummary(@Query('month') month: string, @Query('year') year: string, @CurrentTenant() condominiumId: string | null) {
    return this.duesService.getSummary(Number(month), Number(year), condominiumId);
  }

  // ── Promotions (MUST be before :id routes) ──────────────────

  @Get('promotions')
  getActivePromotions(@CurrentTenant() condominiumId: string | null) {
    return this.duesService.getActivePromotions(condominiumId);
  }

  @Get('promotions/all')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  getAllPromotions(@CurrentTenant() condominiumId: string | null) {
    return this.duesService.getAllPromotions(condominiumId);
  }

  @Post('promotions')
  @Roles(Role.PLATFORM_ADMIN)
  createPromotion(@Body() dto: CreatePromotionDto, @Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.duesService.createPromotion(dto, req.user.role, condominiumId);
  }

  @Patch('promotions/:id')
  @Roles(Role.PLATFORM_ADMIN)
  updatePromotion(
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto,
    @Request() req,
  ) {
    return this.duesService.updatePromotion(id, dto, req.user.role);
  }

  @Delete('promotions/:id')
  @Roles(Role.PLATFORM_ADMIN)
  deletePromotion(@Param('id') id: string, @Request() req) {
    return this.duesService.deletePromotion(id, req.user.role);
  }

  // ── Payments ────────────────────────────────────────────────

  @Get()
  findAll(@Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.duesService.findAll(req.user, condominiumId);
  }

  @Post('generate')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  generateMonthlyDues(@Body() dto: GenerateDuesDto, @CurrentTenant() condominiumId: string | null) {
    return this.duesService.generateMonthlyDues(dto.month, dto.year, condominiumId);
  }

  @Post('import')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.TESORERO)
  importPayments(@Body() dto: ImportPaymentsDto) {
    return this.duesService.importPayments(dto.payments);
  }

  @Delete('all')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN)
  deleteAllPayments(@Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.duesService.deleteAllPayments(req.user.role, condominiumId);
  }

  @Post()
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.TESORERO)
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.duesService.createPayment(dto);
  }

  @Patch(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.TESORERO)
  updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.duesService.updatePayment(id, dto);
  }

  // ── Policy ────────────────────────────────────────────────

  @Get('policy')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  getPolicy(@CurrentTenant() condominiumId: string | null) {
    return this.duesService.getPolicy(condominiumId);
  }

  @Post('policy')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.TESORERO)
  setPolicy(@Body() dto: CreateDuesPolicyDto, @CurrentTenant() condominiumId: string | null) {
    return this.duesService.setPolicy(dto, condominiumId);
  }

  @Get('debtors')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  getDebtors(@CurrentTenant() condominiumId: string | null) {
    return this.duesService.getDebtors(condominiumId);
  }

  // ── Apply Promotion ────────────────────────────────────────

  @Post('promotions/apply')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.TESORERO, Role.PRESIDENTE)
  applyPromotion(@Body() dto: ApplyPromotionDto, @Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.duesService.applyPromotion(dto, req.user.role, condominiumId);
  }

  // ── Extraordinary Income ───────────────────────────────────

  @Get('extraordinary')
  findAllExtraordinary(@Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.duesService.findAllExtraordinary(req.user, condominiumId);
  }

  @Post('extraordinary')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.TESORERO, Role.PRESIDENTE)
  createExtraordinary(@Body() dto: CreateExtraordinaryDto, @Request() req, @CurrentTenant() condominiumId: string | null) {
    return this.duesService.createExtraordinary(dto, req.user.userId, condominiumId);
  }

  @Patch('extraordinary/:id')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.TESORERO, Role.PRESIDENTE)
  updateExtraordinary(@Param('id') id: string, @Body() dto: CreateExtraordinaryDto) {
    return this.duesService.updateExtraordinary(id, dto);
  }

  @Delete('extraordinary/:id')
  @Roles(Role.PLATFORM_ADMIN, Role.CONDO_ADMIN, Role.TESORERO, Role.PRESIDENTE)
  deleteExtraordinary(@Param('id') id: string) {
    return this.duesService.deleteExtraordinary(id);
  }

  // ── House History ──────────────────────────────────────────

  @Get('houses/:houseId/history')
  getHouseHistory(@Param('houseId') houseId: string, @Request() req) {
    return this.duesService.getHouseHistory(houseId, req.user);
  }
}
