import { Router } from "express";
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  getCurrentSubscription,
  createSubscription,
  cancelSubscription,
  getSubscriptionHistory,
  handleSubscriptionWebhook,
} from "../controllers/subscriptionController.js";

const subscriptionRouter = Router();

// Public routes
subscriptionRouter.get("/plans", getSubscriptionPlans);

// Provider routes (require authentication)
subscriptionRouter.get("/current", getCurrentSubscription);
subscriptionRouter.get("/history", getSubscriptionHistory);
subscriptionRouter.post("/create", createSubscription);
subscriptionRouter.put("/cancel", cancelSubscription);

// Webhook route (no auth - verified by signature)
subscriptionRouter.post("/webhook", handleSubscriptionWebhook);

// Admin routes (for plan management)
subscriptionRouter.post("/plans", createSubscriptionPlan);

export default subscriptionRouter;