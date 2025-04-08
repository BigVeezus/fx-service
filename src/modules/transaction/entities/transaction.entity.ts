import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Wallet } from 'src/modules/wallet/entities/wallet.entity';

export enum TransactionType {
  FUNDING = 'funding',
  CONVERSION = 'conversion',
  TRADE = 'trade',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 18, scale: 8 })
  amount: number;

  @Column({ nullable: true })
  sourceCurrency: string;

  @Column({ nullable: true })
  targetCurrency: string;

  @Column('decimal', { precision: 18, scale: 8, nullable: true })
  exchangeRate: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User, (user) => user.transactions)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  wallet: Wallet;

  @Column()
  walletId: string;

  @CreateDateColumn()
  timestamp: Date;
}
