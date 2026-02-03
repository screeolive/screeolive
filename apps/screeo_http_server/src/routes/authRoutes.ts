import { Router } from "express";
import {
    logout,
    session,
    signin,
    signup,
    verify_mail
} from "../controllers/authControllers";
import { UserAuth } from "../middlewares/userAuthentication";

export const AuthRouter = Router();

AuthRouter.post("/signup", signup);
AuthRouter.post("/verify-mail", verify_mail);

AuthRouter.post("/signin", signin);
AuthRouter.post("/logout", logout)

AuthRouter.get("/session", UserAuth, session);