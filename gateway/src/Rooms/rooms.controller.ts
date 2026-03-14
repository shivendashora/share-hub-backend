import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/auth-guard";
import { RoomService } from "./rooms.service";
import { JoinUserDto, RoomUserDto } from "./dto/room.dto";

@Controller('rooms')

export class RoomController {

    constructor(private readonly roomService: RoomService) { }

    @UseGuards(JwtAuthGuard)
    @Get('getRoomForUser')
    getRoomForUser(@Body() body: RoomUserDto) {

        try {

            console.log("Body", body);
            const response = this.roomService.getRoomForUser();
            return response;
        }
        catch (e: any) {
            console.log(e);
        }

        return {
            message: "Unable to Create Room"
        }
    }

    @Post('joinUserToRoom')
    @UseGuards(JwtAuthGuard)
    joinUserForRoom(@Body() body: JoinUserDto) {

        try {
            const response = this.roomService.joinUserForRoom(body.roomId);
            return response;
        }
        catch (e: any) {
            console.log(e);
        }

        return {
            message: "Unable to Join User Please Try Again"
        }

    }


}
