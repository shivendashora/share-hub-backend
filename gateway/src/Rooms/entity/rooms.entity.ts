import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Rooms {

    @PrimaryGeneratedColumn()
    id:number;

    @Column()
    roomId: string;

    @Column({ type: 'int', nullable: true })
    userId: number | null;

    @Column({ type: 'boolean', default: false })
    isAdmin: boolean;

}