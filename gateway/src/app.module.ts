import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './Rooms/room.module';

@Module({
  imports: [AuthModule,RoomModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
