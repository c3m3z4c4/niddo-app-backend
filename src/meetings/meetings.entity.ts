import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  location: string;

  @Column()
  date: string; // YYYY-MM-DD

  @Column()
  startTime: string; // HH:MM

  @Column({ nullable: true })
  endTime: string; // HH:MM

  @Column({ type: 'text', nullable: true })
  minutes: string; // Desarrollo de la asamblea

  @Column({ type: 'text', nullable: true })
  minutesAgreements: string; // Acuerdos y resoluciones

  @Column({ type: 'text', nullable: true })
  minutesResponsibles: string; // Responsables y seguimiento

  @Column({ nullable: true })
  minutesClosingTime: string; // HH:MM — hora de clausura

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'cancelled' | 'postponed';

  @Column({ type: 'text', nullable: true })
  cancelReason: string;

  @Column({ nullable: true })
  originalDate: string; // YYYY-MM-DD — set on postpone

  @Column({ nullable: true })
  originalStartTime: string; // HH:MM — set on postpone

  @Column({ type: 'uuid', nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
