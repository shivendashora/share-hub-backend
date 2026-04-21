import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { InjectRepository } from "@nestjs/typeorm";
import { Server, Socket } from "socket.io";
import { ChatEntity } from "src/Rooms/entity/chat.entity";
import { Repository } from "typeorm";

interface SendMessagePayload {
  message: string;
  roomId: string;
  user: {
    id: number;
    name: string;
    avatar?: string;
  };
  // Present when the message is a file upload
  documentId?: number;
  fileName?: string;
  filePath?: string;
}

@WebSocketGateway(3002, { cors: { origin: "*" } })
export class Chatgateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  constructor(
    @InjectRepository(ChatEntity)
    private readonly chatEntity: Repository<ChatEntity>,
  ) { }

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
  async handleSubscribeMessage(client: Socket, data: SendMessagePayload) {
    const isFileMessage = Boolean(data.documentId);

    // Broadcast to everyone else in the room
    // Include documentId so receivers can fetch the thumbnail themselves
    client.to(data.roomId).emit("sendMessage", {
      message: data.message,
      user: data.user,
      ...(isFileMessage && {
        documentId: data.documentId,
        fileName: data.fileName,
        filePath: data.filePath,
      }),
    });

    try {
      await this.chatEntity.save({
        userId: data.user.id,
        roomId: data.roomId,
        chats: data.message || data.fileName || data.filePath,
        documentId: data.documentId ?? null,
        type: isFileMessage ? "file" : "text",
      });

      return { message: "saved successfully" };
    } catch (error) {
      console.error("Save error:", error);
      return { message: "failed to save" };
    }
  }
}