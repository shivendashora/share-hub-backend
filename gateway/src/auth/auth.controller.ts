import { Controller, Post, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller('auth')

export class AuthController{

    constructor(private readonly authService: AuthService) {}

    @Post('login')
    login(@Req() data:any){
        const response = this.authService.login(data);
        return response;
    }
    @Post('signup')
    signup(@Req() data:any){
        const response = this.authService.signUp(data);
        return response;
    }

}