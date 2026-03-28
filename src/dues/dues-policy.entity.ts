import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Condominium } from '../condominiums/condominium.entity';

@Entity('dues_policy')
export class DuesPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Day of month dues are due (1-31)
  @Column({ default: 1 })
  dueDay: number;

  // Months of pending payments before mobile access is suspended
  @Column({ default: 1 })
  mobileLockMonths: number;

  // Months of pending payments before card access is suspended
  @Column({ default: 3 })
  cardLockMonths: number;

  @CreateDateColumn()
  createdAt: Date;

  // ── Multi-tenancy ─────────────────────────────────────────────────────────
  @Column({ nullable: true })
  condominiumId: string | null;

  @ManyToOne(() => Condominium, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'condominiumId' })
  condominium: Condominium;

}
