import { Module } from '@nestjs/common';
import { Chatgateway } from './chat-gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatEntity } from 'src/Rooms/entity/chat.entity';

@Module({
    imports: [TypeOrmModule.forFeature([
        ChatEntity
    ])],
    providers: [Chatgateway]
})
export class ChatModule { }
