import {
    Injectable,
    Inject,
    BadRequestException,
    NotFoundException,
    ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClientProxy } from "@nestjs/microservices";
import { Repository, IsNull, Not } from "typeorm";
import { firstValueFrom } from "rxjs";

import { Documents, Rooms, Thumbnails } from "./entity/rooms.entity";
import { ChatEntity } from "./entity/chat.entity";

import path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

import { randomBytes, randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import * as ffmpeg from "fluent-ffmpeg";
import { fromPath } from "pdf2pic";

type ThumbnailResponse = {
    base64: string;
    path: string;
};

@Injectable()
export class RoomService {
    constructor(
        @InjectRepository(Rooms)
        private readonly roomsEntity: Repository<Rooms>,

        @InjectRepository(ChatEntity)
        private readonly chatEntity: Repository<ChatEntity>,

        @InjectRepository(Documents)
        private readonly documentsRepo: Repository<Documents>,

        @InjectRepository(Thumbnails)
        private readonly thumbnailsRepo: Repository<Thumbnails>,

        @Inject("AUTH_SERVICE")
        private readonly authClient: ClientProxy,
    ) { }

    // ==========================================
    // ROOM METHODS
    // ==========================================
    private generateRoomId(): string {
        return randomBytes(8).toString("hex");
    }

    async createRoomForUser(userId: number): Promise<{ roomId: string }> {
        if (!userId) throw new BadRequestException("userId is required");

        const roomId = this.generateRoomId();
        const room = this.roomsEntity.create({ roomId, userId, isAdmin: true });
        await this.roomsEntity.save(room);
        return { roomId };
    }

    async joinUserForRoom(roomId: string, userId: number): Promise<Rooms> {
        if (!roomId || !userId)
            throw new BadRequestException("roomId and userId are required");

        const roomExists = await this.roomsEntity.findOne({ where: { roomId } });
        if (!roomExists) throw new NotFoundException(`Room ${roomId} not found`);

        const alreadyJoined = await this.roomsEntity.findOne({ where: { roomId, userId } });
        if (alreadyJoined) throw new ConflictException("User already joined");

        const member = this.roomsEntity.create({ roomId, userId, isAdmin: false });
        return await this.roomsEntity.save(member);
    }

    async getRoomMembers(roomId: string) {
        if (!roomId) throw new BadRequestException("roomId required");

        const roomMembers = await this.roomsEntity.find({
            where: { roomId, userId: Not(IsNull()) },
        });

        if (!roomMembers.length) throw new NotFoundException("No members found");

        return await firstValueFrom(
            this.authClient.send("findMembersForId", {
                membersIds: roomMembers.map((m) => m.userId),
            }),
        );
    }

    async leaveRoom(roomId: string, userId: number): Promise<void> {
        const member = await this.roomsEntity.findOne({ where: { roomId, userId } });
        if (!member) throw new NotFoundException("User not in room");
        await this.roomsEntity.remove(member);
    }

    async getAllRoomsCreatedByUser(userId: number) {
        return await this.roomsEntity.find({ where: { userId, isAdmin: true } });
    }

    // ==========================================
    // GET ROOM CHATS  (now includes documentId)
    // ==========================================
    async getRoomChats(roomId: string) {
        try {
            const chats = await this.chatEntity.find({
                where: { roomId },
                order: { createdAt: "ASC" },
            });

            if (!chats.length) return { data: [] };

            const userIds = [...new Set(chats.map((c) => c.userId))];

            type MemberUser = { id: number; userName: string; email: string };
            type MembersResponse = { message: string; mappedUsers: MemberUser[] };

            const usersResponse = await firstValueFrom(
                this.authClient.send<MembersResponse>("findMembersForId", {
                    membersIds: userIds,
                }),
            );

            const userMap = new Map<number, MemberUser>(
                usersResponse.mappedUsers.map((u) => [u.id, u]),
            );

            // Collect all documentIds that need thumbnail resolution
            const documentIds = [
                ...new Set(chats.map((c) => c.documentId).filter(Boolean)),
            ] as number[];

            // Bulk-fetch documents + their thumbnails in one query
            const documentMap = new Map<
                number,
                { filePath: string; thumbnailBase64: string | null; fileName: string }
            >();

            if (documentIds.length) {
                const docs = await this.documentsRepo.findByIds(documentIds);

                for (const doc of docs) {
                    let thumbnailBase64: string | null = null;

                    if (doc.thumbnailId) {
                        const thumb = await this.thumbnailsRepo.findOne({
                            where: { id: doc.thumbnailId },
                        });

                        if (thumb?.thubnailPath) {
                            const absPath = path.join(process.cwd(), thumb.thubnailPath);
                            if (fs.existsSync(absPath)) {
                                const buffer = fs.readFileSync(absPath);
                                thumbnailBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
                            }
                        }
                    }

                    // Derive a clean display name from the stored path
                    const rawName = path.basename(doc.docsPath);
                    // Strip the timestamp-uuid prefix: "<ts>-<uuid>-<realname.ext>"
                    const fileName = rawName.replace(/^\d+-[a-f0-9-]+-/, "");

                    documentMap.set(doc.id, {
                        filePath: doc.docsPath,
                        thumbnailBase64,
                        fileName,
                    });
                }
            }

            const finalChats = chats.map((chat) => {
                const base: Record<string, unknown> = {
                    id: chat.id,
                    text: chat.chats,
                    userId: chat.userId,
                    userName: userMap.get(chat.userId)?.userName || "Unknown",
                    createdAt: chat.createdAt,
                    type: chat.type,
                    documentId: chat.documentId ?? null,
                };

                if (chat.documentId && documentMap.has(chat.documentId)) {
                    const doc = documentMap.get(chat.documentId)!;
                    base.fileName = doc.fileName;
                    base.fileUrl = `http://localhost:3001${doc.filePath}`;
                    base.thumbnailBase64 = doc.thumbnailBase64;
                }

                return base;
            });

            return { data: finalChats };
        } catch (error) {
            console.log(error);
            return { data: [] };
        }
    }

    // ==========================================
    // GET SINGLE DOCUMENT BY ID
    // Used by the frontend after receiving a socket
    // file message — returns filePath + thumbnail base64
    // ==========================================
    async getDocumentById(documentId: number) {
        if (!documentId) throw new BadRequestException("documentId required");

        const doc = await this.documentsRepo.findOne({ where: { id: documentId } });
        if (!doc) throw new NotFoundException(`Document ${documentId} not found`);

        let thumbnailBase64: string | null = null;

        if (doc.thumbnailId) {
            const thumb = await this.thumbnailsRepo.findOne({
                where: { id: doc.thumbnailId },
            });

            if (thumb?.thubnailPath) {
                const absPath = path.join(process.cwd(), thumb.thubnailPath);
                if (fs.existsSync(absPath)) {
                    const buffer = fs.readFileSync(absPath);
                    thumbnailBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
                }
            }
        }

        const rawName = path.basename(doc.docsPath);
        const fileName = rawName.replace(/^\d+-[a-f0-9-]+-/, "");

        return {
            documentId: doc.id,
            fileName,
            fileUrl: `http://localhost:3001${doc.docsPath}`,
            thumbnailBase64,
        };
    }

    // ==========================================
    // FILE HELPERS
    // ==========================================
    private ensureDir(dirPath: string) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    private getThumbnailFolders() {
        const root = path.join(process.cwd(), "uploads", "thumbnails");
        const imageDir = path.join(root, "images");
        const videoDir = path.join(root, "videos");
        const pdfDir = path.join(root, "pdfs");
        this.ensureDir(imageDir);
        this.ensureDir(videoDir);
        this.ensureDir(pdfDir);
        return { imageDir, videoDir, pdfDir };
    }

    // ==========================================
    // THUMBNAIL EXTRACTION
    // ==========================================
    async extractThumbnail(file: Express.Multer.File): Promise<ThumbnailResponse | null> {
        try {
            const type = await fileTypeFromBuffer(file.buffer);
            if (!type) return null;
            if (type.mime.startsWith("image/")) return await this.extractImageThumbnail(file);
            if (type.mime.startsWith("video/")) return await this.extractVideoThumbnail(file);
            if (type.mime === "application/pdf") return await this.extractPdfThumbnail(file);
            return null;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    async extractImageThumbnail(file: Express.Multer.File): Promise<ThumbnailResponse> {
        const { imageDir } = this.getThumbnailFolders();
        const fileName = `thumb-${Date.now()}-${randomUUID()}.jpg`;
        const savePath = path.join(imageDir, fileName);
        const thumb = await sharp(file.buffer)
            .resize(250, 250, { fit: "cover" })
            .jpeg({ quality: 80 })
            .toBuffer();
        fs.writeFileSync(savePath, thumb);
        return {
            base64: `data:image/jpeg;base64,${thumb.toString("base64")}`,
            path: `/uploads/thumbnails/images/${fileName}`,
        };
    }

    async extractVideoThumbnail(file: Express.Multer.File): Promise<ThumbnailResponse> {
        const { videoDir } = this.getThumbnailFolders();
        const tempDir = os.tmpdir();
        const tempInput = path.join(tempDir, `${Date.now()}-${randomUUID()}.mp4`);
        const fileName = `thumb-${Date.now()}-${randomUUID()}.jpg`;
        const outputPath = path.join(videoDir, fileName);
        fs.writeFileSync(tempInput, file.buffer);

        return new Promise((resolve, reject) => {
            ffmpeg(tempInput)
                .screenshots({ timestamps: ["1"], filename: fileName, folder: videoDir, size: "250x250" })
                .on("end", () => {
                    const buffer = fs.readFileSync(outputPath);
                    fs.unlinkSync(tempInput);
                    resolve({
                        base64: `data:image/jpeg;base64,${buffer.toString("base64")}`,
                        path: `/uploads/thumbnails/videos/${fileName}`,
                    });
                })
                .on("error", (err) => {
                    if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                    reject(err);
                });
        });
    }

    async extractPdfThumbnail(file: Express.Multer.File): Promise<ThumbnailResponse> {
        const { pdfDir } = this.getThumbnailFolders();
        const tempDir = os.tmpdir();
        const pdfPath = path.join(tempDir, `${Date.now()}-${randomUUID()}.pdf`);
        fs.writeFileSync(pdfPath, file.buffer);

        const fileName = `thumb-${Date.now()}-${randomUUID()}`;
        const convert = fromPath(pdfPath, {
            density: 100, saveFilename: fileName,
            savePath: pdfDir, format: "jpeg", width: 250, height: 250,
        });

        const result = await convert(1);
        const buffer = fs.readFileSync(result.path);
        fs.unlinkSync(pdfPath);

        return {
            base64: `data:image/jpeg;base64,${buffer.toString("base64")}`,
            path: `/uploads/thumbnails/pdfs/${path.basename(result.path)}`,
        };
    }

    // ==========================================
    // MAIN FILE UPLOAD
    // ==========================================
    async uploadFileData(file?: Express.Multer.File) {
        try {
            if (!file) throw new BadRequestException("File required");

            const uploadDir = path.join(process.cwd(), "uploads");
            this.ensureDir(uploadDir);

            const ext = path.extname(file.originalname);
            const safeName = file.originalname
                .replace(ext, "")
                .replace(/\s+/g, "-")
                .replace(/[^a-zA-Z0-9-_]/g, "");

            const finalFileName = `${Date.now()}-${randomUUID()}-${safeName}${ext}`;
            const finalPath = path.join(uploadDir, finalFileName);
            fs.writeFileSync(finalPath, file.buffer);

            const filePath = `/uploads/${finalFileName}`;
            const thumbnail = await this.extractThumbnail(file);

            let savedThumbnail: Thumbnails | null = null;
            if (thumbnail?.path) {
                savedThumbnail = this.thumbnailsRepo.create({ thubnailPath: thumbnail.path });
                savedThumbnail = await this.thumbnailsRepo.save(savedThumbnail);
            }

            const document = this.documentsRepo.create({
                docsPath: filePath,
                thumbnailId: savedThumbnail?.id || null,
            });

            const savedDocument = await this.documentsRepo.save(document);

            return {
                message: "File uploaded successfully",
                fileName: file.originalname,  // clean display name
                filePath,
                documentId: savedDocument.id, // ← frontend uses this for socket emission
                thumbnail: {
                    id: savedThumbnail?.id || null,
                    base64: thumbnail?.base64 || null,
                    path: thumbnail?.path || null,
                },
            };
        } catch (error) {
            console.log(error);
            throw new BadRequestException("Unable to upload file");
        }
    }
}