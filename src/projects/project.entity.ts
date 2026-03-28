import { Condominium } from '../condominiums/condominium.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export type ProjectStatus =
  | 'planned'
  | 'started'
  | 'in_review'
  | 'completed'
  | 'paused';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  completionPercentage: number;

  @Column({
    type: 'enum',
    enum: ['planned', 'started', 'in_review', 'completed', 'paused'],
    default: 'planned',
  })
  status: ProjectStatus;

  @Column({ default: false })
  visibleToVecinos: boolean;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ── Multi-tenancy ─────────────────────────────────────────────────────────
  @Column({ nullable: true })
  condominiumId: string | null;

  @ManyToOne(() => Condominium, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'condominiumId' })
  condominium: Condominium;

}
