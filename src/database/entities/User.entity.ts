import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate, Index } from 'typeorm';
import { nowInMillis } from '../../shared/Utils';

@Entity('user')
@Index('email', ['email'], { unique: false })
@Index('status', ['status'], { unique: false })
export class User {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ name: 'username', type: 'varchar', length: 80, nullable: true, unique: true })
  username: string;

  @Column({ name: 'email', type: 'varchar', length: 191, nullable: false, unique: true })
  email: string;

  @Column({ name: 'password', type: 'varchar', length: 255, nullable: false })
  password: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 255, nullable: true })
  avatarUrl: string;

  @Column({ name: 'full_name', type: 'varchar', length: 100, nullable: true })
  fullName: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ name: 'created_at', type: 'bigint', nullable: true })
  createdAt: number;

  @Column({ name: 'updated_at', type: 'bigint', nullable: true })
  updatedAt: number;

  @Column({ name: 'is_active_2fa', type: 'tinyint', width: 1, nullable: false, default: 0 })
  public isActive2fa: boolean;

  @Column({ name: 'two_factor_authentication_secret', type: 'varchar', length: 100, nullable: true })
  twoFactorAuthenticationSecret: string;

  @Column({ name: 'is_active_kyc', type: 'tinyint', width: 1, nullable: false, default: 0 })
  public isActiveKyc: boolean;

  @Column({ name: 'wallet', type: 'varchar', length: 255, nullable: true })
  wallet: string;

  @Column({ name: 'status', type: 'varchar', length: 25, nullable: true, default: 'request' })
  status: string;

  @Column({ name: 'token', type: 'varchar', length: 255, nullable: true })
  token: string;

  @Column({ name: 'data', type: 'text', nullable: true })
  data: string;

  @BeforeInsert()
  public updateCreateDates() {
    this.createdAt = nowInMillis();
    this.updatedAt = nowInMillis();
  }

  @BeforeUpdate()
  public updateUpdateDates() {
    this.updatedAt = nowInMillis();
  }
}
