import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from 'class-validator';

export class Check2fa {
    @ApiProperty({
        type: String,
        example: 'example@gmail.com'
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        type: String,
        example: 'password'
    })
    @IsNotEmpty()
    password: string;
}