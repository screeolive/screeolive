import { Router } from 'express';
import { optionalAuth } from '../middlewares/userAuthentication';
import { createRoom, getRoomDetails } from '../controllers/roomControllers';

export const RoomRouter = Router();

// Endpoint to create a new room. Can be accessed by guests or logged-in users.
RoomRouter.post('/', optionalAuth, createRoom);

// Endpoint to get details about a specific room.
RoomRouter.get('/:roomId', getRoomDetails);