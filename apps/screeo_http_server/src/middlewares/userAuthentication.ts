import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_USER_SECRET } from "../config/config";

export const UserAuth = (req: Request, res: Response, next: NextFunction) => {
    // Check cookies, authorization header, AND query params
    let token = req.cookies.token ||
        req.headers.authorization?.split(' ')[1] ||
        req.query.token;

    if (!token) {
        res.status(401).json({
            message: "Unauthorized: No token provided"
        });
        return
    }

    // If token is from query params, remove it from URL for security
    if (req.query.token && req.originalUrl) {
        const cleanUrl = req.originalUrl.replace(/[?&]token=[^&]*/, '');
        if (cleanUrl !== req.originalUrl) {
            res.redirect(cleanUrl);
            return
        }
    }

    try {
        const decoded = jwt.verify(token, JWT_USER_SECRET) as {
            id: string; email: string
        };
        (req as any).user = decoded;
        next();
    } catch (error) {
        res.status(403).json({
            message: "Invalid or expired token"
        });
        return
    }
};

// The Approach: Optional Authentication
// You need a new middleware that attempts to authenticate the user but doesn't fail if they aren't logged in. It only fails if a token is provided but is invalid. This pattern allows the request to continue to the controller, which can then check if req.user exists or not.

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        // If no token exists, simply proceed without a user object.
        // The controller will handle the guest logic.
        if (!token) {
            next();
            return;
        }

        // If a token exists, verify it.
        const decoded = jwt.verify(token, JWT_USER_SECRET) as {
            id: string; email: string; username: string;
        };

        // Attach the user to the request object for the controller to use.
        (req as any).user = decoded;
        next();

    } catch (error) {
        // This catch block runs ONLY if a token was provided but was invalid or expired.
        // In this case, it's correct to deny access.
        res.status(403).json({
            message: "Invalid or expired token provided."
        });
        return;
    }
};