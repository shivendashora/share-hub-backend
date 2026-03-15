import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto, MembersDto, SignInDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {

    constructor(private readonly authService: AuthService) {}
    @MessagePattern('signup')
    async signUp(@Payload() body: SignInDto) {
        console.log("Signup body received:", body);

        try {
            const response = await this.authService.signUpService(body);
            return response;
        }
        catch (e: any) {
            console.error(e);
        }
        return {
            message: "User not signed-in"
        }
    }

    @MessagePattern('login')
    async login(@Payload() body: LoginDto) {
        console.log("Login body received:", body);
        try {
            const response = await this.authService.loginService(body);
            console.log(response);
            return response;
        }
        catch (e: any) {
            console.error(e);
        }

        return {
            message: "Login failed"
        }
    }

    @MessagePattern('findMembersForId')
    async findMembersForid(@Payload() data:{membersIds:number[]}){
        try{
            const response = await this.authService.findMembers(data);
            return response;
        }
        catch(e:any){
            console.error(e);
        }

    }

}
