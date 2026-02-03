import { config } from "dotenv";
config();

export const PORT = process.env.PORT || 3002;
export const JWT_USER_SECRET = process.env.JWT_USER_SECRET as string;
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// For Google Oauth
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export const OTP_SENDER_MAIL = process.env.OTP_SENDER_MAIL;
export const OTP_MAIL_PASSWORD = process.env.OTP_MAIL_PASSWORD;
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
