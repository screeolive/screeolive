import { z } from "zod";

export const signupValidationSchema = z.object({
    username: z
        .string()
        .min(3, { message: "Username must be at least 3 characters long" })
        .max(30, { message: "Username must not exceed 30 characters" })
        .regex(/^[a-zA-Z0-9_]+$/, {
            message: "Username can only contain letters, numbers, and underscores",
        }),

    email: z
        .email({ message: "Invalid email address" }),

    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters long" })
        .max(100, { message: "Password must not exceed 100 characters" })
        .refine(
            (val) => /[A-Z]/.test(val),
            { message: "Password must contain at least one uppercase letter" }
        )
        .refine(
            (val) => /[a-z]/.test(val),
            { message: "Password must contain at least one lowercase letter" }
        )
        .refine(
            (val) => /[0-9]/.test(val),
            { message: "Password must contain at least one number" }
        )
    // .refine(
    //     (val) => /[\W_]/.test(val),
    //     { message: "Password must contain at least one special character" }
    // ),
});

export const signinValidationSchema = z.object({
    email: z
        .email({ message: "Invalid email address" }),

    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters long" })
        .max(100, { message: "Password must not exceed 100 characters" })
        .refine(
            (val) => /[A-Z]/.test(val),
            { message: "Password must contain at least one uppercase letter" }
        )
        .refine(
            (val) => /[a-z]/.test(val),
            { message: "Password must contain at least one lowercase letter" }
        )
        .refine(
            (val) => /[0-9]/.test(val),
            { message: "Password must contain at least one number" }
        )
});