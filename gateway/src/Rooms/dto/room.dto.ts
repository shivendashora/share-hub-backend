import { IsNumber, IsString } from "class-validator";

export class RoomUserDto {

  @IsNumber()
  userId: number;

}

export class JoinUserDto{

  @IsString()
  roomId:string;
}
