import { Module } from '@nestjs/common';
import { RoomController } from './rooms.controller';
import { RoomService } from './rooms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rooms } from './entity/rooms.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
  ]), TypeOrmModule.forFeature([Rooms])],
  controllers: [RoomController],
  providers: [RoomService],
})
export class RoomModule { }
