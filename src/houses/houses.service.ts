import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { House } from './houses.entity';
import { User } from '../users/users.entity';
import { CreateHouseDto } from './dto/create-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';

@Injectable()
export class HousesService {
  constructor(
    @InjectRepository(House)
    private housesRepository: Repository<House>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<House[]> {
    return this.housesRepository.find({
      relations: ['residents'],
      order: { houseNumber: 'ASC' },
    });
  }

  async findOne(id: string): Promise<House> {
    const house = await this.housesRepository.findOne({
      where: { id },
      relations: ['residents'],
    });
    if (!house) throw new NotFoundException(`Casa con id ${id} no encontrada`);
    return house;
  }

  async create(dto: CreateHouseDto): Promise<House> {
    const exists = await this.housesRepository.findOne({
      where: { houseNumber: dto.houseNumber, address: dto.address ?? IsNull() },
    });
    if (exists)
      throw new ConflictException(
        `La casa "${dto.houseNumber}" en "${dto.address}" ya existe`,
      );

    const house = this.housesRepository.create({
      houseNumber: dto.houseNumber,
      address: dto.address,
      status: dto.status ?? 'active',
    });
    return this.housesRepository.save(house);
  }

  async update(id: string, dto: UpdateHouseDto): Promise<House> {
    const house = await this.findOne(id);

    const newNumber = dto.houseNumber ?? house.houseNumber;
    const newAddress = dto.address ?? house.address;
    if (newNumber !== house.houseNumber || newAddress !== house.address) {
      const exists = await this.housesRepository.findOne({
        where: { houseNumber: newNumber, address: newAddress ?? IsNull() },
      });
      if (exists && exists.id !== id)
        throw new ConflictException(
          `La casa "${newNumber}" en "${newAddress}" ya existe`,
        );
    }

    Object.assign(house, dto);
    return this.housesRepository.save(house);
  }

  async remove(id: string): Promise<void> {
    const house = await this.findOne(id);
    await this.housesRepository.remove(house);
  }

  async assignResidents(houseId: string, userIds: string[]): Promise<House> {
    const house = await this.housesRepository.findOne({
      where: { id: houseId },
      relations: ['residents'],
    });
    if (!house) throw new NotFoundException(`Casa con id ${houseId} no encontrada`);

    // Update ManyToMany join table
    house.residents = userIds.length > 0
      ? await this.usersRepository.findBy({ id: In(userIds) })
      : [];
    await this.housesRepository.save(house);

    return this.findOne(houseId);
  }

  async importHouses(
    houses: CreateHouseDto[],
  ): Promise<{ created: number; updated: number; skippedNumbers: string[] }> {
    let created = 0;
    let updated = 0;
    const skippedNumbers: string[] = [];

    for (const dto of houses) {
      if (!dto.houseNumber?.trim()) continue;
      const exists = await this.housesRepository.findOne({
        where: { houseNumber: dto.houseNumber, address: dto.address ?? IsNull() },
      });
      if (exists) {
        skippedNumbers.push(dto.houseNumber);
        continue;
      }
      const house = this.housesRepository.create({
        houseNumber: dto.houseNumber,
        address: dto.address,
        status: dto.status ?? 'active',
      });
      await this.housesRepository.save(house);
      created++;
    }

    return { created, updated, skippedNumbers };
  }
}
