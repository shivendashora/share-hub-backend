import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class AuthService {

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  async login(data: any) {
    console.log("Data received here", data.body);

    const response = await firstValueFrom(
      this.authClient.send('login', data.body)
    );

    return response;
  }

    async signUp(data: any) {
    console.log("Data received here", data.body);

    const response = await firstValueFrom(
      this.authClient.send('signup', data.body)
    );

    return response;
  }

}
