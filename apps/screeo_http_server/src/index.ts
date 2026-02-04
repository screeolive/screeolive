import './services/passport';
import passport from 'passport';
import session from 'express-session';
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import {
    PORT
} from "./config/config";
import { AuthRouter } from './routes/authRoutes';
import { OauthRouter } from './controllers/oauthControllers';
import { RoomRouter } from './routes/roomRoutes';
import prisma from './db/prisma';
const app = express();

const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://screeolive-signaling-underdev.onrender.com',
        'https://screeolive.vercel.app'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.use(cors(corsOptions));

// Session configuration
app.use(
    session({
        // secret: process.env.SESSION_SECRET || 'defaultsecret',
        secret: process.env.SESSION_SECRET as string,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
        },
    })
);

// Passport middlewares
app.use(passport.initialize());
app.use(passport.session());


app.use("/api/v1/auth", AuthRouter);
app.use("/auth", OauthRouter);

app.use("/api/v1/rooms", RoomRouter);

app.get("/users" , async (req, res) => {
    try {
        const data = await prisma.user.findMany({
            select: {
                username: true,
                provider: true
            }
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
})

app.get("/", (req, res) => {
    res.send(`
        <h1 style="text-align: center;">Screeo's http Server is up and running!!</h1>
    `)
})


app.listen(PORT, () => {
    console.log(`HTTP BACKEND IS HOSTED : http://localhost:${PORT}`)
});