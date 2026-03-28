import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { CondominiumsService } from './condominiums/condominiums.service';
import { PRIVADAS_DEL_PARQUE_BRANDING } from './condominiums/condominium-branding.interface';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded files as static assets
  const uploadsDir = resolve(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization, x-tenant-id',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // ── Seed: Condominium "Privadas del Parque" ─────────────────────────────
  const condominiumsService = app.get(CondominiumsService);
  const seedCondo = await condominiumsService.findOrCreate({
    name: 'Privadas del Parque',
    slug: 'privadas-del-parque',
    city: 'México',
    state: 'MX',
    status: 'active',
    branding: PRIVADAS_DEL_PARQUE_BRANDING,
  });
  console.log(`✅ Condominium seed: ${seedCondo.name} (${seedCondo.id})`);

  // ── Seed: Platform admins (no condominiumId) ────────────────────────────
  const usersService = app.get(UsersService);
  await usersService.createPlatformAdmin(
    'Super',
    'Administrador',
    process.env.SUPER_ADMIN_EMAIL ?? 'superadmin@niddo.app',
    process.env.SUPER_ADMIN_PASSWORD ?? 'SuperAdmin2025!',
  );
  await usersService.createPlatformAdmin(
    'Deorsoft',
    'Admin',
    'deorsoft@gmail.com',
    'Temporal2025!',
  );

  // ── Seed: Vecino de prueba en Privadas del Parque ───────────────────────
  await usersService.createSeedResident(
    'Juan',
    'Vecino',
    'vecino@privadasdelparque.com',
    'Vecino2025!',
    seedCondo.id,
  );

  // ── One-time migration: fix house_residents join table ──────────────────
  try {
    const dataSource = app.get(DataSource);

    // Remove any admin users that got into house_residents by mistake
    await dataSource.query(`
      DELETE FROM house_residents
      WHERE "userId" IN (
        SELECT id FROM users WHERE role IN ('PLATFORM_ADMIN', 'CONDO_ADMIN')
      )
    `);

    // Migrate residents from users.houseId into the join table
    await dataSource.query(`
      INSERT INTO house_residents ("houseId", "userId")
      SELECT "houseId", id FROM users
      WHERE "houseId" IS NOT NULL
        AND role NOT IN ('PLATFORM_ADMIN', 'CONDO_ADMIN')
      ON CONFLICT DO NOTHING
    `);

    // Backfill condominiumId for existing users that belong to the seed condo
    await dataSource.query(`
      UPDATE users
      SET "condominiumId" = $1
      WHERE "condominiumId" IS NULL
        AND role NOT IN ('PLATFORM_ADMIN')
    `, [seedCondo.id]);

    // Backfill condominiumId for all other tables
    for (const table of [
      'houses', 'green_area_events', 'meetings', 'rsvps',
      'dues_config', 'dues_payments', 'dues_promotions', 'dues_policy',
      'extraordinary_income', 'green_area_reservations', 'projects',
      'direct_messages', 'notifications',
    ]) {
      await dataSource.query(`
        UPDATE "${table}"
        SET "condominiumId" = $1
        WHERE "condominiumId" IS NULL
      `, [seedCondo.id]);
    }

    console.log('✅ condominiumId backfill complete');
  } catch (e) {
    console.warn('⚠️  Seed migration skipped:', e.message);
  }

  await app.listen(3000, '0.0.0.0');
  console.log(`✅ Niddo backend running on http://0.0.0.0:3000`);
}
bootstrap();
