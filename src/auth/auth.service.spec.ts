import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { User } from '../users/users.entity';
import { Role } from './roles.enum';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'uuid-1',
  name: 'Juan',
  lastName: 'Perez',
  email: 'juan@test.com',
  password: 'hashed_password',
  phone: '1234567890',
  address: 'Calle 1',
  role: Role.RESIDENT,
  isActive: true,
  house: null as any,
  houseId: null as any,
  createdAt: new Date(),
  condominiumId: null as any,
  condominium: null as any,
};

const mockUsersRepository = {
  findOne: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock_token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw UnauthorizedException when user is not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.login('noexist@test.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('juan@test.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return access_token and user data on valid credentials', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('juan@test.com', 'correct');

      expect(result.access_token).toBe('mock_token');
      expect(result.user).toMatchObject({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('should sign JWT with user id and role', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login('juan@test.com', 'correct');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          role: mockUser.role,
        }),
      );
    });
  });
});
