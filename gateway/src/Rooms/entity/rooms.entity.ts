import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Rooms {

    @PrimaryGeneratedColumn()
    id:number;

    @Column()
    roomId: string;

    @Column()
    userId: number;

    @Column({ nullable: true })
    isAdmin: boolean;

}