import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { Role } from '../auth/roles.enum';
import { House } from '../houses/houses.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.VECINO,
  })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => House, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'houseId' })
  house: House;

  @Column({ nullable: true })
  houseId: string;

  @ManyToMany(() => House, (house) => house.residents)
  houses: House[];

  @CreateDateColumn()
  createdAt: Date;
}
