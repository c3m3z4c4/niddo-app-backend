import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingService } from './billing.service';
import { CondominiumLicense } from './condominium-license.entity';
import { PlatformSettings } from './platform-settings.entity';
import { SaasPayment } from './saas-payment.entity';
import { House } from '../houses/houses.entity';
import { Role } from '../auth/roles.enum';
import { CreateSaasPaymentDto } from './dto/create-saas-payment.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

describe('BillingService', () => {
  let service: BillingService;
  let licenseRepo: Repository<CondominiumLicense>;
  let settingsRepo: Repository<PlatformSettings>;
  let paymentsRepo: Repository<SaasPayment>;
  let houseRepo: Repository<House>;

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: getRepositoryToken(CondominiumLicense),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(PlatformSettings),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(SaasPayment),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(House),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    licenseRepo = module.get(getRepositoryToken(CondominiumLicense));
    settingsRepo = module.get(getRepositoryToken(PlatformSettings));
    paymentsRepo = module.get(getRepositoryToken(SaasPayment));
    houseRepo = module.get(getRepositoryToken(House));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayment', () => {
    it('should calculate dynamic billing based on active houses count', async () => {
      const condoId = 'condo-123';
      const userId = 'user-456';
      const dto: CreateSaasPaymentDto = {
        billingCycle: 'MONTHLY',
        periodCoveredFrom: '2026-05-01',
        periodCoveredTo: '2026-05-31',
      };

      const mockSettings = {
        monthlyPrice: 50,
        annualPrice: 500,
      } as PlatformSettings;

      jest.spyOn(service, 'getSettings').mockResolvedValue(mockSettings);
      jest.spyOn(houseRepo, 'count').mockResolvedValue(10); // 10 active houses
      jest.spyOn(paymentsRepo, 'create').mockImplementation((dto) => dto as any);
      jest.spyOn(paymentsRepo, 'save').mockImplementation(async (payment) => payment as any);

      const result = await service.createPayment(condoId, userId, dto);

      expect(houseRepo.count).toHaveBeenCalledWith({
        where: { condominiumId: condoId, status: 'active' },
      });
      // 10 houses * 50 monthly price = 500 amount
      expect(result.amount).toBe(500);
      expect(result.condominiumId).toBe(condoId);
      expect(result.submittedById).toBe(userId);
    });

    it('should calculate annual dynamic billing correctly', async () => {
      const condoId = 'condo-123';
      const userId = 'user-456';
      const dto: CreateSaasPaymentDto = {
        billingCycle: 'ANNUAL',
      };

      const mockSettings = {
        monthlyPrice: 50,
        annualPrice: 400,
      } as PlatformSettings;

      jest.spyOn(service, 'getSettings').mockResolvedValue(mockSettings);
      jest.spyOn(houseRepo, 'count').mockResolvedValue(5); // 5 active houses
      jest.spyOn(paymentsRepo, 'create').mockImplementation((dto) => dto as any);
      jest.spyOn(paymentsRepo, 'save').mockImplementation(async (payment) => payment as any);

      const result = await service.createPayment(condoId, userId, dto);

      // 5 houses * 400 annual price = 2000 amount
      expect(result.amount).toBe(2000);
    });
  });

  describe('sanitizeSettings', () => {
    it('should mask secret keys for PLATFORM_ADMIN', () => {
      const settings = {
        paymentInstructions: 'Transfer to CLABE...',
        acceptedMethods: ['TRANSFER'],
        monthlyPrice: 100,
        annualPrice: 1000,
        visibleToRoles: ['CONDO_ADMIN'],
        stripePublicKey: 'pk_test_123',
        stripeSecretKey: 'sk_test_hidden',
        stripeWebhookSecret: 'whsec_stripe',
        conektaPublicKey: 'key_conekta_pub',
        conektaPrivateKey: 'key_conekta_priv',
        conektaWebhookSecret: 'whsec_conekta',
      } as PlatformSettings;

      const sanitized = service.sanitizeSettings(settings, Role.PLATFORM_ADMIN);

      expect(sanitized.stripePublicKey).toBe('pk_test_123');
      expect(sanitized.stripeSecretKey).toBe('••••••••');
      expect(sanitized.stripeWebhookSecret).toBe('••••••••');
      expect(sanitized.conektaPublicKey).toBe('key_conekta_pub');
      expect(sanitized.conektaPrivateKey).toBe('••••••••');
      expect(sanitized.conektaWebhookSecret).toBe('••••••••');
      expect(sanitized.paymentInstructions).toBe('Transfer to CLABE...');
    });

    it('should return null keys for non-PLATFORM_ADMIN roles', () => {
      const settings = {
        paymentInstructions: 'Transfer to CLABE...',
        acceptedMethods: ['TRANSFER'],
        monthlyPrice: 100,
        annualPrice: 1000,
        visibleToRoles: ['CONDO_ADMIN'],
        stripePublicKey: 'pk_test_123',
        stripeSecretKey: 'sk_test_hidden',
        stripeWebhookSecret: 'whsec_stripe',
        conektaPublicKey: 'key_conekta_pub',
        conektaPrivateKey: 'key_conekta_priv',
        conektaWebhookSecret: 'whsec_conekta',
      } as PlatformSettings;

      const sanitized = service.sanitizeSettings(settings, Role.CONDO_ADMIN);

      expect(sanitized.stripePublicKey).toBeNull();
      expect(sanitized.stripeSecretKey).toBeNull();
      expect(sanitized.stripeWebhookSecret).toBeNull();
      expect(sanitized.conektaPublicKey).toBeNull();
      expect(sanitized.conektaPrivateKey).toBeNull();
      expect(sanitized.conektaWebhookSecret).toBeNull();
    });
  });

  describe('updateSettings', () => {
    it('should update normal settings and skip masked key updates', async () => {
      const existingSettings = {
        id: 'settings-1',
        paymentInstructions: 'Old instructions',
        acceptedMethods: ['TRANSFER'],
        monthlyPrice: 100,
        annualPrice: 1000,
        stripePublicKey: 'pk_old',
        stripeSecretKey: 'sk_secret_val',
        stripeWebhookSecret: 'whsec_old',
      } as PlatformSettings;

      jest.spyOn(service, 'getSettings').mockResolvedValue(existingSettings);
      jest.spyOn(settingsRepo, 'save').mockImplementation(async (settings) => settings as any);

      const dto: UpdateSettingsDto = {
        paymentInstructions: 'New instructions',
        stripePublicKey: 'pk_new',
        stripeSecretKey: '••••••••', // should skip update
        stripeWebhookSecret: 'whsec_new_value', // should update
      };

      const result = await service.updateSettings(dto);

      expect(result.paymentInstructions).toBe('New instructions');
      expect(result.stripePublicKey).toBe('pk_new');
      expect(result.stripeSecretKey).toBe('sk_secret_val'); // kept old value
      expect(result.stripeWebhookSecret).toBe('whsec_new_value'); // updated new value
    });
  });
});
