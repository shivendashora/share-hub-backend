import { Body, Controller, Post, Req, UploadedFile, UseInterceptors } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller('auth')

export class AuthController{

    constructor(private readonly authService: AuthService) {}

    @Post('login')
    login(@Req() data:any){
        const response = this.authService.login(data);
        return response;
    }
    @Post('signup')
    @UseInterceptors(FileInterceptor('avatar'))
    signup(
        @Body() body: any,
        @UploadedFile() avatar?: Express.Multer.File,  // the file
    ){
        ;
        const response = this.authService.signUp(body);
        return response;
    }

}