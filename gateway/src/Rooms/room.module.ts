import { Module } from '@nestjs/common';
import { RoomController } from './rooms.controller';
import { RoomService } from './rooms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Documents, Rooms, Thumbnails } from './entity/rooms.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ChatEntity } from './entity/chat.entity';

@Module({
  imports: [ClientsModule.register([
    {
      name: 'AUTH_SERVICE',
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 4001,
      },
    },
  ]), TypeOrmModule.forFeature([Rooms,ChatEntity,Documents,Thumbnails])],
  controllers: [RoomController],
  providers: [RoomService],
})
export class RoomModule { }
