import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { InjectRepository } from "@nestjs/typeorm";
import { Server, Socket } from "socket.io";
import { ChatEntity } from "src/Rooms/entity/chat.entity";
import { Repository } from "typeorm";

@WebSocketGateway(3002, { cors: { origin: "*" } })
export class Chatgateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  constructor(
    @InjectRepository(ChatEntity)
    private readonly chatEntity: Repository<ChatEntity> 
  ) {}

  handleConnection(client: Socket) {
    console.log("Connected:", client.id);
  }

  handleDisconnect(client: Socket) {
    console.log("Disconnected:", client.id);
  }

  @SubscribeMessage("joinRoom")
  handleJoin(client: Socket, roomId: string) {
    client.join(roomId);
    console.log(`Client ${client.id} joined room ${roomId}`);
  }

  @SubscribeMessage("sendMessage")
  async handleSubscribeMessage(
    client: Socket,
    data: { message: string; roomId: string; user: { id: number; name: string; avatar?: string } }
  ) {
    client.to(data.roomId).emit("sendMessage", {
      message: data.message,
      user: data.user,
    });

    try {
      await this.chatEntity.save({
        userId: data.user.id,
        roomId: data.roomId,
        chats: data.message,
      });
      return { message: "saved successfully" };
    } catch (error) {
      console.error("Save error:", error);
      return { message: "failed to save" };
    }
  }
}