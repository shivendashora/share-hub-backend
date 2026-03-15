import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class AuthService {

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

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
        password:body.password,
        isGuestUser: body.isGuestUser === "true",
        roomId: body.roomId ? Number(body.roomId) : null,  // ← pass it through
    }

    const response = await firstValueFrom(
        this.authClient.send('signup', signUpPayload)
    );

    return response;
}

}
