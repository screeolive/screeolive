import { Request, Response } from 'express';
import { customAlphabet } from 'nanoid';
import prisma from '../db/prisma'; // Your Prisma client instance

// human-readable, unique room IDs like "abc-def-ghi"
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 9);
const generateRoomId = () => `${nanoid(3)}-${nanoid(3)}-${nanoid(3)}`;

export const createRoom = async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { guestName } = req.body;

    // A user must be logged in OR provide a guest name.
    if (!user && !guestName) {
        res.status(400).json({ message: 'Guest name is required for non-authenticated users.' });
        return;
    }

    try {
        const roomId = generateRoomId();

        if (user) {
            // creating the Room and the first Participant (the host) in a single, atomic transaction.
            // If one part fails, the whole operation is rolled back.
            await prisma.$transaction(async (tx: any) => {
                const newRoom = await tx.room.create({
                    data: {
                        id: roomId,
                        hostId: user.id, // The logged-in user is the host
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
            // For guests, creating a temporary "placeholder" user and a room.
            // This allows them to participate without full registration.

            // Generate a unique identifier for the guest
            const guestId = `guest_${customAlphabet('1234567890abcdef', 12)()}`;

            await prisma.$transaction(async (tx: any) => {
                // Create a placeholder user for the guest
                const guestUser = await tx.user.create({
                    data: {
                        id: guestId,
                        email: `${guestId}@screeo.guest`, // Guest users have a unique, non-functional email
                        username: guestName,
                        password: '', // No password for guests
                        provider: 'guest',
                    },
                });

                const newRoom = await tx.room.create({
                    data: {
                        id: roomId,
                        hostId: guestUser.id, // The guest is the host of their room
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


// Gets details for a specific room.
// Useful for the lobby to verify a room exists before trying to join.

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