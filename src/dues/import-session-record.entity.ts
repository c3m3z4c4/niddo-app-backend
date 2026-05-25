import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('import_session_records')
export class ImportSessionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  paymentId: string;

  @Column({ type: 'enum', enum: ['created', 'updated'] })
  action: string;

  @Column({ nullable: true })
  prevStatus: string;

  @Column({ type: 'date', nullable: true })
  prevPaidAt: string;

  @Column({ nullable: true })
  prevNotes: string;
}
