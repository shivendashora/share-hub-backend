import { Body, Controller, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
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

    @Patch("complete-profile")
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor("profile"))
    async completeProfile(
        @Req() req,
        @Body() body,
        @UploadedFile() file
    ) {
        if (file) {
            body.profile = file;
        }

        return this.authService.completeProfile(req.user.userId, body);
    }

    @Post('/logoutuser')
    @UseGuards(JwtAuthGuard)
    async handleLogout(
        @Req() req,
        @Body() body: {
            roomId: string
        }

    ) {
        try {
            const userId = req.user.userId;
            const response = await this.authService.handleLogOut(userId, body.roomId)
            return response;
        }
        catch (e: any) {
            console.error(e);
        }
        return {
            message: "cannot logout user"
        }
    }


    @Get('userDetails')
    async getUserDetails(@Query('ids') ids: string) {
        const memberIds = ids.split(',').map(Number).filter(Boolean);
        return this.authService.getUserDetails({ memberIds });
    }
}
