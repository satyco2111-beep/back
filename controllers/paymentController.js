import crypto from "crypto";
import Razorpay from "razorpay";
import Sprovider from "../models/providerModel.js";
import Spayment from "../models/paymentModel.js";

const CREDIT_BONUS_PERCENT = Number(process.env.CREDIT_BONUS_PERCENT || 0.05); // +5%

function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys not configured");
  }
  return new Razorpay({ key_id, key_secret });
}

export const createRazorpayOrderForCredit = async (req, res) => {
  try {
    const sprovid = req.provider?.id;
    const { amount } = req.body; // INR

    const amountInr = Number(amount);
    if (!amountInr || isNaN(amountInr) || amountInr <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    const provider = await Sprovider.findOne({ sprovid });
    if (!provider) return res.status(404).json({ success: false, message: "Provider not found" });

    const razorpay = getRazorpayClient();
    const amountPaise = Math.round(amountInr * 100);
    // Razorpay receipt must be <= 40 chars
    const receipt = `CR-${String(sprovid).slice(-8)}-${String(Date.now()).slice(-10)}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: { sprovid, purpose: "BUY_CREDIT" },
    });

    return res.status(201).json({
      success: true,
      order,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    // Razorpay SDK often returns rich error object: { error: { code, description, ... } }
    const razorpayMessage =
      e?.error?.description ||
      e?.error?.reason ||
      e?.message ||
      "Internal Server Error";

    console.error("Razorpay create-order error:", {
      message: e?.message,
      code: e?.error?.code,
      description: e?.error?.description,
      statusCode: e?.statusCode,
    });

    return res.status(500).json({
      success: false,
      message: razorpayMessage,
      code: e?.error?.code,
    });
  }
};

export const verifyRazorpayPaymentAndAddCredit = async (req, res) => {
  try {
    const sprovid = req.provider?.id;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount, // INR (for displaying) - actual amount is taken from order fetch
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment fields" });
    }

    const provider = await Sprovider.findOne({ sprovid });
    if (!provider) return res.status(404).json({ success: false, message: "Provider not found" });

    // Verify signature
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const expected = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Idempotency: if already recorded, don't add credit twice
    const existing = await Spayment.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Payment already processed",
        creditAdded: existing.creditAdded,
        providerCredit: provider.cradit_value,
      });
    }

    // Fetch order from Razorpay to trust amount
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const amountPaidInr = Number(order.amount) / 100;

    const creditAdded = Number((amountPaidInr * (1 + CREDIT_BONUS_PERCENT)).toFixed(2));
    const currentCredit = Number(provider.cradit_value) || 0;
    const newCredit = Number((currentCredit + creditAdded).toFixed(2));

    provider.cradit_value = String(newCredit);
    await provider.save();

    const spayid = `SPAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await Spayment.create({
      spayid,
      providerId: sprovid,
      providerEmail: provider.email,
      gateway: "RAZORPAY",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amountPaid: amountPaidInr,
      creditBonusPercent: CREDIT_BONUS_PERCENT,
      creditAdded,
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified, credit added",
      amountPaid: amountPaidInr,
      creditAdded,
      providerCredit: provider.cradit_value,
    });
  } catch (e) {
    const razorpayMessage =
      e?.error?.description ||
      e?.error?.reason ||
      e?.message ||
      "Internal Server Error";
    console.error("Razorpay verify error:", {
      message: e?.message,
      code: e?.error?.code,
      description: e?.error?.description,
      statusCode: e?.statusCode,
    });
    return res.status(500).json({ success: false, message: razorpayMessage, code: e?.error?.code });
  }
};

