import prisma from "../db/prisma";
import { Response } from "express";

export const MAIL_VERIFICATION = async (otpEntered: string, mail: string, res: Response) => {
    const user = await prisma.user.findUnique({
        where: {
            email: mail
        }
    })

    if (!user) {
        res.status(401).json({
            message: `User not found with email: ${mail}`
        })
        return;
    }
    else {
        if (user.verification_otp === otpEntered) {
            await prisma.user.update({
                where: {
                    email: mail
                },
                data: {
                    isMailVerified: true
                }
            })

            await prisma.user.update({
                where: {
                    email: mail
                },
                data: {
                    verification_otp: "MAIL_VERIFICATION_DONE"
                }
            })
            res.status(200).json({
                message: `${user.username}'s EMAIL VERIFIED SUCCESFULLY!!`,
                success: true
            })
            return;
        }
        else {
            res.status(400).json({
                message: "INVALID OTP ENTERED!"
            })
            return;
        }
    }
}