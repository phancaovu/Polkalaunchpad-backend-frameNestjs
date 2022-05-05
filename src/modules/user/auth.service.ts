import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Check2fa } from './request/check2fa.dto';
import { Login } from './request/login.dto';
import { LoginResponse } from './response/login.dto';
import * as argon2 from 'argon2';
import { User } from '../../database/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Register } from './request/register.dto';
import { encrypt, convertToString } from '../../shared/Utils';
import { MailService } from '../mail/mail.service';

var tokenMap = new Map();
var limitRequestLoginMap = new Map();

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,

        private readonly mailService: MailService,

        @InjectRepository(User)
        private usersRepository: Repository<User>,

    ) { }

    //login
    async validateUser(data: any): Promise<any> {
        const user = await this.getUserByEmail(data.email);
        if (user && user.email && user.password && user.status && user.status == 'active') {
            const key = encrypt('Login-' + user.email);
            let dataCheck = limitRequestLoginMap.get(key) ? limitRequestLoginMap.get(key) : {};

            if (dataCheck.total && dataCheck.total >= (parseInt(process.env.LIMIT_REQUEST) || 5)) {
                if (dataCheck.timeRequest && Date.now() - dataCheck.timeRequest < (parseInt(process.env.LIMIT_HOURS_BLOCK_REQUEST) || 4) * 60 * 60 * 1000) return null;

                dataCheck.total = 0;
                dataCheck.timeRequest = Date.now();
                limitRequestLoginMap.set(key, dataCheck);
            }

            //verify hashed password and plain-password
            const isPassword = await argon2.verify(user.password, data.password);

            if (isPassword) {
                if (dataCheck.total) {
                    limitRequestLoginMap.delete(key);
                }

                const { password, ...result } = user;
                return result;

            } else {
                if (dataCheck.total) {
                    dataCheck.total += 1;
                } else {
                    dataCheck.total = 1;
                }
                dataCheck.timeRequest = Date.now();
                limitRequestLoginMap.set(key, dataCheck);
            }
        }
        return null;
    }

    isValidToken(token: string) {
        return tokenMap.get(encrypt(token)) == '1';
    }

    setValidToken(token: string) {
        tokenMap.set(encrypt(token), '1');
    }

    deleteValidToken(token: string) {
        tokenMap.delete(encrypt(token));
    }

    async login(user: any): Promise<LoginResponse> {
        const payload = { email: user.email, userId: user.id };
        const token = this.jwtService.sign(payload);

        this.setValidToken(token);

        return {
            email: user.email,
            token,
        };
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        return this.usersRepository.findOne({ email: email });
    }

    //register
    async checkDuplicatedUser(data: Register): Promise<any> {
        //check duplicated username or email
        const duplicatedUser = await this.getUserByEmail(data.email);
        return duplicatedUser;
    }

    async activeUser(token: string) {
        if (!token) return false;

        const data = this.jwtService.decode(token);

        if (!data) return false;

        let user = await this.getUserByEmail(convertToString(data));

        if (!user || user.status !== 'request') return false;

        user.status = 'active';

        user = await this.usersRepository.save(user);

        return user;
    }

    async registerUser(data: Register): Promise<any> {
        //hash password
        const hashedPassword = await argon2.hash(data.password);

        //insert user table
        const user = await this._registerUser(data.email, hashedPassword);

        // send mail active
        const urlActive = process.env.URL_API + '/user/active' + '?code=' + user.token;
        const content = "To activate your account, please click on the link below: " + urlActive;

        await this.mailService.sendMailActiveUser(user.email, user.fullName, content);

        return {
            email: user.email
        };
    }

    async _registerUser(email: string, password: string) {
        const token = this.jwtService.sign(email);

        let user = new User();
        user.email = email;
        user.password = password;
        user.token = token;

        user = await this.usersRepository.save(user);
        return user;
    }

    logout(token: string) {
        const tokenWithoutBearer = token.split(' ')[1];

        this.deleteValidToken(tokenWithoutBearer);
    }
}
