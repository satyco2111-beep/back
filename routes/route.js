import express from "express"
const RouterMain = express.Router();

import userRouter from "./userRoute.js"
import cityRouter from "./cityRoute.js"
import localAriaRouter from "./loaclCityRoute.js"
import servicesRouter from "./servicesRoute.js"
import providerRouter from "./providerRoute.js"
import workRouter from "./workRoute.js"
import commentRouter from "./commentRoute.js"
import reviewRouter from "./reviewRoute.js"





RouterMain.use("/user", userRouter);
RouterMain.use("/city", cityRouter);
RouterMain.use("/local-aria", localAriaRouter);
RouterMain.use("/services", servicesRouter);
RouterMain.use("/providers", providerRouter);
RouterMain.use("/works", workRouter);
RouterMain.use("/comment", commentRouter);
RouterMain.use("/review", reviewRouter);


export default RouterMain;