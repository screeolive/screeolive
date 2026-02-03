import { Request, Response } from "express";
import type { ZodError } from "zod";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import prisma from "../db/prisma";
import { JWT_USER_SECRET } from "../config/config";
import { signinValidationSchema, signupValidationSchema } from "../lib/zodSchema";
import { send_otp_test } from "../services/send_otp_for_signup";
import { MAIL_VERIFICATION } from "../services/verify_mail";

export const signup = async (req: Request, res: Response) => {
    try {
        const result = signupValidationSchema.safeParse(req.body);

        // If validation fails, return an error

        if (!result.success) {
            const error = result.error as ZodError;

            const formattedErrors = error.issues.map((issue) => ({
                field: issue.path.join(".") || "form",
                message: issue.message,
            }));

            res.status(400).json({
                message: "Validation failed",
                errors: formattedErrors,
            });
            return;
        }

        const { username, email, password } = result.data;

        // Checking if user already exists
        const user_existance = await prisma.user.findUnique({
            where: {
                email
            }
        })

        if (user_existance) {
            res.status(400).json({
                message: `User already exists with email ${email}`
            })
            return;
        }

        // Hashing the password!, storing the user's credentials securelyy!!

        const hashed_password = await bcrypt.hash(password, 10);

        // generating otp and storing the user to db along with the generated otp!
        const otpGenerated = Math.floor(100000 + Math.random() * 900000).toString();

        // Create the user first
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashed_password,
                verification_otp: otpGenerated,
            },
        });

        // SEND OTP TOP USER's MAIL FOR VERIFICATION:
        // Attempting to send the OTP email
        const emailSent = await send_otp_test(email, otpGenerated);

        // Check if the email failed to send
        if (!emailSent) {
            // If email sending fails, we must "roll back" the user creation.
            // This will prevent having unverified users stuck in the database.
            await prisma.user.delete({
                where: {
                    id: newUser.id,
                },
            });

            // Return an error to the client.
            console.error(`Failed to send OTP to ${email}. User creation rolled back.`);
            res.status(500).json({
                message: "Could not send verification email. Please try signing up again.",
                success: false,
            });
            return;
        }

        // If email was sent successfully, respond to the client.
        res.status(201).json({
            message: `OTP Sent to ${newUser.email} for verification!`,
            success: true,
        });
        return;

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Something Went Wrong During Signup"
        });
        return;
    }
}

export const verify_mail = async (req: Request, res: Response) => {
    const { email, otpEntered } = req.body;
    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (user?.email === email) {
        MAIL_VERIFICATION(otpEntered, email, res)
    }
    else {
        res.status(400).json({
            message: "Enter the email which you entered while SignUp!"
        });
        return;
    }
}

export const signin = async (req: Request, res: Response) => {
    try {
        const validationResult = signinValidationSchema.safeParse(req.body);

        // If validation fails, return an error
        if (!validationResult.success) {
            const error = validationResult.error as ZodError;

            const formattedErrors = error.issues.map((issue) => ({
                field: issue.path.join(".") || "form",
                message: issue.message,
            }));

            res.status(400).json({
                message: "Validation failed",
                errors: formattedErrors,
            });
            return;
        }

        const { email, password } = validationResult.data;

        // Find the user in the database
        const user = await prisma.user.findUnique({
            where: {
                email
            },
        });

        if (!user) {
            res.status(401).json({
                message: `User with mail ${email} Not Found`
            });
            return;
        }

        if (!user.isMailVerified) {
            res.status(403).json({
                message: "Please verify your email before logging in."
            })
            return;
        }

        // Compare password with hashed password in DB
        const matchPassword = await bcrypt.compare(password, user.password);
        if (!matchPassword) {
            res.status(401).json({
                message: "Incorrect Password!"
            });
            return;
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            JWT_USER_SECRET,
            {
                expiresIn: "4d" // Token expires in 4 day
            }
        );

        // Set the JWT token as an HTTP-only cookie

        res.status(200)
            .cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development", // Secure in production
                sameSite: process.env.NODE_ENV === "development" ? "lax" : "none", // Allow cross-site cookies
                maxAge: 4 * 24 * 60 * 60 * 1000, // 4 days
                path: "/"
            })
            .json({
                success: true,
                message: `${user.username} Logged In Successfully!`,
                user: {
                    id: user.id,
                    email: user.email
                }
            });

        return;
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Something Went Wrong During Signin"
        });
        return;
    }
}

export const logout = (req: Request, res: Response) => {
    try {
        res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
        res.status(200).json({
            message: "User Logged Out Successfully!"
        });
        return;
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({
            error: "Something went wrong while logging out."
        });
        return
    }
};

export const session = async (req: Request, res: Response) => {
    try {
        // Get token from cookies or Authorization header
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1] || req.query.token;

        if (!token) {
            res.status(200).json({
                message: {
                    isAuthenticated: false,
                    user: null
                }
            });
            return
        }

        // Verify the token
        const decoded = jwt.verify(token, JWT_USER_SECRET) as { id: string, email: string };

        // Fetch user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                username: true,
                contactNumber: true,
                isMailVerified: true,
                UserAddedAt: true,
                provider: true
            }
        });

        if (!user) {
            res.status(200).json({
                message: {
                    isAuthenticated: false,
                    user: null
                }
            });
            return
        }

        res.status(200).json({
            message: {
                isAuthenticated: true,
                user: user
            }
        });
        return
    } catch (error) {
        console.error('Session verification error:', error);
        res.status(200).json({
            message: {
                isAuthenticated: false,
                user: null
            }
        });
        return
    }
};