import express from "express"
const RouterMain = express.Router();

import userRouter from "./userRoute.js"
import cityRouter from "./cityRoute.js"
import localAriaRouter from "./loaclCityRoute.js"
import servicesRouter from "./servicesRoute.js"
import providerRouter from "./providerRoute.js"
import workRouter from "./workRoute.js"
import workRequestRouter from "./workRequestRoute.js"
import commentRouter from "./commentRoute.js"
import reviewRouter from "./reviewRoute.js"
import referralRouter from "./referralRoute.js"
import paymentRouter from "./paymentRoute.js"
import superAdminRouter from "./superAdminRoute.js"
import subscriptionRouter from "./subscriptionRoute.js"
import subscriptionMeUserRouter from "./subscriptionRouteMeUser.js";
import subscriptionMeProviderRouter from "./subscriptionRouteMeProvider.js";






RouterMain.use("/user", userRouter);
RouterMain.use("/city", cityRouter);
RouterMain.use("/local-aria", localAriaRouter);
RouterMain.use("/services", servicesRouter);
RouterMain.use("/providers", providerRouter);
RouterMain.use("/works", workRouter);
RouterMain.use("/work-requests", workRequestRouter);
RouterMain.use("/comment", commentRouter);
RouterMain.use("/review", reviewRouter);
RouterMain.use("/referrals", referralRouter);
RouterMain.use("/payments", paymentRouter);
RouterMain.use("/superadmin", superAdminRouter);
RouterMain.use("/subscription", subscriptionRouter);
RouterMain.use("/subscription/me-user", subscriptionMeUserRouter);
RouterMain.use("/subscription/me-provider", subscriptionMeProviderRouter);


export default RouterMain;