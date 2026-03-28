import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { MeetingsModule } from './meetings/meetings.module';
import { HousesModule } from './houses/houses.module';
import { DuesModule } from './dues/dues.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProjectsModule } from './projects/projects.module';
import { RsvpsModule } from './rsvps/rsvps.module';
import { BackupModule } from './backup/backup.module';
import { ReservationsModule } from './reservations/reservations.module';
import { MessagesModule } from './messages/messages.module';
import { UserSettingsModule } from './user-settings/user-settings.module';
import { CondominiumsModule } from './condominiums/condominiums.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),

    AuthModule,
    UsersModule,
    EventsModule,
    MeetingsModule,
    HousesModule,
    DuesModule,
    NotificationsModule,
    ProjectsModule,
    RsvpsModule,
    BackupModule,
    ReservationsModule,
    MessagesModule,
    UserSettingsModule,
    CondominiumsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
})
export class AppModule {}
