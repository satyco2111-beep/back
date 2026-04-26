// import express from "express";
// import {
//   buyOrUpgradePlan,
//   getUserSubscription,
// } from "../controllers/subscriptionControllerMeUser.js";

// const subscriptionMeUserRouter = express.Router();

// // Buy / Upgrade
// subscriptionMeUserRouter.post("/buy", buyOrUpgradePlan);

// // Get subscription status (for UI)
// subscriptionMeUserRouter.get("/:suid", getUserSubscription);

// export default subscriptionMeUserRouter;





import express from "express";
import {
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getUserSubscription,
} from "../controllers/subscriptionControllerMeUser.js";
// } from "../controllers/subscriptionController.js";

const subscriptionMeUserRouter = express.Router();

subscriptionMeUserRouter.post("/create-order", createSubscriptionOrder);
subscriptionMeUserRouter.post("/verify-payment", verifySubscriptionPayment);
subscriptionMeUserRouter.get("/me-user/:suid", getUserSubscription);

export default subscriptionMeUserRouter;