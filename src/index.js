// import all modules -----
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";

// import all file and variables ----- 
import RouterMain from "../routes/route.js"
import connectDB from "../config/db.js"
import { ensureDefaultSuperAdmin } from "../controllers/superAdminController.js";
import Sprovider from "../models/providerModel.js";
import Spayment from "../models/paymentModel.js";




// make main variabls --------------
const app = express();
app.use(express.json());
dotenv.config();
const PORT = process.env.PORT || 5000;
connectDB();
// create default super admin if env provided
ensureDefaultSuperAdmin().catch(() => {});

//  Alaow cors ===============

app.use(
    cors({
        origin: [
            "http://localhost:3000", 
            "http://127.0.0.1:3000",
            "https://back-nwex.onrender.com",
            "https://afront.onrender.com",
            "https://do-some-thing.vercel.app",
            "https://back-phi-taupe.vercel.app",
            "https://do-some.vercel.app",
            "https://www.dosomething.world"
        ],
        credentials: true,
    })
);


// make routes  --------------
app.use("/test", (req, res) => {
    res.json({ sms: "This app is runnunig" })
})


// const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
// const WEBHOOK_SECRET = "W2JeunXqs7Rj@fe"; // For testing, use the value from .env directly. In production, always use env variable.


// app.post("/webhook/razorpay", (req, res) => {
//   const signature = req.headers["x-razorpay-signature"];

//   const expectedSignature = crypto
//     .createHmac("sha256", WEBHOOK_SECRET)
//     .update(req.body)
//     .digest("hex");

//   if (signature === expectedSignature) {
//     const event = JSON.parse(req.body.toString());

//     console.log("Webhook verified:", event.event);

//     if (event.event === "payment.captured") {
//         console.log("Payment captured event received:", {
//             orderId: event.payload.payment.entity.order_id,
//             paymentId: event.payload.payment.entity.id,
//             amount: event.payload.payment.entity.amount,
//         });
//       // handle success
//     }

//     if (event.event === "payment.failed") {
//       // handle failure
//       console.log("Payment failed event received:", {
//         orderId: event.payload.payment.entity.order_id,
//         paymentId: event.payload.payment.entity.id,
//         amount: event.payload.payment.entity.amount,
//       });
//     }

//     res.status(200).send("OK");
//   } else {
//     res.status(400).send("Invalid signature");
//   }
// });

app.post("/webhook/razorpay", express.raw({ type: "application/json" }), async (req, res) => {
    console.log("Webhook event:", req.body,req.body.payload.payment.entity );
    // console.log("Webhook event:");
    

   const sprovid = req.body.payload.payment.entity.notes?.provider_id;

    const provider = await Sprovider.findOne({ sprovid });

        const amountPaidInr = Number(req.body.payload.payment.entity.amount) / 100;

    const creditAdded = Number((amountPaidInr ).toFixed(2));
    const currentCredit = Number(provider.cradit_value) || 0;
    const newCredit = Number((currentCredit + creditAdded).toFixed(2));

    provider.cradit_value = String(newCredit);
    await provider.save();

    return res.status(200).send("OK");
//   try {
//     const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "W2JeunXqs7Rj@fe";
//     const signature = req.headers["x-razorpay-signature"];

//     const expectedSignature = crypto
//       .createHmac("sha256", secret)
//       .update(req.body)
//       .digest("hex");

//     if (signature !== expectedSignature) {
//       return res.status(400).send("Invalid signature");
//     }

//     // const body = JSON.parse(req.body.toString());
//     const body = req.body;
//     console.log("Webhook event:", body.event);

//     const CREDIT_BONUS_PERCENT = Number(process.env.CREDIT_BONUS_PERCENT || 0.05);

//     if (body.event === "payment.captured") {
//       const payment = body.payload.payment.entity;
//       const orderId = payment.order_id;
//       const paymentId = payment.id;
//       const amountPaidPaise = payment.amount;
//       const amountPaidInr = Number(amountPaidPaise) / 100;
//       const notes = payment.notes || {};
//       const sprovid = notes.sprovid;
//       const purpose = notes.purpose;

//       if (purpose !== "BUY_CREDIT" || !sprovid) {
//         console.log("Not a credit purchase or missing sprovid");
//         return res.status(200).send("OK");
//       }

//       // Check if already processed
//       const existing = await Spayment.findOne({ razorpayPaymentId: paymentId });
//       if (existing) {
//         console.log("Payment already processed");
//         return res.status(200).send("OK");
//       }

//       const provider = await Sprovider.findOne({ sprovid });
//       if (!provider) {
//         console.log("Provider not found");
//         return res.status(200).send("OK");
//       }

//       const creditAdded = Number((amountPaidInr * (1 + CREDIT_BONUS_PERCENT)).toFixed(2));
//       const currentCredit = Number(provider.cradit_value) || 0;
//       const newCredit = Number((currentCredit + creditAdded).toFixed(2));

//       provider.cradit_value = String(newCredit);
//       await provider.save();

//       const spayid = `SPAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
//       await Spayment.create({
//         spayid,
//         providerId: sprovid,
//         providerEmail: provider.email,
//         gateway: "RAZORPAY",
//         razorpayOrderId: orderId,
//         razorpayPaymentId: paymentId,
//         amountPaid: amountPaidInr,
//         creditBonusPercent: CREDIT_BONUS_PERCENT,
//         creditAdded,
//         status: "SUCCESS",
//       });

//       console.log("Credit added:", { sprovid, creditAdded, newCredit });
//     }

//     if (body.event === "payment.failed") {
//       const payment = body.payload.payment.entity;
//       const orderId = payment.order_id;
//       const paymentId = payment.id;
//       const amountPaidInr = Number(payment.amount) / 100;
//       const notes = payment.notes || {};
//       const sprovid = notes.sprovid;

//       // Record failed payment
//       const spayid = `SPAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
//       await Spayment.create({
//         spayid,
//         providerId: sprovid || null,
//         gateway: "RAZORPAY",
//         razorpayOrderId: orderId,
//         razorpayPaymentId: paymentId,
//         amountPaid: amountPaidInr,
//         status: "FAILED",
//       });

//       console.log("Payment failed:", { orderId, paymentId });
//     }

//     res.status(200).send("OK");
//   } catch (err) {
//     console.error("Webhook error:", err);
//     res.status(500).send("Webhook error");
//   }
});

app.use('/api', RouterMain);



console.log('PORT', PORT)
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
})                                                                                                                                                                                                              