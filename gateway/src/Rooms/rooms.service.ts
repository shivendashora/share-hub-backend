import { IsNull, Not, Repository } from "typeorm";
import { Rooms } from "./entity/rooms.entity";
import { ChatEntity } from "./entity/chat.entity";
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from "node:crypto";
import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class RoomService {

    constructor(
        @InjectRepository(Rooms)
        private readonly roomsEntity: Repository<Rooms>,
        @InjectRepository(ChatEntity)
        private readonly chatEntity: Repository<ChatEntity>,
        @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    ) { }

    private generateRoomId(): string {
        return randomBytes(8).toString("hex");
    }

    async createRoomForUser(userId: number): Promise<{ roomId: string }> {

        if (!userId) {
            throw new BadRequestException("userId is required");
        }

        const roomId = this.generateRoomId();

        const room = this.roomsEntity.create({
            roomId,
            userId,
            isAdmin: true
        });

        await this.roomsEntity.save(room);

        return {
            roomId
        };
    }

    async joinUserForRoom(roomId: string, userId: number): Promise<Rooms> {
        if (!roomId || !userId) {
            throw new BadRequestException("roomId and userId are required");
        }

        const roomExists = await this.roomsEntity.findOne({
            where: { roomId }
        });

        if (!roomExists) {
            throw new NotFoundException(`Room with id ${roomId} not found`);
        }

        const alreadyJoined = await this.roomsEntity.findOne({
            where: { roomId, userId }
        });

        if (alreadyJoined) {
            throw new ConflictException("User has already joined this room");
        }

        const member = this.roomsEntity.create({
            roomId,
            userId,
            isAdmin: false
        });

        return await this.roomsEntity.save(member);
    }

    // rooms.service.ts
    async getRoomMembers(roomId: string) {
        if (!roomId) {
            throw new BadRequestException("roomId is required");
        }

        const roomMembers = await this.roomsEntity.find({
            where: {
                roomId: roomId,
                userId: Not(IsNull())
            }
        });

        if (!roomMembers.length) {
            throw new NotFoundException(`No members found for room`);
        }


        const members = await firstValueFrom(
            this.authClient.send('findMembersForId', {
                membersIds: roomMembers.map(m => m.userId)
            })
        );

        return members;
    }

    async leaveRoom(roomId: string, userId: number): Promise<void> {
        if (!roomId || !userId) {
            throw new BadRequestException("roomId and userId are required");
        }

        const member = await this.roomsEntity.findOne({
            where: { roomId, userId }
        });

        if (!member) {
            throw new NotFoundException("User is not a member of this room");
        }

        await this.roomsEntity.remove(member);
    }

    async getAllRoomsCreatedByUser(userId: number) {
        try {
            const getRooms = await this.roomsEntity.find({
                where: {
                    userId: userId,
                    isAdmin: true
                }
            });
            return getRooms;
        } catch (error: any) {
            console.error(error);
            return [];
        }
    }
    async getRoomChats(roomId: string) {
        try {
            const chats = await this.chatEntity.find({
                where: { roomId },
                order: { createdAt: "ASC" }
            });

            if (!chats.length) {
                return { data: [] };
            }

            const userIds = [...new Set(chats.map(chat => chat.userId))];
            console.log("userIds", userIds);

            const usersResponse = await firstValueFrom(
                this.authClient.send('findMembersForId', {
                    membersIds: userIds
                })
            );
            console.log("userresponse", usersResponse);

            const users = usersResponse.mappedUsers;
            console.log("users", users);

            const userMap: any = new Map(
                users.map(user => [user.id, user])
            );

            const finalChats = chats.map(chat => ({
                id: chat.id,
                text: chat.chats,
                userId: chat.userId,
                userName: userMap.get(chat.userId)?.userName || "Unknown",
                createdAt: chat.createdAt
            }));

            console.log(finalChats);

            return {
                data: finalChats
            };

        } catch (error) {
            console.error(error);
            return { data: [] };
        }
    }


}