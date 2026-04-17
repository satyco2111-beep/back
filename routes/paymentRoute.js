import { Router } from "express";
import { providerAuthMiddleware } from "../middleware/providerAuth.js";
import {
  createRazorpayOrderForCredit,
  verifyRazorpayPaymentAndAddCredit,
} from "../controllers/paymentController.js";

const paymentRouter = Router();

paymentRouter.post("/razorpay/create-order", providerAuthMiddleware, createRazorpayOrderForCredit);
paymentRouter.post("/razorpay/verify", providerAuthMiddleware, verifyRazorpayPaymentAndAddCredit);

export default paymentRouter;

