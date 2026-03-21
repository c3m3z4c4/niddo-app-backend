import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      where: { houseNumber: dto.houseNumber },
    });
    if (exists)
      throw new ConflictException(
        `El número de casa "${dto.houseNumber}" ya existe`,
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

    if (dto.houseNumber && dto.houseNumber !== house.houseNumber) {
      const exists = await this.housesRepository.findOne({
        where: { houseNumber: dto.houseNumber },
      });
      if (exists)
        throw new ConflictException(
          `El número de casa "${dto.houseNumber}" ya existe`,
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
    await this.findOne(houseId); // verify house exists

    // Unassign all current residents of this house
    await this.usersRepository.update({ houseId }, { houseId: null } as any);

    // Assign selected users to this house
    if (userIds.length > 0) {
      await this.usersRepository
        .createQueryBuilder()
        .update(User)
        .set({ houseId })
        .whereInIds(userIds)
        .execute();
    }

    return this.findOne(houseId);
  }

  async importHouses(
    houses: CreateHouseDto[],
  ): Promise<{ created: number; skipped: number; skippedNumbers: string[] }> {
    let created = 0;
    let skipped = 0;
    const skippedNumbers: string[] = [];

    for (const dto of houses) {
      const exists = await this.housesRepository.findOne({
        where: { houseNumber: dto.houseNumber },
      });
      if (exists) {
        skipped++;
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

    return { created, skipped, skippedNumbers };
  }
}
