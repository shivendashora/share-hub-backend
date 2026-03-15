import { IsNumber, IsString } from "class-validator";

export class JoinUserDto{

  @IsString()
  roomId:string;

  @IsNumber()
  userId:number;
}
