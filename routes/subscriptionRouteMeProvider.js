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
} from "../controllers/subscriptionControllerMeProvider.js";
// } from "../controllers/subscriptionController.js";

const subscriptionMeProviderRouter = express.Router();

subscriptionMeProviderRouter.post("/create-order", createSubscriptionOrder);
subscriptionMeProviderRouter.post("/verify-payment", verifySubscriptionPayment);
subscriptionMeProviderRouter.get("/me-provider/:sprovid", getUserSubscription);

export default subscriptionMeProviderRouter;