import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  Unique,
} from 'typeorm';
import { User } from '../users/users.entity';

export type HouseType = 'terreno' | 'en_construccion' | 'casa';

@Entity('houses')
@Unique(['houseNumber', 'address'])
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
}
