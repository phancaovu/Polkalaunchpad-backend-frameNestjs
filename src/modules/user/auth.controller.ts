import { Controller, Post, Body, HttpStatus, UseGuards, Req, Res, Get, Headers, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Login } from './request/login.dto';
import { LoginResponse } from './response/login.dto';
import { EmptyObject } from '../../shared/response/emptyObject.dto';
import { LoginBase } from './response/loginBase.dto';
import { Causes } from '../../config/exception/causes';
import { EmptyObjectBase } from '../../shared/response/emptyObjectBase.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Register } from './request/register.dto';
import { RegisterResponse } from './response/register.dto';
import { RegisterBase } from './response/registerBase.dto';
import { TwoFactorAuthenticationService } from './twoFactorAuthentication.service';
import { Check2fa } from './request/check2fa.dto';
import { UpdatePassword } from './request/update-password.dto';
import { UsersService } from './user.service';
import RequestWithUser from './requestWithUser.interface';
import { JwtService } from '@nestjs/jwt';

@Controller('user')
export class AuthController {
    constructor(
        private jwtService: JwtService,
        private readonly twoFactorAuthenticationService: TwoFactorAuthenticationService,
        private readonly usersService: UsersService,
        private authService: AuthService,
    ) { }

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
    async register(@Body() data: Register): Promise<RegisterResponse | EmptyObject> {

        const duplicatedUser = await this.authService.checkDuplicatedUser(data);
        if (duplicatedUser) {
            throw Causes.DUPLICATED_EMAIL_OR_USERNAME;
        }
        const user = await this.authService.registerUser(data);
        return user;
    }

    @Get('/active')
    @ApiOperation({
        tags: ['auth'],
        operationId: 'active',
        summary: 'active',
        description: 'Active a new user',
    })
    @ApiQuery({
        name: 'code',
        required: true,
        type: String,
    })
    async active(@Query('code') code: string, @Res() res) {
        if (!code) throw Causes.DATA_INVALID;

        const activeUser = await this.authService.activeUser(code);console.log('activeUser: ', activeUser)

        if (!activeUser) throw Causes.DATA_INVALID;

        res.setHeader('Access-Control-Allow-Origin', process.env.URL_FRONTEND);
        return res.redirect(process.env.URL_FRONTEND + '/login');
    }

    @Post('/update-profile')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        tags: ['auth'],
        operationId: 'update profile',
        summary: 'update profile',
        description: 'update profile',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successful',
        type: RegisterBase,
    })
    async updateProfile(@Body() data: any): Promise<any | EmptyObject> {


    }

    @Post('/is-active-2fa')
    @ApiOperation({
        tags: ['auth'],
        operationId: 'is active 2fa',
        summary: 'is active 2fa',
        description: 'is active 2fa',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successful',
        type: LoginBase,
    })
    async isActive2fa(@Body() data: Login): Promise<LoginResponse | EmptyObject> {
        const user = await this.authService.validateUser(data);
        if (!user) {
            throw Causes.EMAIL_OR_PASSWORD_INVALID;
        }

        return user.isActive2fa;
    }

    @Post('/get-2fa')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        tags: ['auth'],
        operationId: 'get 2fa',
        summary: 'get 2fa',
        description: 'get 2fa',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successful',
        type: EmptyObjectBase,
    })
    async get2fa(@Req() request: RequestWithUser): Promise<EmptyObject> {
        const user = request.user;

        var secret = user.twoFactorAuthenticationSecret;
        if (!secret) {
            secret = await this.twoFactorAuthenticationService.generateTwoFactorAuthenticationSecret(user);
        }

        return {
            twoFactorAuthenticationSecret: user.isActive2fa ? null : this.jwtService.decode(secret)
        };
    }

    @Post('/active-2fa')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        tags: ['auth'],
        operationId: 'active 2fa',
        summary: 'active 2fa',
        description: 'active 2fa',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successful',
        type: LoginBase,
    })
    async active2fa(@Body() data: any, @Req() request: RequestWithUser): Promise<any | EmptyObject> {

        const user = request.user;

        if (!data.twofa) throw Causes.TWOFA_INVALID;

        const isCodeValid = await this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(
            data.twofa, user
        );

        if (!isCodeValid) throw Causes.TWOFA_INVALID;

        if (!user.isActive2fa) {
            await this.usersService.turnOnTwoFactorAuthentication(user.id);
        }
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

        if (user.isActive2fa) {

            if (!data.twofa) throw Causes.TWOFA_INVALID;

            const isCodeValid = await this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(
                data.twofa, user
            );

            if (!isCodeValid) throw Causes.TWOFA_INVALID;
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
