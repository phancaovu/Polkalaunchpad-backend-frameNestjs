import { Controller, Post, Body, HttpStatus, UseGuards, Req, Res, Get, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Login } from './request/login.dto';
import { LoginResponse } from './response/login.dto';
import { EmptyObject } from '../../shared/response/emptyObject.dto';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { LoginBase } from './response/loginBase.dto';
import { Causes } from '../../config/exception/causes';
import { EmptyObjectBase } from '../../shared/response/emptyObjectBase.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Register } from './request/register.dto';
import { RegisterResponse } from './response/register.dto';
import { RegisterBase } from './response/registerBase.dto';
import { TwoFactorAuthenticationService } from './twoFactorAuthentication.service';
import { Check2fa } from './request/check2fa.dto';
import { UsersService } from './user.service';
import { JwtService } from '@nestjs/jwt';

@Controller('admin')
export class AuthController {
    constructor(
        private jwtService: JwtService,
        private readonly twoFactorAuthenticationService: TwoFactorAuthenticationService,
        private readonly usersService: UsersService,
        private authService: AuthService,
    ) { }

    @Get('is-first-user')
    async isFirstUser(@Headers() headers): Promise<any> {
        const token = headers.authorization ? headers.authorization : '';
        return this.authService.isFirstUser(token);
    }

    @Post('/register')
    @ApiOperation({
        tags: ['auth'],
        operationId: 'register',
        summary: 'Register',
        description: 'Register a new user',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successful',
        type: RegisterBase,
    })
    async register(@Body() data: Register, @Headers() headers): Promise<RegisterResponse | EmptyObject> {
        const token = headers.authorization ? headers.authorization : '';
        const isFirstUser = await this.authService.isFirstUser(token);

        if (!isFirstUser) throw Causes.NOT_ACCESS_CREATE_USER;

        const duplicatedUser = await this.authService.checkDuplicatedUser(data);
        if (duplicatedUser) {
            throw Causes.DUPLICATED_EMAIL_OR_USERNAME;
        }
        const user = await this.authService.registerUser(data);
        return user;
    }

    @Post('/gen-2fa')
    @ApiOperation({
        tags: ['auth'],
        operationId: 'check2fa',
        summary: 'Check2fa',
        description: 'Check2fa',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successful',
        type: EmptyObjectBase,
    })
    async check2fa(@Body() data: Check2fa): Promise<EmptyObject> {
        const user = await this.authService.validateUser(data);
        if (!user) {
            throw Causes.EMAIL_OR_PASSWORD_INVALID;
        }

        var secret = user.twoFactorAuthenticationSecret;
        if (!secret) {
            secret = await this.twoFactorAuthenticationService.generateTwoFactorAuthenticationSecret(user);
        }

        return {
            isActive2fa: user.isActive2fa,
            twoFactorAuthenticationSecret: user.isActive2fa ? null : this.jwtService.decode(secret)
        };
    }

    @Post('/login')
    @ApiOperation({
        tags: ['auth'],
        operationId: 'login',
        summary: 'Login',
        description: 'Login',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successful',
        type: LoginBase,
    })
    async login(@Body() data: Login): Promise<LoginResponse | EmptyObject> {
        const user = await this.authService.validateUser(data);
        if (!user) {
            throw Causes.EMAIL_OR_PASSWORD_INVALID;
        }

        const isCodeValid = await this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(
            data.twofa, user
        );

        if (!isCodeValid) {
            throw Causes.TWOFA_INVALID;
        }

        if (!user.isActive2fa) {
            await this.usersService.turnOnTwoFactorAuthentication(user.id);
        }

        return this.authService.login(user);
    }

    @Post('/logout')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        tags: ['auth'],
        operationId: 'logout',
        summary: 'Logout',
        description: 'Logout',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successful',
        type: EmptyObjectBase,
    })
    async logout(@Req() request: any): Promise<EmptyObject> {
        const token = request.headers.authorization;
        this.authService.logout(token);
        return new EmptyObject();
    }
}
