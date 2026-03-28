import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Client } from 'pg';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { CondominiumsService } from './condominiums/condominiums.service';
import { PRIVADAS_DEL_PARQUE_BRANDING } from './condominiums/condominium-branding.interface';

/**
 * Runs BEFORE TypeORM synchronize to migrate legacy role values.
 * Old: SUPER_ADMIN → PLATFORM_ADMIN, ADMIN → CONDO_ADMIN, VECINO → RESIDENT
 * TypeORM synchronize recreates the role enum type; this ensures the USING cast succeeds.
 */
async function migrateRolesIfNeeded(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST,
    port: +(process.env.DB_PORT ?? '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();

    // Check whether legacy values still exist (no-op on fresh DBs or already migrated)
    const { rows } = await client.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'role'
      LIMIT 1
    `);
    if (rows.length === 0) { await client.end(); return; }

    const legacy = await client.query(`
      SELECT 1 FROM users
      WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'VECINO')
      LIMIT 1
    `);
    if (legacy.rows.length === 0) { await client.end(); return; }

    console.log('🔄  Migrating legacy role values …');

    // Add new enum values so the UPDATE succeeds (ADD VALUE is idempotent-ish)
    for (const v of ['PLATFORM_ADMIN', 'CONDO_ADMIN', 'RESIDENT']) {
      await client.query(`
        DO $$ BEGIN
          ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS '${v}';
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
    }

    // Remap data
    await client.query(`UPDATE users SET role = 'PLATFORM_ADMIN' WHERE role = 'SUPER_ADMIN'`);
    await client.query(`UPDATE users SET role = 'CONDO_ADMIN'    WHERE role = 'ADMIN'`);
    await client.query(`UPDATE users SET role = 'RESIDENT'       WHERE role = 'VECINO'`);

    console.log('✅  Role migration complete');
  } catch (e) {
    console.warn('⚠️   migrateRolesIfNeeded skipped:', (e as Error).message);
  } finally {
    try { await client.end(); } catch { /* ignore */ }
  }
}

async function bootstrap() {
  await migrateRolesIfNeeded();
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

    // Backfill condominiumId for all other tables (each wrapped independently)
    for (const table of [
      'houses', 'green_area_events', 'meetings', 'rsvps',
      'dues_config', 'dues_payments', 'dues_promotions', 'dues_policy',
      'extraordinary_income', 'green_area_reservations', 'projects',
      'direct_messages', 'notifications',
    ]) {
      try {
        const result = await dataSource.query(`
          UPDATE "${table}"
          SET "condominiumId" = $1
          WHERE "condominiumId" IS NULL
        `, [seedCondo.id]);
        if (result[1] > 0) console.log(`  ↳ backfilled ${result[1]} rows in ${table}`);
      } catch (tableErr: any) {
        console.warn(`  ⚠️  backfill skipped for "${table}": ${tableErr.message}`);
      }
    }

    console.log('✅ condominiumId backfill complete');
  } catch (e) {
    console.warn('⚠️  Seed migration skipped:', e.message);
  }

  await app.listen(3000, '0.0.0.0');
  console.log(`✅ Niddo backend running on http://0.0.0.0:3000`);
}
bootstrap();
