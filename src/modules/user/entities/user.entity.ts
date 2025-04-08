import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Wallet } from 'src/modules/wallet/entities/wallet.entity';
import { Transaction } from 'src/modules/transaction/entities/transaction.entity';

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  SUPPORT = 'support',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column('simple-array', { default: Role.USER })
  roles: string[];

  @Column({ nullable: true })
  otpSecret: string;

  @Column({ nullable: true })
  otpExpiry: Date;

  @OneToMany(() => Wallet, (wallet) => wallet.user)
  wallets: Wallet[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
