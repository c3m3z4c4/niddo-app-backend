import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('platform_settings')
export class PlatformSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Rich text with bank/transfer/cash payment instructions */
  @Column({ type: 'text', nullable: true })
  paymentInstructions: string | null;

  /** e.g. ['TRANSFER', 'CASH'] */
  @Column({ type: 'jsonb', default: [] })
  acceptedMethods: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  annualPrice: number;

  /**
   * Roles (beyond PLATFORM_ADMIN) allowed to read these settings.
   * RESIDENT, PRESIDENTE, SECRETARIO, TESORERO are always blocked.
   */
  @Column({ type: 'jsonb', default: [] })
  visibleToRoles: string[];

  @Column({ type: 'enum', enum: ['none', 'stripe', 'conekta'], default: 'none' })
  activeGateway: 'none' | 'stripe' | 'conekta';

  @Column({ type: 'varchar', nullable: true })
  stripePublicKey: string | null;

  @Column({ type: 'varchar', nullable: true })
  stripeSecretKey: string | null;

  @Column({ type: 'varchar', nullable: true })
  stripeWebhookSecret: string | null;

  @Column({ type: 'varchar', nullable: true })
  conektaPublicKey: string | null;

  @Column({ type: 'varchar', nullable: true })
  conektaPrivateKey: string | null;

  @Column({ type: 'varchar', nullable: true })
  conektaWebhookSecret: string | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
