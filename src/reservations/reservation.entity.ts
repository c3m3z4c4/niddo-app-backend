import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/users.entity';

export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'closed';

@Entity('green_area_reservations')
export class GreenAreaReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  greenArea: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  date: string;

  @Column()
  startTime: string;

  @Column({ nullable: true })
  endTime: string;

  @Column({ default: 'pending' })
  status: ReservationStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string;

  @Column({ nullable: true })
  reviewedById: string;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User;

  // ── Closure (post-event) ────────────────────────────────────────────────
  @Column({ nullable: true })
  closedById?: string;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'closedById' })
  closedBy?: User;

  @Column({ type: 'timestamp', nullable: true })
  closedAt?: Date;

  @Column({ default: false })
  checklistBanos: boolean;

  @Column({ default: false })
  checklistInstalaciones: boolean;

  @Column({ type: 'text', nullable: true })
  closureNotes?: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  chargeAmount?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
