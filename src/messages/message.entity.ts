import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/users.entity';

@Entity('direct_messages')
export class DirectMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  senderId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  recipientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ default: false })
  read: boolean;

  @Column({ default: false })
  isBroadcast: boolean;

  @Column({ nullable: true, type: 'varchar' })
  broadcastId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
