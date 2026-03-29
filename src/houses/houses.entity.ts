import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Condominium } from '../condominiums/condominium.entity';

export type HouseType = 'terreno' | 'en_construccion' | 'casa';

@Entity('houses')
export class House {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  houseNumber: string;

  @Column({ nullable: true })
  address: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: 'active' | 'inactive';

  @Column({
    type: 'enum',
    enum: ['terreno', 'en_construccion', 'casa'],
    default: 'casa',
  })
  type: HouseType;

  @ManyToMany(() => User, (user) => user.houses)
  @JoinTable({
    name: 'house_residents',
    joinColumn: { name: 'houseId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  residents: User[];

  @CreateDateColumn()
  createdAt: Date;

  // ── Multi-tenancy ─────────────────────────────────────────────────────────
  @Column({ nullable: true })
  condominiumId: string | null;

  @ManyToOne(() => Condominium, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'condominiumId' })
  condominium: Condominium;

}
