import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name:"rooms"})
@Entity({ name: "rooms" })
export class Rooms {

    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column()
    roomId: string;

    @Column({ type: 'int', nullable: true })
    userId: number | null;

    @Column({ type: 'boolean', default: false })
    isAdmin: boolean;
}