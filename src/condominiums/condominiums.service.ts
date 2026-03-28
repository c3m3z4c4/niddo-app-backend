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

  async findPublic(id: string): Promise<Pick<Condominium, 'id' | 'name' | 'slug' | 'branding'>> {
    const condo = await this.repo.findOne({
      where: { id },
      select: ['id', 'name', 'slug', 'branding'],
    });
    if (!condo) throw new NotFoundException(`Condominio ${id} no encontrado`);
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

  async getPlatformStats(): Promise<{
    totals: { condominiums: number; users: number; houses: number };
    byStatus: Record<string, number>;
    trialsExpiringSoon: Condominium[];
    monthlyGrowth: { month: string; count: number }[];
    perCondominium: {
      id: string; name: string; slug: string; status: string;
      city: string | null; trialEndsAt: Date | null; createdAt: Date;
      userCount: number; houseCount: number;
    }[];
  }> {
    const condominiums = await this.repo.find({ order: { createdAt: 'DESC' } });

    // Count users and houses per condominium
    const userCounts = await this.repo.manager.query(`
      SELECT "condominiumId", COUNT(*)::int AS count
      FROM users
      WHERE "condominiumId" IS NOT NULL
      GROUP BY "condominiumId"
    `);
    const houseCounts = await this.repo.manager.query(`
      SELECT "condominiumId", COUNT(*)::int AS count
      FROM houses
      WHERE "condominiumId" IS NOT NULL
      GROUP BY "condominiumId"
    `);

    const userMap: Record<string, number> = {};
    const houseMap: Record<string, number> = {};
    for (const r of userCounts) userMap[r.condominiumId] = r.count;
    for (const r of houseCounts) houseMap[r.condominiumId] = r.count;

    // Totals
    const totalUsers = (await this.repo.manager.query(`SELECT COUNT(*)::int AS c FROM users WHERE "condominiumId" IS NOT NULL`))[0].c;
    const totalHouses = (await this.repo.manager.query(`SELECT COUNT(*)::int AS c FROM houses WHERE "condominiumId" IS NOT NULL`))[0].c;

    // By status
    const byStatus: Record<string, number> = { active: 0, trial: 0, suspended: 0, cancelled: 0 };
    for (const c of condominiums) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;

    // Trials expiring in next 7 days
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const trialsExpiringSoon = condominiums.filter(
      c => c.status === 'trial' && c.trialEndsAt && c.trialEndsAt <= in7,
    );

    // Monthly growth (last 6 months)
    const monthlyRaw = await this.repo.manager.query(`
      SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM condominiums
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `);

    return {
      totals: { condominiums: condominiums.length, users: totalUsers, houses: totalHouses },
      byStatus,
      trialsExpiringSoon,
      monthlyGrowth: monthlyRaw,
      perCondominium: condominiums.map(c => ({
        id: c.id, name: c.name, slug: c.slug, status: c.status,
        city: c.city ?? null, trialEndsAt: c.trialEndsAt,
        createdAt: c.createdAt,
        userCount: userMap[c.id] ?? 0,
        houseCount: houseMap[c.id] ?? 0,
      })),
    };
  }
}
