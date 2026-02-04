import { Request, Response } from 'express';
import { customAlphabet } from 'nanoid';
import prisma from '../db/prisma';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 9);
const generateRoomId = () => `${nanoid(3)}-${nanoid(3)}-${nanoid(3)}`;

export const createRoom = async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { guestName } = req.body;

    if (!user && !guestName) {
        res.status(400).json({ message: 'Guest name is required for non-authenticated users.' });
        return;
    }

    try {
        const roomId = generateRoomId();

        if (user) {
            await prisma.$transaction(async (tx: any) => {
                const newRoom = await tx.room.create({
                    data: {
                        id: roomId,
                        hostId: user.id,
                    },
                });

                await tx.participant.create({
                    data: {
                        roomId: newRoom.id,
                        userId: user.id,
                    },
                });
            });

            console.log(`Authenticated user ${user.username} (${user.id}) created room ${roomId}`);
            res.status(201).json({ roomId });
            return;

        } else {
            const guestId = `guest_${customAlphabet('1234567890abcdef', 12)()}`;

            await prisma.$transaction(async (tx: any) => {
                const guestUser = await tx.user.create({
                    data: {
                        id: guestId,
                        email: `${guestId}@screeo.guest`,
                        username: guestName,
                        password: '',
                        provider: 'guest',
                    },
                });

                const newRoom = await tx.room.create({
                    data: {
                        id: roomId,
                        hostId: guestUser.id,
                    },
                });

                await tx.participant.create({
                    data: {
                        roomId: newRoom.id,
                        userId: guestUser.id,
                    },
                });
            });

            console.log(`Guest "${guestName}" created room ${roomId}`);
            res.status(201).json({ roomId, guestId }); // Return guestId so frontend can use it
            return;
        }

    } catch (error) {
        console.error("Failed to create room:", error);
        res.status(500).json({ message: "An error occurred while creating the room." });
        return;
    }
};


export const getRoomDetails = async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const room = await prisma.room.findUnique({
            where: { id: roomId as string },
            include: {
                host: {
                    select: {
                        username: true,
                    },
                },
                participants: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                            }
                        }
                    }
                }
            },
        });

        if (!room) {
            res.status(404).json({ message: "Room not found." });
            return;
        }

        res.status(200).json(room);
        return;

    } catch (error) {
        console.error("Failed to get room details:", error);
        res.status(500).json({ message: "An error occurred." });
        return;
    }
};