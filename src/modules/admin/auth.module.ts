import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../../database/entities';
import { TwoFactorAuthenticationService } from './twoFactorAuthentication.service';
import { UsersService } from './user.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    PassportModule,
    JwtModule.register({
      secret: process.env.SECRET_KEY || 'abcxyz',
      // signOptions: { expiresIn: 24 * 60 * 60 },
    }),
  ],
  providers: [AuthService, JwtStrategy, TwoFactorAuthenticationService, UsersService],
  controllers: [AuthController],
})
export class AuthModule {}
