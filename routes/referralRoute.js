import { Router } from "express";
import { userAuthMiddleware } from "../middleware/userAuth.js";
import { providerAuthMiddleware } from "../middleware/providerAuth.js";
import {
  getMyReferralInfoUser,
  getMyReferralInfoProvider,
  inviteByEmailUser,
  inviteByEmailProvider,
} from "../controllers/referralController.js";

const referralRouter = Router();

// User referral endpoints
referralRouter.get("/user/me", userAuthMiddleware, getMyReferralInfoUser);
referralRouter.post("/user/invite", userAuthMiddleware, inviteByEmailUser);

// Provider referral endpoints
referralRouter.get("/provider/me", providerAuthMiddleware, getMyReferralInfoProvider);
referralRouter.post("/provider/invite", providerAuthMiddleware, inviteByEmailProvider);

export default referralRouter;

