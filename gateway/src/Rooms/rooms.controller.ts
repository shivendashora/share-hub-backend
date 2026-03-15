import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/auth-guard";
import { RoomService } from "./rooms.service";
import { JoinUserDto } from "./dto/room.dto";


@Controller('rooms')

export class RoomController {

    constructor(private readonly roomService: RoomService) { }

    @UseGuards(JwtAuthGuard)
    @Get('createRoomForUser')
    async getRoomForUser(@Req() req) {

        console.log("calling create room api");
        console.log("userId",req.user.userId);

        try {
            const userId = req.user.userId;
            const response = await this.roomService.createRoomForUser(userId);
            console.log("response",response);
            return response;
        }
        catch (e: any) {
            console.error(e);
        }

        return {
            message: "Unable to Create Room"
        }
    }

    @Post('joinUserToRoom')
    @UseGuards(JwtAuthGuard)
    async joinUserForRoom(@Body() body: JoinUserDto) {

        try {
            const response = await this.roomService.joinUserForRoom(body.roomId, body.userId);
            return response;
        }
        catch (e: any) {
            console.error(e);
        }

        return {
            message: "Unable to Join User Please Try Again"
        }

    }

    @Get('getMembers/:roomId')
    @UseGuards(JwtAuthGuard)
    async getRoomMembers(@Param('roomId') roomId: string) {
        try {
            const response = await this.roomService.getRoomMembers(roomId);
            return response;
        }
        catch (e: any) {
            console.log(e);
        }

        return {
            message: "Unable to fetch room members"
        }
    }

    @Delete('leaveRoom/:roomId')
    @UseGuards(JwtAuthGuard)
    async leaveRoom(@Param('roomId') roomId: string, @Req() req) {
        try {
            const userId = req.userId;
            await this.roomService.leaveRoom(roomId, userId);
            return { message: "Successfully left the room" };
        }
        catch (e: any) {
            console.log(e);
        }

        return {
            message: "Unable to leave room"
        }
    }


}
