import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Condominium } from '../condominiums/condominium.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar' })
  type: 'new_event' | 'new_meeting' | 'cancelled_event' | 'cancelled_meeting' | 'postponed_event' | 'postponed_meeting';

  @Column()
  title: string;

  @Column()
  message: string;

  @Column()
  targetId: string;

  @Column({ type: 'enum', enum: ['event', 'meeting'] })
  targetType: 'event' | 'meeting';

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // ── Multi-tenancy ─────────────────────────────────────────────────────────
  @Column({ nullable: true })
  condominiumId: string | null;

  @ManyToOne(() => Condominium, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'condominiumId' })
  condominium: Condominium;

}
