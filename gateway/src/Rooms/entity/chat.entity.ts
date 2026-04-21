import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Documents } from "./rooms.entity";

@Entity({ name: "chats" })
export class ChatEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column({ nullable: true })
    roomId: string;

    @Column({ nullable: true })
    chats: string;

    @Column()
    type: string;

    @Column({
        name: "document_id",
        type: "int",
        nullable: true,
    })
    documentId: number;

    @ManyToOne(() => Documents, {
        eager: true,
        nullable: true,
        onDelete: "SET NULL"
    })
    @JoinColumn({ name: "document_id" })
    document: Documents;

    @Column({
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
    })
    createdAt: Date;

    @Column({
        type: "timestamp",
        nullable: true,
    })
    deletedAt: string;
}