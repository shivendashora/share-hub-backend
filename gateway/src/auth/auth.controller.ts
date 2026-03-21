import { Body, Controller, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "./auth-guard";

@Controller('auth')

export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Post('login')
    login(@Req() data: any) {
        const response = this.authService.login(data);
        return response;
    }
    @Post('signup')
    @UseInterceptors(FileInterceptor('avatar'))
    signup(
        @Body() body: any,
        @UploadedFile() avatar?: Express.Multer.File,  // the file
    ) {
        ;
        const response = this.authService.signUp(body);
        return response;
    }
    @Get('/logoutuser/:roomId')
    @UseGuards(JwtAuthGuard)
    async handleLogout(
        @Req() req,
        @Param('roomId') roomId: string

    ) {
        try {
            const userId = req.user.userId;
            const response = await this.authService.handleLogOut(userId, roomId)
            return response;
        }
        catch (e: any) {
            console.error(e);
        }
        return {
            message: "cannot logout user"
        }
    }

}