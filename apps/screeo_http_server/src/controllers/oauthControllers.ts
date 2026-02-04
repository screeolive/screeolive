import jwt from 'jsonwebtoken';
import { Request, Response, Router } from 'express';
import passport from 'passport';
import { FRONTEND_URL, JWT_USER_SECRET } from '../config/config';

export const OauthRouter = Router();

const handleAuthSuccess = (req: Request, res: Response) => {
    if (!req.user) {
        res.redirect(`${FRONTEND_URL}/auth/failure?message=Authentication failed`);
        return;
    }

    const user = req.user as any;

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        JWT_USER_SECRET,
        { expiresIn: "4d" }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
        maxAge: 4 * 24 * 60 * 60 * 1000,
        path: "/",
    });

    const redirectUrl = new URL(`${FRONTEND_URL}`);
    res.redirect(redirectUrl.toString());
};


OauthRouter.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
}));

OauthRouter.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/auth/failure',
        session: false
    }),
    handleAuthSuccess
);

OauthRouter.get('/logout', (req: Request, res: Response) => {
    res.clearCookie('token', { path: '/' });
    res.redirect('/');
});
OauthRouter.get('/failure', (req: Request, res: Response) => {
    const message = req.query.message || 'Failed to authenticate.';
    res.status(401).send(message);
});