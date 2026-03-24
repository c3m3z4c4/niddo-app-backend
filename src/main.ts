import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Seed initial SUPER_ADMIN on startup
  const usersService = app.get(UsersService);
  await usersService.createSuperAdmin(
    'Super',
    'Administrador',
    process.env.SUPER_ADMIN_EMAIL ?? 'superadmin@privadasdelparque.com',
    process.env.SUPER_ADMIN_PASSWORD ?? 'SuperAdmin2025!',
  );
  await usersService.createSuperAdmin(
    'Deorsoft',
    'Admin',
    'deorsoft@gmail.com',
    'Temporal2025!',
  );

  await usersService.createSeedVecino(
    'Juan',
    'Vecino',
    'vecino@privadasdelparque.com',
    'Vecino2025!',
  );

  // One-time migration: populate house_residents join table from users.houseId
  try {
    const dataSource = app.get(DataSource);
    await dataSource.query(`
      INSERT INTO house_residents ("houseId", "userId")
      SELECT "houseId", id FROM users
      WHERE "houseId" IS NOT NULL
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ house_residents migrated from users.houseId');
  } catch (e) {
    console.warn('⚠️  house_residents migration skipped:', e.message);
  }

  await app.listen(3000, '0.0.0.0');
  console.log(`✅ Backend running on http://0.0.0.0:3000`);
}
bootstrap();
