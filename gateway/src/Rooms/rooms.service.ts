import { Repository } from "typeorm";
import { Rooms } from "./entity/rooms.entity";
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
        @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    ) { }

    private generateRoomId(): string {
        return randomBytes(8).toString("hex");
    }

    async createRoomForUser(userId: number): Promise<{ roomId: string }> {

        if (!userId) {
            throw new BadRequestException("userId is required");
        }

        // Check if user already has a room (admin room)
        const existingRoom = await this.roomsEntity.findOne({
            where: {
                userId,
                isAdmin: true
            }
        });

        if (existingRoom) {
            return {
                roomId: existingRoom.roomId
            };
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
            where: { roomId }
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
}