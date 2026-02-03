import nodemailer from 'nodemailer';
import { OTP_MAIL_PASSWORD, OTP_SENDER_MAIL, SENDGRID_API_KEY } from '../config/config';

const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
        user: 'apikey',
        pass: SENDGRID_API_KEY,
    },
});

const transporter_test = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: OTP_SENDER_MAIL,
        pass: OTP_MAIL_PASSWORD,
    },
});

export const send_otp = async (to: string, otpGenerated: string): Promise<boolean> => {
    try {

        const mailOptions = {

            from: `"Screeo" <${OTP_SENDER_MAIL}>`,
            to,
            subject: 'Your Verification Code for Screeo',
            text: `Welcome to Screeo! Your One-Time Password (OTP) is: ${otpGenerated}. This code is valid for 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #333; text-align: center;">Welcome to Screeo!</h2>
                    <p style="font-size: 16px;">Thank you for signing up. Please use the following One-Time Password (OTP) to verify your email address and complete your registration.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 10px 20px; background-color: #f2f2f2; border-radius: 5px;">
                            ${otpGenerated}
                        </span>
                    </div>
                    <p style="font-size: 14px;">Please note: This OTP is valid for a limited time and should not be shared with anyone.</p>
                    <p style="font-size: 14px;">Best regards,<br/>The Screeo Team</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
};


export const send_otp_test = async (to: string, otpGenerated: string): Promise<boolean> => {
    try {
        const mailOptions = {
            from: OTP_SENDER_MAIL,
            to,
            subject: 'Your Verification Code for Screeo',
            text: `Welcome to Screeo! Your One-Time Password (OTP) is: ${otpGenerated}. This code is valid for 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #333; text-align: center;">Welcome to Screeo!</h2>
                    <p style="font-size: 16px;">Thank you for signing up. Please use the following One-Time Password (OTP) to verify your email address and complete your registration.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 10px 20px; background-color: #f2f2f2; border-radius: 5px;">
                            ${otpGenerated}
                        </span>
                    </div>
                    <p style="font-size: 14px;">Please note: This OTP is valid for a limited time and should not be shared with anyone.</p>
                    <p style="font-size: 14px;">Best regards,<br/>The Screeo Team</p>
                </div>
            `,
        };

        await transporter_test.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
}