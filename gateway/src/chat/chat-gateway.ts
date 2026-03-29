import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { Socket } from "socket.io"

@WebSocketGateway(3002, { cors: { origin: "*" } })
export class Chatgateway implements OnGatewayConnection, OnGatewayDisconnect {

    handleConnection(client: Socket) {
        console.log("clientId", client.id);
    }

    handleDisconnect(client: Socket) {
        console.log("Disconnected:", client.id);
    }

    @SubscribeMessage("joinRoom")
    handleJoin(client: Socket, roomId: string) {
        client.join(roomId);
    }

    @SubscribeMessage("sendMessage")
    handleSubscribeMessage(client: Socket, data: { message: any, roomId: string,user:any }) {
        console.log(data);
        client.to(data.roomId).emit("sendMessage", data);
    }
}