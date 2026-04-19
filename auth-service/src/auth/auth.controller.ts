import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto, SignInDto, UpdateUserProfileDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {

    constructor(private readonly authService: AuthService) { }
    @MessagePattern('signup')
    async signUp(@Payload() body: SignInDto) {

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
        try {
            const response = await this.authService.loginService(body);
            return response;
        }
        catch (e: any) {
            console.error(e);
        }

        return {
            message: "Login failed"
        }
    }

    @MessagePattern('completeProfile')
    async completeProfile(@Payload() data: UpdateUserProfileDto & { userId: number }) {
        try {
            const response = await this.authService.completeProfileService(data);
            return response;
        }
        catch (e: any) {
            console.error(e);
        }

        return {
            message: "Unable to update user profile"
        }
    }

    @MessagePattern('findMembersForId')
    async findMembersForid(@Payload() data: { membersIds: number[] }) {
        try {
            const response = await this.authService.findMembers(data);
            return response;
        }
        catch (e: any) {
            console.error(e);
        }

    }

}
