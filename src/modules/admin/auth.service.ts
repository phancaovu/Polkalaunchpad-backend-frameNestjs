import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Check2fa } from './request/check2fa.dto';
import { Login } from './request/login.dto';
import { LoginResponse } from './response/login.dto';
import * as argon2 from 'argon2';
import { Admin } from '../../database/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Register } from './request/register.dto';
import { encrypt } from '../../shared/Utils';

var tokenMap = new Map();
var limitRequestLoginMap = new Map();

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,

        @InjectRepository(Admin)
        private usersRepository: Repository<Admin>,

    ) { }

    async getListAdmin(): Promise<any> {
        const data = await this.usersRepository.find();

        return data.map((e) => { return { username: e.username, email: e.email, createdAt: e.createdAt, updatedAt: e.updatedAt } });
    }

    //login
    async validateUser(data: any): Promise<any> {
        const user = await this.getUserByEmail(data.email);
        if (user && user.email && user.password) {
            const key = encrypt('Login-' + user.username);
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
        const payload = { username: user.username, userId: user.id };
        const token = this.jwtService.sign(payload);

        this.setValidToken(token);

        return {
            email: user.email,
            isActive2fa: user.isActive2fa,
            token,
        };
    }

    async getUserByEmail(email: string): Promise<Admin | undefined> {
        return this.usersRepository.findOne({ email: email });
    }

    //register
    async checkDuplicatedUser(data: Register): Promise<any> {
        //check duplicated username or email
        const duplicatedUser = await this.getUserByEmailAndUsername(data.email, data.username);
        return duplicatedUser;
    }

    async isFirstUser(token: string): Promise<any> {
        const checkUser = await this.usersRepository.find();

        if (!checkUser || checkUser.length == 0) return true;

        if (!token) return false;

        const p = this.isValidToken(token.split(' ')[1]);

        if (!p) return false;

        const user = this.jwtService.decode(token.split(' ')[1]);

        const listAdmin = await this.getListAdmin();

        if (!user || !listAdmin || listAdmin[0].username != user['username']) return false;;

        return true;
    }

    async getUserByEmailAndUsername(email: string, username: string): Promise<Admin | undefined> {
        return (
            (await this.usersRepository.findOne({ username: username })) ||
            (await this.usersRepository.findOne({ email: email }))
        );
    }

    async registerUser(data: Register): Promise<any> {
        //hash password
        const hashedPassword = await argon2.hash(data.password);

        //insert user table
        const user = await this._registerUser(data.email, data.username, hashedPassword);
        return {
            id: user.id,
            email: user.email,
            username: user.username,
        };
    }

    async _registerUser(email: string, username: string, password: string) {
        let user = new Admin();
        user.email = email;
        user.password = password;
        user.username = username;

        user = await this.usersRepository.save(user);
        return user;
    }

    logout(token: string) {
        const tokenWithoutBearer = token.split(' ')[1];

        this.deleteValidToken(tokenWithoutBearer);
    }
}
