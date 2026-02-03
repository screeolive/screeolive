import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../db/prisma';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '../config/config';
import { generateHashedPassword } from '../lib/generateHash';

const BASE_URL = process.env.BASE_URL;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Missing OAuth credentials in environment variables');
}

if (!BASE_URL) {
    throw new Error('Missing BASE_URL in environment variables');
}


// Serialize & Deserialize user
passport.serializeUser((user: Express.User, done) => {
    done(null, (user as any).id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Google Strategy
passport.use(
    'google',
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: `${BASE_URL}/auth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) {
                    done(new Error('No email found in Google profile'));
                    return
                }

                let user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            email,
                            username: profile.displayName || `user-${Math.random().toString(36).substring(2, 9)}`,
                            password: await generateHashedPassword(),
                            contactNumber: "NOT_PROVIDED",
                            isMailVerified: true,
                            provider: 'google',
                            providerId: profile.id,
                        },
                    });
                }

                done(null, user);
                return
            } catch (err) {
                done(err as Error);
                return
            }
        }
    )
);