import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";

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

export class UpdateUserProfileDto {
    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsString()
    confirmPassWord?: string;

    @IsOptional()
    @IsString()
    profile?: string;
}

export class MembersDto{
    @IsArray()
    membersIds:number[]
}
