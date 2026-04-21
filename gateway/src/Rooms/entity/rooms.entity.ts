import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

@Entity({ name: "thumbnails" })
export class Thumbnails {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        name: "thubnail_path",
        type: "varchar",
        length: 50,
    })
    thubnailPath: string;

    @OneToMany(() => Documents, (document) => document.thumbnail)
    documents: Documents[];
}

@Entity({ name: "documents" })
export class Documents {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        name: "docs_path",
        type: "varchar",
        length: 50,
    })
    docsPath: string;

    @Column({
        name: "chats_id",
        type: "int",
        nullable: true,
    })
    chatsId: number;

    @Column({
        name: "thumbnail_id",
        type: "int",
        nullable: true,
    })
    thumbnailId: number;

    @ManyToOne(() => Thumbnails, (thumbnail) => thumbnail.documents, {
        eager: true,
        nullable: true,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "thumbnail_id" })
    thumbnail: Thumbnails;
}



