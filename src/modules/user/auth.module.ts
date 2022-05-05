import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities';
import { TwoFactorAuthenticationService } from './twoFactorAuthentication.service';
import { UsersService } from './user.service';
import { MailModule } from '../mail/mail.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    MailModule,
    JwtModule.register({
      secret: process.env.SECRET_KEY || 'abcxyz',
      // signOptions: { expiresIn: 24 * 60 * 60 },
    }),
  ],
  providers: [AuthService, JwtStrategy, TwoFactorAuthenticationService, UsersService],
  controllers: [AuthController],
})
export class AuthUserModule {}
