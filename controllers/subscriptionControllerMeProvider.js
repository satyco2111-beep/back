// // import { v4 as uuidv4 } from "uuid";
// import Sprovider from "../models/providerModel.js";
// import  SsubscriptionMeUser from "../models/subscriptionModelMeUser.js";

// // Helper: calculate next billing date (monthly)
// const getNextBillingDate = (startDate) => {
//   const date = new Date(startDate);
//   date.setMonth(date.getMonth() + 1);
//   return date;
// };

// // 🔹 BUY / UPGRADE PLAN
// export const buyOrUpgradePlan = async (req, res) => {
//   try {
//     const { suid, planId, planName, amount } = req.body;

//     // 1. Find active subscription
//     const existingSub = await SsubscriptionMeUser.findOne({
//       suid,
//       status: "ACTIVE",
//     });

//     const now = new Date();

//     // ---------------------------
//     // CASE 1: ACTIVE PLAN EXISTS
//     // ---------------------------
//     if (existingSub) {
//       // Check if expired (safety check)
//       if (existingSub.endDate && existingSub.endDate < now) {
//         existingSub.status = "EXPIRED";
//         await existingSub.save();
//       } else {
//         // 🔥 Upgrade logic
//         existingSub.planId = planId;
//         existingSub.planName = planName;
//         existingSub.amount = amount;
//         existingSub.nextBillingDate = getNextBillingDate(now);

//         await existingSub.save();

//         return res.json({
//           success: true,
//           message: "Plan upgraded successfully",
//           data: existingSub,
//         });
//       }
//     }

//     // ---------------------------
//     // CASE 2: NEW OR EXPIRED USER
//     // ---------------------------

//     const ssubid = `Ssubuser-${Date.now()}`;
//     const newSub = await SsubscriptionMeUser.create({
//       ssubid: ssubid,
//       suid,
//       planId,
//       planName,
//       amount,
//       startDate: now,
//       endDate: getNextBillingDate(now),
//       nextBillingDate: getNextBillingDate(now),
//       status: "ACTIVE",
//     });

//     return res.json({
//       success: true,
//       message: "Plan purchased successfully",
//       data: newSub,
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Something went wrong",
//     });
//   }
// };

// // 🔹 GET USER SUBSCRIPTION (for UI buttons)
// export const getUserSubscription = async (req, res) => {
//   try {
//     const { suid } = req.params;

//     const sub = await SsubscriptionMeUser.findOne({
//       suid,
//       status: "ACTIVE",
//     });

//     const now = new Date();

//     if (!sub) {
//       return res.json({
//         subscribed: false,
//         showSubscribeButton: true,
//         showUpgradeButton: false,
//       });
//     }

//     // Check expiration
//     if (sub.endDate && sub.endDate < now) {
//       sub.status = "EXPIRED";
//       await sub.save();

//       return res.json({
//         subscribed: false,
//         showSubscribeButton: true,
//         showUpgradeButton: false,
//       });
//     }

//     return res.json({
//       subscribed: true,
//       showSubscribeButton: false,
//       showUpgradeButton: true,
//       currentPlan: sub.planName,
//       nextBillingDate: sub.nextBillingDate,
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching subscription",
//     });
//   }
// };



// ===================================

import crypto from "crypto";
import Razorpay from "razorpay";
import SsubscriptionMeProvider from "../models/subscriptionModelMeProvider.js";

const getRazorpayClient = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// 📌 Helper
const getNextBillingDate = (startDate) => {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + 1);
  return d;
};

// ============================
// 🔹 CREATE ORDER
// ============================
export const createSubscriptionOrder = async (req, res) => {
  try {
    const { suid, planId, planName, amount } = req.body;

    const razorpay = getRazorpayClient();

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `SUB-${Date.now()}`,
      notes: { suid, planId, planName },
    });

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================
// 🔹 VERIFY + ACTIVATE PLAN
// ============================
export const verifySubscriptionPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      sprovid,
      planId,
      planName,
      amount,
    } = req.body;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // 🔥 ACTIVATE / UPGRADE PLAN
    const existingSub = await SsubscriptionMeProvider.findOne({
      sprovid: req.body.sprovid,
      status: "ACTIVE",
    });

    const now = new Date();

    if (existingSub) {
      existingSub.planId = planId;
      existingSub.planName = planName;
      existingSub.amount = amount;
      existingSub.nextBillingDate = getNextBillingDate(now);
      existingSub.endDate = getNextBillingDate(now);

      await existingSub.save();

      return res.json({
        success: true,
        message: "Plan upgraded successfully",
      });
    }

    await SsubscriptionMeProvider.create({
      ssubid: `SUB-${Date.now()}`,
      sprovid: req.body.sprovid,
      planId,
      planName,
      amount,
      startDate: now,
      endDate: getNextBillingDate(now),
      nextBillingDate: getNextBillingDate(now),
      status: "ACTIVE",
    });

    res.json({
      success: true,
      message: "Subscription activated",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================
// 🔹 GET USER SUB
// ============================
export const getUserSubscription = async (req, res) => {
  try {
    const { sprovid } = req.params;

    const sub = await SsubscriptionMeProvider.findOne({
      sprovid,
      status: "ACTIVE",
    });

    const now = new Date();

    if (!sub || sub.endDate < now) {
      return res.json({ subscribed: false });
    }

    res.json({
      subscribed: true,
      currentPlan: sub.planName,
      nextBillingDate: sub.nextBillingDate,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};