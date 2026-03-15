import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('Users')
export class Users {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userName: string;

    @Column({nullable:true})
    hashedPassword: string;

    @Column({nullable:true})
    email: string;

    @Column({ nullable: true })
    profile: string

    @Column({nullable:true})
    isGuestUser:boolean;

}