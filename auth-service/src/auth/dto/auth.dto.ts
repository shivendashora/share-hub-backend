import { IsString } from "class-validator";

export class LoginDto {

    @IsString()
    userName: string;

    @IsString()
    password: string;
}

export class SignInDto {
    @IsString()
    userName: string;

    @IsString()
    email: string;

    @IsString()
    password: string;


    @IsString()
    confirmPassWord: string
}