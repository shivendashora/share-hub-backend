import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './Rooms/room.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rooms } from './Rooms/entity/rooms.entity';

@Module({
  imports: [ TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123',
      database: 'sharehubdb',
      entities: [Rooms],
      synchronize: true,
    }),AuthModule,RoomModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
