import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('green_area_events')
export class GreenAreaEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  greenArea: string;

  @Column()
  date: string; // YYYY-MM-DD

  @Column()
  startTime: string; // HH:MM

  @Column({ nullable: true })
  endTime: string; // HH:MM

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'cancelled' | 'postponed';

  @Column({ type: 'text', nullable: true })
  cancelReason: string;

  @Column({ nullable: true })
  originalDate: string;

  @Column({ nullable: true })
  originalStartTime: string;

  @Column({ type: 'uuid', nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
