import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectMessage } from './message.entity';
import { User } from '../users/users.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DirectMessage, User])],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
