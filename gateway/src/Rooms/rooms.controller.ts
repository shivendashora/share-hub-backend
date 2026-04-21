import {
    Body, Controller, Delete, Get, Param,
    Post, Req, UploadedFile, UseGuards, UseInterceptors
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/auth-guard";
import { RoomService } from "./rooms.service";
import { JoinUserDto } from "./dto/room.dto";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller('rooms')
export class RoomController {

    constructor(private readonly roomService: RoomService) { }

    @UseGuards(JwtAuthGuard)
    @Get('createRoomForUser')
    async getRoomForUser(@Req() req) {
        try {
            const userId = req.user.userId;
            const response = await this.roomService.createRoomForUser(userId);
            return response;
        } catch (e: any) {
            console.error(e);
        }
        return { message: "Unable to Create Room" };
    }

    @Post('joinUserToRoom')
    @UseGuards(JwtAuthGuard)
    async joinUserForRoom(@Body() body: JoinUserDto) {
        try {
            const response = await this.roomService.joinUserForRoom(body.roomId, body.userId);
            return response;
        } catch (e: any) {
            console.error(e);
        }
        return { message: "Unable to Join User Please Try Again" };
    }

    @Get('getMembers/:roomId')
    @UseGuards(JwtAuthGuard)
    async getRoomMembers(@Param('roomId') roomId: string) {
        try {
            const response = await this.roomService.getRoomMembers(roomId);
            return response;
        } catch (e: any) {
            console.error(e);
        }
        return { message: "Unable to fetch room members" };
    }

    @Delete('leaveRoom/:roomId')
    @UseGuards(JwtAuthGuard)
    async leaveRoom(@Param('roomId') roomId: string, @Req() req) {
        try {
            const userId = req.userId;
            await this.roomService.leaveRoom(roomId, userId);
            return { message: "Successfully left the room" };
        } catch (e: any) {
            console.error(e);
        }
        return { message: "Unable to leave room" };
    }

    @Get('getAllRoomsCreatedByUser')
    @UseGuards(JwtAuthGuard)
    async getAllRoomsCreatedByUser(@Req() req) {
        try {
            const userId = req.user.userId;
            const response = await this.roomService.getAllRoomsCreatedByUser(userId);
            return response;
        } catch (error) {
            console.error(error);
        }
        return { message: "failed fetching rooms for user" };
    }

    @Post('/getRoomChats')
    @UseGuards(JwtAuthGuard)
    async getRoomChats(@Body() body: { roomId: string }) {
        try {
            const response = await this.roomService.getRoomChats(body.roomId);
            if (response) {
                return { message: "successfully fetched the room chats", response };
            }
            return { message: "could not fetch the chats please try again" };
        } catch (e: any) {
            console.error(e);
        }
    }

    @Post('/uploadRoomFile')
    @UseInterceptors(FileInterceptor('file'))
    async uploadRoomFile(@UploadedFile() file?: Express.Multer.File) {
        try {
            const response = await this.roomService.uploadFileData(file);
            return { message: "successfully saved the file", response };
        } catch (e) {
            console.error(e);
        }
    }

    // ── New: resolve a documentId → file URL + thumbnail base64
    @Get('/getDocument/:documentId')
    @UseGuards(JwtAuthGuard)
    async getDocumentById(@Param('documentId') documentId: string) {
        try {
            const id = parseInt(documentId, 10);
            const response = await this.roomService.getDocumentById(id);
            return { message: "document fetched", response };
        } catch (e: any) {
            console.error(e);
            return { message: "could not fetch document" };
        }
    }
}