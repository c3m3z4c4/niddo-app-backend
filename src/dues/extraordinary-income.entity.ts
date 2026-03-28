import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { House } from '../houses/houses.entity';
import { Condominium } from '../condominiums/condominium.entity';

export type ExtraordinaryCategory = 'multa' | 'evento' | 'obra' | 'cuota_especial' | 'otro';

@Entity('extraordinary_income')
export class ExtraordinaryIncome {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  concept: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'varchar', default: 'otro' })
  category: ExtraordinaryCategory;

  @Column({ nullable: true })
  houseId: string; // null = ingreso general (no asociado a casa)

  @Column({ type: 'varchar', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  createdById: string;

  @ManyToOne(() => House, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'houseId' })
  house: House;

  @CreateDateColumn()
  createdAt: Date;

  // ── Multi-tenancy ─────────────────────────────────────────────────────────
  @Column({ nullable: true })
  condominiumId: string | null;

  @ManyToOne(() => Condominium, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'condominiumId' })
  condominium: Condominium;

}
