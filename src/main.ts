import './common/rls.patch';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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
          ALTER TYPE user_role_enum ADD VALUE '${v}';
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    }

    // Perform cast
    await client.query(`
      ALTER TABLE users
      ALTER COLUMN role TYPE user_role_enum
      USING (
        CASE role::text
          WHEN 'SUPER_ADMIN' THEN 'PLATFORM_ADMIN'::user_role_enum
          WHEN 'ADMIN' THEN 'CONDO_ADMIN'::user_role_enum
          WHEN 'VECINO' THEN 'RESIDENT'::user_role_enum
          ELSE role::user_role_enum
        END
      )
    `);
    console.log('✅ Legacy role values migrated');
  } catch (e: any) {
    console.warn('⚠️  Role migration skipped/failed:', e.message);
  } finally {
    await client.end();
  }
}

async function bootstrap() {
  await migrateRolesIfNeeded();

  // Ensure uploads/saas-proofs directory exists
  const uploadsDir = resolve(process.cwd(), 'uploads', 'saas-proofs');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded files as static assets
  const staticUploadsDir = resolve(process.cwd(), 'uploads');
  if (!existsSync(staticUploadsDir)) {
    mkdirSync(staticUploadsDir, { recursive: true });
  }
  app.useStaticAssets(staticUploadsDir, { prefix: '/uploads' });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
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
  const dataSource = app.get(DataSource);

  try {
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
    console.log('✅ house_residents migration done');
  } catch (e: any) {
    console.warn('⚠️  house_residents migration skipped:', e.message);
  }

  // ── Backfill condominiumId for all tables (independent of above) ──────────
  try {
    // Backfill users first
    await dataSource.query(`
      UPDATE users
      SET "condominiumId" = $1
      WHERE "condominiumId" IS NULL
        AND role NOT IN ('PLATFORM_ADMIN')
    `, [seedCondo.id]);

    // Backfill all other tables
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
        // PostgreSQL returns [rows, rowCount] for raw queries
        const count = Array.isArray(result) ? result[1] : result?.rowCount;
        console.log(`  ↳ backfilled ${count ?? '?'} rows in "${table}"`);
      } catch (tableErr: any) {
        console.warn(`  ⚠️  backfill skipped for "${table}": ${tableErr.message}`);
      }
    }
    console.log('✅ condominiumId backfill complete');
  } catch (e: any) {
    console.warn('⚠️  condominiumId backfill failed:', e.message);
  }

  // ── Enable Row-Level Security (RLS) and Create Policies ──────────────────
  try {
    const rlsTables = [
      'users',
      'houses',
      'green_area_events',
      'meetings',
      'rsvps',
      'dues_config',
      'dues_payments',
      'dues_promotions',
      'dues_policy',
      'extraordinary_income',
      'green_area_reservations',
      'projects',
      'direct_messages',
      'notifications',
      'saas_payments',
      'condominium_licenses'
    ];

    for (const table of rlsTables) {
      await dataSource.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      await dataSource.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "${table}";`);
      await dataSource.query(`
        CREATE POLICY tenant_isolation_policy ON "${table}"
        FOR ALL
        USING (
          current_setting('app.bypass_rls', true) = 'true'
          OR "condominiumId" = NULLIF(current_setting('app.current_condominium_id', true), '')::uuid
        );
      `);
      console.log(`  🛡️  RLS enabled & policy created for "${table}"`);
    }
    console.log('✅ PostgreSQL Row-Level Security (RLS) setup complete');
  } catch (e: any) {
    console.warn('⚠️  PostgreSQL Row-Level Security (RLS) setup failed:', e.message);
  }

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Niddo API')
      .setDescription('API de administración de condominios Niddo')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    console.log('📚 Swagger docs available at http://0.0.0.0:3000/api/docs');
  }

  await app.listen(3000, '0.0.0.0');
  console.log(`✅ Niddo backend running on http://0.0.0.0:3000`);
}
bootstrap();
