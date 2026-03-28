import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { CondominiumBranding } from './condominium-branding.interface';
import { DEFAULT_BRANDING } from './condominium-branding.interface';

export type CondominiumStatus = 'active' | 'suspended' | 'trial' | 'cancelled';

@Entity('condominiums')
export class Condominium {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Identidad básica ─────────────────────────────────────────────────────
  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;  // "lomas-del-sol" → subdominio

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  phone: string;

  // ── Estado SaaS ──────────────────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'trial', 'cancelled'],
    default: 'trial',
  })
  status: CondominiumStatus;

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date | null;

  @Column({ type: 'int', nullable: true })
  maxHouses: number | null;

  @Column({ type: 'int', nullable: true })
  maxUsers: number | null;

  // ── Branding ─────────────────────────────────────────────────────────────
  @Column({ type: 'jsonb', default: () => `'${JSON.stringify(DEFAULT_BRANDING)}'` })
  branding: CondominiumBranding;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
