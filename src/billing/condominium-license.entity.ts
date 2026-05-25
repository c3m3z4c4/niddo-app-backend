import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Condominium } from '../condominiums/condominium.entity';

export type LicenseStatus = 'TRIAL' | 'ACTIVE' | 'OVERDUE' | 'SUSPENDED';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';

@Entity('condominium_licenses')
export class CondominiumLicense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  condominiumId: string;

  @OneToOne(() => Condominium, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'condominiumId' })
  condominium: Condominium;

  @Column({
    type: 'enum',
    enum: ['TRIAL', 'ACTIVE', 'OVERDUE', 'SUSPENDED'],
    default: 'TRIAL',
  })
  status: LicenseStatus;

  @Column({
    type: 'enum',
    enum: ['MONTHLY', 'ANNUAL'],
    default: 'MONTHLY',
  })
  billingCycle: BillingCycle;

  @Column({ default: 'standard' })
  planTier: string;

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEndsAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
