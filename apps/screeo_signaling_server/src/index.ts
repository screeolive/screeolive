import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "https://screeolive.vercel.app", "https://screeoliveapi.vercel.app"],
        methods: ["GET", "POST"]
    }
});

const userIdToSocketIdMap = new Map<string, string>();
const socketIdToUserIdMap = new Map<string, string>();

const userIdToUsernameMap = new Map<string, string>();
const rooms: Record<string, Set<string>> = {};

io.on('connection', (socket: Socket) => {
    console.log(`User connected with socket ID: ${socket.id}`);

    socket.on('join-room', (roomId: string, userId: string, username: string) => {
        const usersInThisRoom = rooms[roomId] ? Array.from(rooms[roomId]) : [];
        const participantsInRoom = usersInThisRoom.map(id => ({
            id,
            username: userIdToUsernameMap.get(id) || 'Guest'
        }));
        userIdToSocketIdMap.set(userId, socket.id);
        socketIdToUserIdMap.set(socket.id, userId);
        userIdToUsernameMap.set(userId, username);
        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = new Set();
        }
        rooms[roomId].add(userId);

        console.log(`User ${username} (${userId}) joined room ${roomId}`);

        socket.emit('existing-users', participantsInRoom);

        socket.to(roomId).emit('user-connected', { id: userId, username });
    });
    socket.on('offer', (data: { to: string; offer: RTCSessionDescriptionInit }) => {
        const fromUserId = socketIdToUserIdMap.get(socket.id);
        const targetSocketId = userIdToSocketIdMap.get(data.to);
        if (targetSocketId && fromUserId) {
            io.to(targetSocketId).emit('offer', { offer: data.offer, from: fromUserId });
        }
    });

    socket.on('answer', (data: { to: string; answer: RTCSessionDescriptionInit }) => {
        const fromUserId = socketIdToUserIdMap.get(socket.id);
        const targetSocketId = userIdToSocketIdMap.get(data.to);
        if (targetSocketId && fromUserId) {
            io.to(targetSocketId).emit('answer', { answer: data.answer, from: fromUserId });
        }
    });

    socket.on('ice-candidate', (data: { to: string; candidate: RTCIceCandidateInit }) => {
        const fromUserId = socketIdToUserIdMap.get(socket.id);
        const targetSocketId = userIdToSocketIdMap.get(data.to);
        if (targetSocketId && fromUserId) {
            io.to(targetSocketId).emit('ice-candidate', { candidate: data.candidate, from: fromUserId });
        }
    });

    const handleDisconnect = () => {
        const disconnectedUserId = socketIdToUserIdMap.get(socket.id);
        if (disconnectedUserId) {
            console.log(`User ${disconnectedUserId} disconnected.`);
            userIdToUsernameMap.delete(disconnectedUserId);
            userIdToSocketIdMap.delete(disconnectedUserId);
            socketIdToUserIdMap.delete(socket.id);

            for (const roomId in rooms) {
                const roomUsers = rooms[roomId];
                if (roomUsers && roomUsers.has(disconnectedUserId)) {
                    roomUsers.delete(disconnectedUserId);
                    socket.to(roomId).emit('user-disconnected', disconnectedUserId);
                    if (roomUsers.size === 0) {
                        delete rooms[roomId];
                        console.log(`Room ${roomId} is now empty and has been deleted.`);
                    }
                }
            }
        }
    };

    socket.on('leave-room', handleDisconnect);
    socket.on('disconnect', handleDisconnect);
});

const PORT = process.env.SIGNALING_PORT || 3001;
server.listen(PORT, () => {
    console.log(`✅ Signaling server running on port ${PORT}`);
});