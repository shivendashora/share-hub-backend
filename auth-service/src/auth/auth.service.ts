import { Injectable } from '@nestjs/common';
import { LoginDto, SignInDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from 'src/entities/auth.entity';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';


@Injectable()
export class AuthService {

    constructor(private readonly jwtService: JwtService,
        @InjectRepository(Users)
        private readonly userEntity: Repository<Users>
    ) { }



    private async createHashedPassword(password: string): Promise<string> {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    }

    private async validatePassword(password: string, hashedPassword: string | undefined) {
        return await bcrypt.compare(password, hashedPassword);
    }


    async signUpService(body: SignInDto) {

    try {
        if (body.isGuestUser) {
            const savedUser = await this.userEntity.save(
                this.userEntity.create({
                    userName: body.username,
                    email: body.email,
                })
            );

            const token = await this.jwtService.signAsync({
                date: new Date(),
                userId: savedUser.id,
                userName: savedUser.userName,
            });

            return {
                message: "Guest user registered",
                token,
                userId: savedUser.id,
            };
        }
        if (!body.password) {
            return {
                message: "Password is required for regular signup",
            };
        }

        const savedUser = await this.userEntity.save(
            this.userEntity.create({
                userName: body.username,
                email: body.email,
                hashedPassword: await this.createHashedPassword(body.password),
            })
        );

        const token = await this.jwtService.signAsync({
            date: new Date(),
            userId: savedUser.id,
        });

        return {
            message: "Successfully signed up",
            token,
            userId: savedUser.id,
        };

    } catch (e: any) {
        console.error(e);
        return {
            message: "Couldn't sign up user, please try again",
        };
    }
}
    async loginService(body: LoginDto) {
        if (body) {
            const userFound = await this.userEntity.findOne({
                where: {
                    userName: body.username
                }
            }
            )

            const hashedPassword = userFound?.hashedPassword;
            if (!await this.validatePassword(body.password, hashedPassword)) {
                return {
                    message: "Incorrect password please try again"
                }
            }

            const tokenPayload = {
                Date: new Date(),
                userId: userFound?.id
            }
            const token = await this.jwtService.signAsync(tokenPayload);
            return {
                message: "Login Successfull",
                token: token
            }
        }
    }

async findMembers(data: { membersIds: number[] }) {

    const memberIds = data.membersIds;

    if (!memberIds || memberIds.length === 0) {
        throw new Error('No members sent');
    }

    const users = await this.userEntity.find({
        where: { id: In(memberIds) },
        select: ['id', 'userName']
    });

    return {
        message: "Users Mapped Successfully",
        mappedUsers: users.map(u => ({
            id: u.id,
            userName: u.userName
        }))
    };
}

}
