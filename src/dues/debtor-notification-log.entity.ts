import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('debtor_notification_logs')
export class DebtorNotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  houseId: string;

  @Column('int')
  month: number;

  @Column('int')
  year: number;

  @Column()
  channel: string;

  @CreateDateColumn()
  sentAt: Date;

  @Column()
  success: boolean;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  condominiumId: string;
}
