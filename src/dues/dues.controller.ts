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
import { DuesService } from './dues.service';
import { CreateDuesConfigDto } from './dto/create-dues-config.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { GenerateDuesDto } from './dto/generate-dues.dto';
import { ImportPaymentsDto } from './dto/import-payments.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { CreateDuesPolicyDto } from './dto/create-dues-policy.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dues')
export class DuesController {
  constructor(private readonly duesService: DuesService) {}

  @Get('config')
  getConfig() {
    return this.duesService.getConfig();
  }

  @Post('config')
  @Roles(Role.SUPER_ADMIN)
  setConfig(@Body() dto: CreateDuesConfigDto, @Request() req) {
    return this.duesService.setConfig(dto, req.user.role);
  }

  @Get('summary')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  getSummary(@Query('month') month: string, @Query('year') year: string) {
    return this.duesService.getSummary(Number(month), Number(year));
  }

  // ── Promotions (MUST be before :id routes) ──────────────────

  @Get('promotions')
  getActivePromotions() {
    return this.duesService.getActivePromotions();
  }

  @Get('promotions/all')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  getAllPromotions() {
    return this.duesService.getAllPromotions();
  }

  @Post('promotions')
  @Roles(Role.SUPER_ADMIN)
  createPromotion(@Body() dto: CreatePromotionDto, @Request() req) {
    return this.duesService.createPromotion(dto, req.user.role);
  }

  @Patch('promotions/:id')
  @Roles(Role.SUPER_ADMIN)
  updatePromotion(
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto,
    @Request() req,
  ) {
    return this.duesService.updatePromotion(id, dto, req.user.role);
  }

  @Delete('promotions/:id')
  @Roles(Role.SUPER_ADMIN)
  deletePromotion(@Param('id') id: string, @Request() req) {
    return this.duesService.deletePromotion(id, req.user.role);
  }

  // ── Payments ────────────────────────────────────────────────

  @Get()
  findAll(@Request() req) {
    return this.duesService.findAll(req.user);
  }

  @Post('generate')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  generateMonthlyDues(@Body() dto: GenerateDuesDto) {
    return this.duesService.generateMonthlyDues(dto.month, dto.year);
  }

  @Post('import')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TESORERO)
  importPayments(@Body() dto: ImportPaymentsDto) {
    return this.duesService.importPayments(dto.payments);
  }

  @Delete('all')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  deleteAllPayments(@Request() req) {
    return this.duesService.deleteAllPayments(req.user.role);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TESORERO)
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.duesService.createPayment(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TESORERO)
  updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.duesService.updatePayment(id, dto);
  }

  // ── Policy ────────────────────────────────────────────────

  @Get('policy')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  getPolicy() {
    return this.duesService.getPolicy();
  }

  @Post('policy')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.TESORERO)
  setPolicy(@Body() dto: CreateDuesPolicyDto) {
    return this.duesService.setPolicy(dto);
  }

  @Get('debtors')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENTE, Role.SECRETARIO, Role.TESORERO)
  getDebtors() {
    return this.duesService.getDebtors();
  }
}
