import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Condominium } from '../condominiums/condominium.entity';

@Entity('rsvps')
@Unique(['userId', 'targetType', 'targetId'])
export class Rsvp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'varchar' })
  targetType: 'meeting' | 'event';

  @Column()
  targetId: string;

  @Column({ type: 'varchar' })
  status: 'attending' | 'not_attending' | 'maybe';

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
