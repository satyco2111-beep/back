import { Router } from "express";
import {getAllUsers,registerUser ,verifyEmail,forgotPassword, loginUser ,logoutUser ,getUserBySuid , verifyUserToken, getUserDashboard, updateUserProfile} from "../controllers/userController.js"
import {userAuthMiddleware} from "../middleware/userAuth.js"
import {
  createUserWithdrawalRequest,
  listMyWithdrawalRequests,
} from "../controllers/creditWithdrawalController.js";


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

userRouter.post("/withdrawal-request", userAuthMiddleware, createUserWithdrawalRequest);
userRouter.get("/withdrawal-requests", userAuthMiddleware, listMyWithdrawalRequests);

userRouter.get("/dashboard", userAuthMiddleware, getUserDashboard);
userRouter.put("/profile", userAuthMiddleware, updateUserProfile);

export default userRouter; 