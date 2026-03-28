import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Condominium } from './condominium.entity';
import { CreateCondominiumDto } from './dto/create-condominium.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { CondominiumBranding, DEFAULT_BRANDING } from './condominium-branding.interface';

@Injectable()
export class CondominiumsService {
  constructor(
    @InjectRepository(Condominium)
    private repo: Repository<Condominium>,
  ) {}

  async findAll(): Promise<Condominium[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Condominium> {
    const condo = await this.repo.findOne({ where: { id } });
    if (!condo) throw new NotFoundException(`Condominio ${id} no encontrado`);
    return condo;
  }

  async findBySlug(slug: string): Promise<Condominium> {
    const condo = await this.repo.findOne({ where: { slug } });
    if (!condo) throw new NotFoundException(`Condominio "${slug}" no encontrado`);
    return condo;
  }

  async create(dto: CreateCondominiumDto): Promise<Condominium> {
    const existing = await this.repo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`El slug "${dto.slug}" ya está en uso`);

    const condo = this.repo.create({
      ...dto,
      branding: DEFAULT_BRANDING,
    });
    return this.repo.save(condo);
  }

  async updateBranding(id: string, dto: UpdateBrandingDto): Promise<Condominium> {
    const condo = await this.findOne(id);

    // Deep merge: only overwrite the fields provided
    const merged: CondominiumBranding = {
      ...condo.branding,
      ...dto,
      colors: dto.colors
        ? { ...condo.branding.colors, ...dto.colors }
        : condo.branding.colors,
      font: dto.font
        ? { ...condo.branding.font, ...dto.font }
        : condo.branding.font,
    };

    condo.branding = merged;
    return this.repo.save(condo);
  }

  async update(id: string, dto: Partial<CreateCondominiumDto>): Promise<Condominium> {
    const condo = await this.findOne(id);
    Object.assign(condo, dto);
    return this.repo.save(condo);
  }

  async remove(id: string): Promise<void> {
    const condo = await this.findOne(id);
    await this.repo.remove(condo);
  }

  /** Used internally for seeding */
  async findOrCreate(dto: CreateCondominiumDto & { branding?: CondominiumBranding }): Promise<Condominium> {
    const existing = await this.repo.findOne({ where: { slug: dto.slug } });
    if (existing) return existing;

    const condo = this.repo.create({
      ...dto,
      branding: dto.branding ?? DEFAULT_BRANDING,
    });
    return this.repo.save(condo);
  }
}
