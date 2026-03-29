import { Module } from '@nestjs/common';
import { Chatgateway } from './chat-gateway';

@Module({
    providers:[Chatgateway]
})
export class ChatModule {}
