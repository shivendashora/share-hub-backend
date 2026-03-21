import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { firstValueFrom } from "rxjs";
import { Rooms } from "src/Rooms/entity/rooms.entity";
import { Repository } from "typeorm";

@Injectable()
export class AuthService {

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @InjectRepository(Rooms)
    private readonly roomsEntity: Repository<Rooms>
  ) { }

  async login(data: any) {


    const response = await firstValueFrom(
      this.authClient.send('login', data.body)
    );

    return response;
  }

  async signUp(body: any) {


    const signUpPayload = {
      username: body.username,
      email: body.email,
      password: body.password,
      isGuestUser: body.isGuestUser === "true",
      roomId: body.roomId ? Number(body.roomId) : null,  // ← pass it through
    }

    const response = await firstValueFrom(
      this.authClient.send('signup', signUpPayload)
    );

    return response;
  }

  async handleLogOut(userId: number, roomId: string) {
    try {
      const user = await this.roomsEntity.findOne({
        where: {
          userId: userId,
          roomId: roomId
        }
      });

      if (!user) {
        return { message: "User not found in room" };
      }

      let response;

      // Step 2: If admin → logout everyone in room
      if (user.isAdmin) {
        response = await this.roomsEntity.update(
          { roomId: roomId },   // all users in room
          { userId: null }
        );
      }
      // Step 3: If normal user → logout only that user
      else {
        response = await this.roomsEntity.update(
          { userId: userId, roomId: roomId },
          { userId: null }
        );
      }

      return {
        message: "Logout successful",
        affected: response.affected
      };

    } catch (e: any) {
      console.error(e);
      return {
        message: "Error logging out user"
      };
    }
  }

}
