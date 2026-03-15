import { IsArray,  IsBoolean,  IsString } from "class-validator";

export class LoginDto {

    @IsString()
    username: string;

    @IsString()
    password: string;
}

export class SignInDto {
    @IsString()
    username: string;

    @IsString()
    email: string;

    @IsString()
    password: string;


    @IsString()
    confirmPassWord: string

    @IsBoolean()
    isGuestUser:boolean;
}

export class MembersDto{
    @IsArray()
    membersIds:number[]
}