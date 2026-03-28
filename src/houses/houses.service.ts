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

  async findAll(condominiumId: string | null): Promise<House[]> {
    const where: any = {};
    if (condominiumId) where.condominiumId = condominiumId;
    return this.housesRepository.find({
      where,
      relations: ['residents'],
      order: { houseNumber: 'ASC' },
    });
  }

  async findOne(id: string, condominiumId: string | null): Promise<House> {
    const where: any = { id };
    if (condominiumId) where.condominiumId = condominiumId;
    const house = await this.housesRepository.findOne({
      where,
      relations: ['residents'],
    });
    if (!house) throw new NotFoundException(`Casa con id ${id} no encontrada`);
    return house;
  }

  async create(dto: CreateHouseDto, condominiumId: string | null): Promise<House> {
    const dupWhere: any = { houseNumber: dto.houseNumber, address: dto.address ?? IsNull() };
    if (condominiumId) dupWhere.condominiumId = condominiumId;
    const exists = await this.housesRepository.findOne({ where: dupWhere });
    if (exists)
      throw new ConflictException(
        `La casa "${dto.houseNumber}" en "${dto.address}" ya existe`,
      );

    const house = this.housesRepository.create({
      houseNumber: dto.houseNumber,
      address: dto.address,
      status: dto.status ?? 'active',
      condominiumId: condominiumId ?? undefined,
    });
    return this.housesRepository.save(house);
  }

  async update(id: string, dto: UpdateHouseDto, condominiumId: string | null): Promise<House> {
    const house = await this.findOne(id, condominiumId);

    const newNumber = dto.houseNumber ?? house.houseNumber;
    const newAddress = dto.address ?? house.address;
    if (newNumber !== house.houseNumber || newAddress !== house.address) {
      const dupWhere: any = { houseNumber: newNumber, address: newAddress ?? IsNull() };
      if (condominiumId) dupWhere.condominiumId = condominiumId;
      const exists = await this.housesRepository.findOne({ where: dupWhere });
      if (exists && exists.id !== id)
        throw new ConflictException(
          `La casa "${newNumber}" en "${newAddress}" ya existe`,
        );
    }

    Object.assign(house, dto);
    return this.housesRepository.save(house);
  }

  async remove(id: string, condominiumId: string | null): Promise<void> {
    const house = await this.findOne(id, condominiumId);
    await this.housesRepository.remove(house);
  }

  async assignResidents(houseId: string, userIds: string[], condominiumId: string | null): Promise<House> {
    const where: any = { id: houseId };
    if (condominiumId) where.condominiumId = condominiumId;
    const house = await this.housesRepository.findOne({
      where,
      relations: ['residents'],
    });
    if (!house) throw new NotFoundException(`Casa con id ${houseId} no encontrada`);

    // Update ManyToMany join table
    house.residents = userIds.length > 0
      ? await this.usersRepository.findBy({ id: In(userIds) })
      : [];
    await this.housesRepository.save(house);

    return this.findOne(houseId, condominiumId);
  }

  async importHouses(
    houses: CreateHouseDto[],
    condominiumId: string | null,
  ): Promise<{ created: number; updated: number; skippedNumbers: string[] }> {
    let created = 0;
    let updated = 0;
    const skippedNumbers: string[] = [];

    for (const dto of houses) {
      if (!dto.houseNumber?.trim()) continue;
      const dupWhere: any = { houseNumber: dto.houseNumber, address: dto.address ?? IsNull() };
      if (condominiumId) dupWhere.condominiumId = condominiumId;
      const exists = await this.housesRepository.findOne({ where: dupWhere });
      if (exists) {
        skippedNumbers.push(dto.houseNumber);
        continue;
      }
      const house = this.housesRepository.create({
        houseNumber: dto.houseNumber,
        address: dto.address,
        status: dto.status ?? 'active',
        condominiumId: condominiumId ?? undefined,
      });
      await this.housesRepository.save(house);
      created++;
    }

    return { created, updated, skippedNumbers };
  }
}
