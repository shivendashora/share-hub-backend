import { Injectable } from '@nestjs/common';
import { LoginDto, SignInDto, UpdateUserProfileDto } from './dto/auth.dto';
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

    private async generateAuthToken(user: Users): Promise<string> {
        return await this.jwtService.signAsync({
            date: new Date(),
            userId: user.id,
            userName: user.userName,
        });
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
                        isGuestUser: true,
                    })
                );

                const token = await this.generateAuthToken(savedUser);

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
                    isGuestUser: false,
                })
            );

            const token = await this.generateAuthToken(savedUser);

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

            if (!userFound) {
                return {
                    message: "User not found"
                }
            }

            const hashedPassword = userFound?.hashedPassword;
            if (!hashedPassword) {
                return {
                    message: "Please complete your account setup before logging in"
                }
            }

            if (!await this.validatePassword(body.password, hashedPassword)) {
                return {
                    message: "Incorrect password please try again"
                }
            }

            const token = await this.generateAuthToken(userFound);
            return {
                message: "Login Successfull",
                token: token
            }
        }
    }

    private async findUserOrFail(userId: number) {
        const user = await this.userEntity.findOne({ where: { id: userId } });
        if (!user) return { error: "User not found" };
        return { user };
    }

    private validatePasswordMatch(password?: string, confirmPassWord?: string) {
        if (password && password !== confirmPassWord) {
            return "Password and confirm password do not match";
        }
        return null;
    }

    private async validateUniqueUsername(username: string, userId: number) {
        const existing = await this.userEntity.findOne({ where: { userName: username } });
        if (existing && existing.id !== userId) return "Username already exists";
        return null;
    }

    private async validateUniqueEmail(email: string, userId: number) {
        const existing = await this.userEntity.findOne({ where: { email } });
        if (existing && existing.id !== userId) return "Email already exists";
        return null;
    }

    private async buildUpdatedFields(
        data: UpdateUserProfileDto & { userId: number },
        userFound: Users
    ): Promise<{ error: string } | Partial<Users>> {
        const updatedFields: Partial<Users> = {};

        if (data.username && data.username !== userFound.userName) {
            const error = await this.validateUniqueUsername(data.username, data.userId);
            if (error) return { error };
            updatedFields.userName = data.username;
        }

        if (data.email && data.email !== userFound.email) {
            const error = await this.validateUniqueEmail(data.email, data.userId);
            if (error) return { error };
            updatedFields.email = data.email;
        }

        if (data.profile !== undefined) updatedFields.profile = data.profile;

        if (data.password) {
            updatedFields.hashedPassword = await this.createHashedPassword(data.password);
            updatedFields.isGuestUser = false;
        }

        return updatedFields;
    }

    async completeProfileService(data: UpdateUserProfileDto & { userId: number }) {
        try {
            const { user: userFound, error: userError } = await this.findUserOrFail(data.userId);
            if (userError) return { message: userError };

            const passwordError = this.validatePasswordMatch(data.password, data.confirmPassWord);
            if (passwordError) return { message: passwordError };

            if (!userFound) return
            const updatedFields = await this.buildUpdatedFields(data, userFound);
            if ("error" in updatedFields) return { message: updatedFields.error };

            if (!Object.keys(updatedFields).length) {
                return { message: "No profile fields provided to update", userId: userFound.id };
            }

            const updatedUser = await this.userEntity.save({ ...userFound, ...updatedFields });
            const token = await this.generateAuthToken(updatedUser);

            return {
                message: "User profile updated successfully",
                token,
                userId: updatedUser.id,
                user: {
                    id: updatedUser.id,
                    userName: updatedUser.userName,
                    email: updatedUser.email,
                    profile: updatedUser.profile,
                    isGuestUser: updatedUser.isGuestUser,
                },
            };
        } catch (e: any) {
            console.error(e);
            return { message: "Couldn't update user profile, please try again" };
        }
    }

    async findMembers(data: { membersIds: number[] }) {
        const memberIds = data.membersIds;

        if (!memberIds || memberIds.length === 0) {
            throw new Error('No members sent');
        }

        const users = await this.userEntity.find({
            where: { id: In(memberIds) },
            select: ['id', 'userName', 'email']
        });

        return {
            message: "Users Mapped Successfully",
            mappedUsers: users.map(u => ({
                id: u.id,
                userName: u.userName,
                email: u.email 
            }))
        };
    }

}
