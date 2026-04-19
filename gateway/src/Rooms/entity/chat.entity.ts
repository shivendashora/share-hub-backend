import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "chats" })
export class ChatEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column({ nullable: true })
    roomId: string;

    @Column({ nullable: true })
    chats: string

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

    @Column({ type: "timestamp", nullable: true })
    deletedAt: string;

}