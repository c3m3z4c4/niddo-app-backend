import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { DuesService } from './dues.service';
import { DuesConfig } from './dues-config.entity';
import { DuesPayment } from './dues-payment.entity';
import { DuesPromotion } from './dues-promotion.entity';
import { DuesPolicy } from './dues-policy.entity';
import { ExtraordinaryIncome } from './extraordinary-income.entity';
import { ImportSession } from './import-session.entity';
import { ImportSessionRecord } from './import-session-record.entity';
import { House } from '../houses/houses.entity';
import { User } from '../users/users.entity';
import { Role } from '../auth/roles.enum';

const mockConfigRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), find: jest.fn() };
const mockPaymentRepo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn(), remove: jest.fn() };
const mockPromotionRepo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn(), create: jest.fn(), remove: jest.fn(), createQueryBuilder: jest.fn() };
const mockPolicyRepo = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() };
const mockUserRepo = { findOne: jest.fn(), find: jest.fn() };
const mockExtraordinaryRepo = { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() };
const mockHouseRepo = { findOne: jest.fn(), find: jest.fn() };
const mockSessionRepo = { findOne: jest.fn(), save: jest.fn(), find: jest.fn() };
const mockSessionRecordRepo = { save: jest.fn() };

const mockDataSource = {
  transaction: jest.fn(),
};

const baseConfig = { id: 'cfg-1', amount: 500, effectiveFrom: '2025-01-01', condominiumId: null };
const baseUser = {
  id: 'user-1',
  name: 'Ana',
  lastName: 'Lopez',
  email: 'ana@test.com',
  role: Role.RESIDENT,
  isActive: true,
  houseId: 'house-1',
  condominiumId: null,
};
const basePayment = {
  id: 'pay-1',
  userId: 'user-1',
  houseId: 'house-1',
  month: 5,
  year: 2025,
  amount: 500,
  status: 'pending',
  paidAt: null,
  notes: null,
  condominiumId: null,
};

describe('DuesService', () => {
  let service: DuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DuesService,
        { provide: getRepositoryToken(DuesConfig), useValue: mockConfigRepo },
        { provide: getRepositoryToken(DuesPayment), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(DuesPromotion), useValue: mockPromotionRepo },
        { provide: getRepositoryToken(DuesPolicy), useValue: mockPolicyRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(ExtraordinaryIncome), useValue: mockExtraordinaryRepo },
        { provide: getRepositoryToken(House), useValue: mockHouseRepo },
        { provide: getRepositoryToken(ImportSession), useValue: mockSessionRepo },
        { provide: getRepositoryToken(ImportSessionRecord), useValue: mockSessionRecordRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<DuesService>(DuesService);
    jest.clearAllMocks();
  });

  // ─── generateMonthlyDues ─────────────────────────────────────────────────────

  describe('generateMonthlyDues', () => {
    it('should throw NotFoundException when no config exists', async () => {
      mockConfigRepo.findOne.mockResolvedValue(null);

      await expect(service.generateMonthlyDues(5, 2025)).rejects.toThrow(NotFoundException);
    });

    it('should generate pending dues for active RESIDENT users', async () => {
      mockConfigRepo.findOne.mockResolvedValue(baseConfig);
      mockUserRepo.find.mockResolvedValue([baseUser]);
      mockHouseRepo.find.mockResolvedValue([]);
      mockPaymentRepo.findOne.mockResolvedValue(null);
      mockPaymentRepo.save.mockResolvedValue(basePayment);

      const result = await service.generateMonthlyDues(5, 2025);

      expect(result.generated).toBe(1);
      expect(result.exempt).toBe(0);
      expect(mockPaymentRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should skip existing payment records', async () => {
      mockConfigRepo.findOne.mockResolvedValue(baseConfig);
      mockUserRepo.find.mockResolvedValue([baseUser]);
      mockHouseRepo.find.mockResolvedValue([]);
      mockPaymentRepo.findOne.mockResolvedValue(basePayment);

      const result = await service.generateMonthlyDues(5, 2025);

      expect(result.generated).toBe(0);
      expect(mockPaymentRepo.save).not.toHaveBeenCalled();
    });

    it('should skip PLATFORM_ADMIN and CONDO_ADMIN users', async () => {
      const adminUser = { ...baseUser, role: Role.PLATFORM_ADMIN };
      mockConfigRepo.findOne.mockResolvedValue(baseConfig);
      mockUserRepo.find.mockResolvedValue([adminUser]);
      mockHouseRepo.find.mockResolvedValue([]);

      const result = await service.generateMonthlyDues(5, 2025);

      expect(result.generated).toBe(0);
      expect(mockPaymentRepo.save).not.toHaveBeenCalled();
    });

    it('should mark PRESIDENTE users as exempt (amount=0, status=exempt)', async () => {
      const presUser = { ...baseUser, role: Role.PRESIDENTE };
      mockConfigRepo.findOne.mockResolvedValue(baseConfig);
      mockUserRepo.find.mockResolvedValue([presUser]);
      mockHouseRepo.find.mockResolvedValue([]);
      mockPaymentRepo.findOne.mockResolvedValue(null);
      mockPaymentRepo.save.mockResolvedValue({ ...basePayment, amount: 0, status: 'exempt' });

      const result = await service.generateMonthlyDues(5, 2025);

      expect(result.exempt).toBe(1);
      expect(result.generated).toBe(0);
      expect(mockPaymentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 0, status: 'exempt' }),
      );
    });
  });

  // ─── importPayments ──────────────────────────────────────────────────────────

  describe('importPayments', () => {
    const mockSession = { id: 'session-1', status: 'completed' };

    beforeEach(() => {
      mockSessionRepo.save.mockImplementation(async (s) => {
        if (!s.id) s.id = 'session-1';
        return s;
      });
      mockSessionRecordRepo.save.mockResolvedValue([]);
    });

    it('should skip items where user email is not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.importPayments([
        { email: 'noexist@test.com', month: 5, year: 2025, paidAt: '2025-05-01' },
      ]);

      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.created).toBe(0);
    });

    it('should create new payment when no existing record', async () => {
      mockUserRepo.findOne.mockResolvedValue(baseUser);
      mockPaymentRepo.findOne.mockResolvedValue(null);
      mockConfigRepo.findOne.mockResolvedValue(baseConfig);
      mockPaymentRepo.save.mockResolvedValue({ ...basePayment, status: 'paid' });

      const result = await service.importPayments([
        { email: 'ana@test.com', month: 5, year: 2025, paidAt: '2025-05-01' },
      ]);

      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
    });

    it('should update existing pending payment to paid', async () => {
      mockUserRepo.findOne.mockResolvedValue(baseUser);
      mockPaymentRepo.findOne.mockResolvedValue({ ...basePayment, status: 'pending' });
      mockPaymentRepo.save.mockResolvedValue({ ...basePayment, status: 'paid' });

      const result = await service.importPayments([
        { email: 'ana@test.com', month: 5, year: 2025, paidAt: '2025-05-01' },
      ]);

      expect(result.updated).toBe(1);
      expect(result.created).toBe(0);
    });

    it('should skip already paid or exempt payments', async () => {
      mockUserRepo.findOne.mockResolvedValue(baseUser);
      mockPaymentRepo.findOne.mockResolvedValue({ ...basePayment, status: 'paid' });

      const result = await service.importPayments([
        { email: 'ana@test.com', month: 5, year: 2025, paidAt: '2025-05-01' },
      ]);

      expect(result.skipped).toBe(1);
      expect(result.updated).toBe(0);
    });

    it('should return sessionId in the result', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.importPayments([]);

      expect(result).toHaveProperty('sessionId');
      expect(typeof result.sessionId).toBe('string');
    });
  });

  // ─── rollbackImport ──────────────────────────────────────────────────────────

  describe('rollbackImport', () => {
    it('should throw NotFoundException when session not found', async () => {
      mockSessionRepo.findOne.mockResolvedValue(null);

      await expect(service.rollbackImport('bad-session-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when session already rolled back', async () => {
      mockSessionRepo.findOne.mockResolvedValue({ id: 'session-1', status: 'rolled_back' });

      await expect(service.rollbackImport('session-1')).rejects.toThrow(BadRequestException);
    });

    it('should execute transaction and rollback created and updated records', async () => {
      mockSessionRepo.findOne.mockResolvedValue({ id: 'session-1', status: 'completed', condominiumId: null });

      const mockManager = {
        find: jest.fn().mockResolvedValue([
          { id: 'rec-1', action: 'created', paymentId: 'pay-new' },
          { id: 'rec-2', action: 'updated', paymentId: 'pay-1', prevStatus: 'pending', prevPaidAt: null, prevNotes: null },
        ]),
        delete: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      };
      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await service.rollbackImport('session-1');

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockManager.delete).toHaveBeenCalledWith(DuesPayment, { id: 'pay-new' });
      expect(mockManager.update).toHaveBeenCalledWith(
        DuesPayment,
        { id: 'pay-1' },
        expect.objectContaining({ status: 'pending' }),
      );
    });
  });

  // ─── getSummary ──────────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('should return correct counts and amounts for a month', async () => {
      mockPaymentRepo.find.mockResolvedValue([
        { ...basePayment, status: 'paid', amount: 500 },
        { ...basePayment, id: 'pay-2', status: 'pending', amount: 500 },
        { ...basePayment, id: 'pay-3', status: 'exempt', amount: 0 },
      ]);

      const result = await service.getSummary(5, 2025);

      expect(result.total).toBe(3);
      expect(result.paid).toBe(1);
      expect(result.pending).toBe(1);
      expect(result.exempt).toBe(1);
      expect(result.collectedAmount).toBe(500);
      expect(result.totalAmount).toBe(1000);
    });
  });

  // ─── getDebtors ──────────────────────────────────────────────────────────────

  describe('getDebtors', () => {
    it('should group pending payments by user and calculate access status', async () => {
      mockPolicyRepo.findOne.mockResolvedValue({ mobileLockMonths: 1, cardLockMonths: 3 });
      const pendingPayments = [
        { ...basePayment, month: 3, user: baseUser, house: { houseNumber: 'A-01', address: 'Calle 1' } },
        { ...basePayment, id: 'pay-2', month: 4, user: baseUser, house: { houseNumber: 'A-01', address: 'Calle 1' } },
      ];
      mockPaymentRepo.find.mockResolvedValue(pendingPayments);

      const result = await service.getDebtors();

      expect(result).toHaveLength(1);
      expect(result[0].pendingMonths).toBe(2);
      expect(result[0].accessStatus).toBe('mobile_suspended');
    });

    it('should set card_suspended when pending months >= cardLockMonths', async () => {
      mockPolicyRepo.findOne.mockResolvedValue({ mobileLockMonths: 1, cardLockMonths: 3 });
      const threeMonths = [1, 2, 3].map((m) => ({
        ...basePayment,
        id: `pay-${m}`,
        month: m,
        user: baseUser,
        house: null,
      }));
      mockPaymentRepo.find.mockResolvedValue(threeMonths);

      const result = await service.getDebtors();

      expect(result[0].accessStatus).toBe('card_suspended');
    });
  });

  // ─── applyPromotion ──────────────────────────────────────────────────────────

  describe('applyPromotion', () => {
    const basePromo = {
      id: 'promo-1',
      name: 'Descuento 50%',
      discountPercentage: 50,
      monthCount: 2,
      isActive: true,
      validTo: '2025-12-31',
    };

    it('should throw ForbiddenException for RESIDENT role', async () => {
      await expect(
        service.applyPromotion(
          { promotionId: 'promo-1', houseId: 'house-1', startMonth: 5, startYear: 2025 },
          Role.RESIDENT,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when promotion not found', async () => {
      mockPromotionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.applyPromotion(
          { promotionId: 'bad-promo', houseId: 'house-1', startMonth: 5, startYear: 2025 },
          Role.PLATFORM_ADMIN,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when no active users in house', async () => {
      mockPromotionRepo.findOne.mockResolvedValue(basePromo);
      mockHouseRepo.findOne.mockResolvedValue({ id: 'house-1' });
      mockUserRepo.find.mockResolvedValue([]);

      await expect(
        service.applyPromotion(
          { promotionId: 'promo-1', houseId: 'house-1', startMonth: 5, startYear: 2025 },
          Role.PLATFORM_ADMIN,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should apply discounted payments for each month in promotion', async () => {
      mockPromotionRepo.findOne.mockResolvedValue(basePromo);
      mockHouseRepo.findOne.mockResolvedValue({ id: 'house-1' });
      mockUserRepo.find.mockResolvedValue([baseUser]);
      mockConfigRepo.findOne.mockResolvedValue(baseConfig);
      mockPaymentRepo.findOne.mockResolvedValue(null);
      mockPaymentRepo.save.mockResolvedValue({});

      const result = await service.applyPromotion(
        { promotionId: 'promo-1', houseId: 'house-1', startMonth: 5, startYear: 2025 },
        Role.PLATFORM_ADMIN,
      );

      // 2 months × 1 user = 2 applied
      expect(result.applied).toBe(2);
      expect(mockPaymentRepo.save).toHaveBeenCalledTimes(2);
      expect(mockPaymentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 250, status: 'paid' }),
      );
    });
  });
});
