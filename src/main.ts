import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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

  await app.listen(3000, '0.0.0.0');
  console.log(`✅ Backend running on http://0.0.0.0:3000`);
}
bootstrap();
