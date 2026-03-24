import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from './user-settings.entity';

@Injectable()
export class UserSettingsService {
  constructor(
    @InjectRepository(UserSettings)
    private readonly repo: Repository<UserSettings>,
  ) {}

  async getSettings(userId: string): Promise<Record<string, any>> {
    const record = await this.repo.findOne({ where: { userId } });
    return record?.settings ?? {};
  }

  async updateSettings(
    userId: string,
    patch: Record<string, any>,
  ): Promise<Record<string, any>> {
    let record = await this.repo.findOne({ where: { userId } });
    if (!record) {
      record = this.repo.create({ userId, settings: patch });
    } else {
      record.settings = { ...record.settings, ...patch };
    }
    const saved = await this.repo.save(record);
    return saved.settings;
  }
}
