import { Injectable } from '@nestjs/common';
import { LoginDto, SignInDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    constructor(private readonly jwtService: JwtService) { }

    async signUpService(body: SignInDto) {
        if (body) {
            console.log("SignUp Body", body);
            return {
                message: "Recieved Sign Up Data",
            }
        }
    }
    async loginService(body: LoginDto) {
        if (body) {
            console.log("Login Body", body);

            const tokenPayload = {
                Date: new Date()
            }
            const token = await this.jwtService.signAsync(tokenPayload);
            return {
                message: "Login Successfull",
                token: token
            }
        }
    }
}
