import { Condominium } from '../condominiums/condominium.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('dues_promotions')
export class DuesPromotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  monthCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  discountPercentage: number;

  @Column({ type: 'date' })
  validFrom: string;

  @Column({ type: 'date' })
  validTo: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // ── Multi-tenancy ─────────────────────────────────────────────────────────
  @Column({ nullable: true })
  condominiumId: string | null;

  @ManyToOne(() => Condominium, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'condominiumId' })
  condominium: Condominium;

}
