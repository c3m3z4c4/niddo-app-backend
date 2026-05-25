import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/users.entity';

@Entity('import_sessions')
export class ImportSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'importedById' })
  importedBy: User;

  @Column({ nullable: true })
  importedById: string;

  @Column({ default: 0 })
  totalCreated: number;

  @Column({ default: 0 })
  totalUpdated: number;

  @Column({ default: 0 })
  totalSkipped: number;

  @Column({ type: 'jsonb', nullable: true })
  errors: string[];

  @Column({ type: 'enum', enum: ['completed', 'rolled_back'], default: 'completed' })
  status: string;

  @Column({ nullable: true })
  rolledBackAt: Date;

  @Column({ nullable: true })
  condominiumId: string;

  @CreateDateColumn()
  createdAt: Date;
}
