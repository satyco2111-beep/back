import { Router } from "express";
import {getAllUsers,registerUser ,verifyEmail,forgotPassword, loginUser ,logoutUser ,getUserBySuid , verifyUserToken} from "../controllers/userController.js"
import {userAuthMiddleware} from "../middleware/userAuth.js"


const userRouter = Router();

userRouter.get("/users",getAllUsers)
userRouter.post("/register",registerUser)
userRouter.post("/verify-email", verifyEmail);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/login", loginUser);
// userRouter.post("/logout", userAuthMiddleware, logoutUser);
userRouter.post("/logout", logoutUser);
userRouter.get("/user/:suid", getUserBySuid);
userRouter.post("/verify-token", verifyUserToken);

export default userRouter; 