import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Condominium } from '../condominiums/condominium.entity';
import { User } from '../users/users.entity';

export type SaasPaymentStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

@Entity('saas_payments')
export class SaasPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  condominiumId: string;

  @ManyToOne(() => Condominium, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'condominiumId' })
  condominium: Condominium;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ['MONTHLY', 'ANNUAL'], default: 'MONTHLY' })
  billingCycle: string;

  @Column({
    type: 'enum',
    enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
    default: 'PENDING_APPROVAL',
  })
  status: SaasPaymentStatus;

  /** URL of the uploaded proof of payment file */
  @Column({ type: 'varchar', nullable: true })
  proofOfPaymentUrl: string | null;

  @Column({ type: 'date', nullable: true })
  periodCoveredFrom: string | null;

  @Column({ type: 'date', nullable: true })
  periodCoveredTo: string | null;

  @Column({ type: 'varchar', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', nullable: true })
  approvedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  /** User who submitted this payment */
  @Column({ type: 'varchar', nullable: true })
  submittedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'submittedById' })
  submittedBy: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
