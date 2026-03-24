import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;

  @UpdateDateColumn()
  updatedAt: Date;
}
