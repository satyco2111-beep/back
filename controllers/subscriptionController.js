import crypto from "crypto";
import Razorpay from "razorpay";
import Ssubscription from "../models/subscriptionModel.js";
import SsubscriptionPlan from "../models/subscriptionPlanModel.js";
import Sprovider from "../models/providerModel.js";

const CREDIT_BONUS_PERCENT = Number(process.env.CREDIT_BONUS_PERCENT || 0.05);

function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys not configured");
  }
  return new Razorpay({ key_id, key_secret });
}

// =====================
// PLAN MANAGEMENT
// =====================

/**
 * @desc    Get all subscription plans
 * @route   GET /api/subscription/plans
 * @access  Public
 */
export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SsubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1, amount: 1 });
    
    return res.status(200).json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * @desc    Create a subscription plan (admin only)
 * @route   POST /api/subscription/plans
 * @access  Private (Admin)
 */
export const createSubscriptionPlan = async (req, res) => {
  try {
    const { name, description, amount, features, maxWorks, maxWorkRequests, sortOrder } = req.body;

    if (!name || !amount) {
      return res.status(400).json({ success: false, message: "Name and amount are required" });
    }

    const planId = `PLAN-${Date.now()}`;
    
    // Try to create Razorpay plan (optional - can work without it)
    let razorpayPlanId = null;
    try {
      const razorpay = getRazorpayClient();
      const rpPlan = await razorpay.plans.create({
        period: "monthly",
        interval: 1,
        item: {
          name,
          amount: Math.round(amount * 100), // in paise
          currency: "INR",
        },
      });
      razorpayPlanId = rpPlan.id;
    } catch (rpError) {
      console.warn("Could not create Razorpay plan, using local only:", rpError.message);
    }
 
    const plan = await SsubscriptionPlan.create({
      planId,
      name,
      description,
      amount,
      features: features || [],
      maxWorks,
      maxWorkRequests,
      razorpayPlanId,
      sortOrder: sortOrder || 0,
      periodDays: 30,
      billingPeriod: "MONTHLY",
    });

    return res.status(201).json({
      success: true,
      message: "Subscription plan created",
      plan,
    });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =====================
// SUBSCRIPTION MANAGEMENT
// =====================

/**
 * @desc    Get provider's current subscription
 * @route   GET /api/subscription/current
 * @access  Private (Provider)
 */
export const getCurrentSubscription = async (req, res) => {
  try {
    const sprovid = req.provider?.id;
    if (!sprovid) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const subscription = await Ssubscription.findOne({
      sprovid,
      status: "ACTIVE",
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(200).json({
        success: true,
        subscription: null,
        hasActiveSubscription: false,
      });
    }

    // Get plan details
    const plan = await SsubscriptionPlan.findOne({ planId: subscription.planId });

    return res.status(200).json({
      success: true,
      subscription,
      plan,
      hasActiveSubscription: true,
    });
  } catch (error) {
    console.error("Error fetching current subscription:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * @desc    Create subscription checkout
 * @route   POST /api/subscription/create
 * @access  Private (Provider)
 */
export const createSubscription = async (req, res) => {
  try {
    const sprovid = req.provider?.id;
    const { planId } = req.body;

    if (!sprovid) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!planId) {
      return res.status(400).json({ success: false, message: "Plan ID is required" });
    }

    // Get plan details
    const plan = await SsubscriptionPlan.findOne({ planId });
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    // Check if already has active subscription
    const existingSub = await Ssubscription.findOne({
      sprovid,
      status: "ACTIVE",
    });

    if (existingSub) {
      return res.status(400).json({
        success: false,
        message: "You already have an active subscription",
        subscription: existingSub,
      });
    }

    const provider = await Sprovider.findOne({ sprovid });
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const razorpay = getRazorpayClient();

    // Create or get customer
    let customerId = provider.razorpayCustomerId;
    if (!customerId) {
      const customer = await razorpay.customers.create({
        email: provider.email,
        phone: provider.mobile,
        name: provider.name,
        reference_id: sprovid,
      });
      customerId = customer.id;
      
      // Save customer ID to provider
      provider.razorpayCustomerId = customerId;
      await provider.save();
    }

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      customer_id: customerId,
      total_count: 12, // 12 months max
      notes: {
        sprovid,
        planName: plan.name,
      },
    });

    // Create local subscription record
    const ssubid = `SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await Ssubscription.create({
      ssubid,
      sprovid,
      planId: plan.planId,
      planName: plan.name,
      razorpaySubscriptionId: subscription.id,
      razorpayCustomerId: customerId,
      status: "ACTIVE",
      amount: plan.amount,
      razorpayPlanId: plan.razorpayPlanId,
      startDate,
      endDate,
      nextBillingDate: endDate,
    });

    return res.status(201).json({
      success: true,
      message: "Subscription created",
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    
    // If Razorpay plan doesn't exist, create subscription without it
    if (error.error?.code === "BAD_REQUEST" && error.error?.reason?.includes("plan_id")) {
      return res.status(400).json({
        success: false,
        message: "This plan is not available for subscription. Please contact support.",
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * @desc    Cancel subscription
 * @route   PUT /api/subscription/cancel
 * @access  Private (Provider)
 */
export const cancelSubscription = async (req, res) => {
  try {
    const sprovid = req.provider?.id;

    const subscription = await Ssubscription.findOne({
      sprovid,
      status: "ACTIVE",
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    // Cancel in Razorpay
    if (subscription.razorpaySubscriptionId) {
      try {
        const razorpay = getRazorpayClient();
        await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, {
          cancel_at_cycle_end: true,
        });
      } catch (rpError) {
        console.warn("Could not cancel Razorpay subscription:", rpError.message);
      }
    }

    // Update local record
    subscription.cancelAtCycleEnd = true;
    subscription.status = "CANCELLED";
    subscription.cancelledAt = new Date();
    await subscription.save();

    return res.status(200).json({
      success: true,
      message: "Subscription will be cancelled at the end of current billing cycle",
      subscription,
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * @desc    Get subscription history
 * @route   GET /api/subscription/history
 * @access  Private (Provider)
 */
export const getSubscriptionHistory = async (req, res) => {
  try {
    const sprovid = req.provider?.id;

    const subscriptions = await Ssubscription.find({ sprovid })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    console.error("Error fetching subscription history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =====================
// WEBHOOK HANDLING
// =====================

/**
 * @desc    Handle Razorpay webhooks
 * @route   POST /api/subscription/webhook
 * @access  Webhook (Razorpay)
 */
export const handleSubscriptionWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
      return res.status(400).json({ success: false, message: "Missing webhook signature" });
    }

    // Verify webhook signature
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid webhook signature");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const event = req.body;
    const eventType = event.event;
    const payload = event.payload?.subscription || event.payload?.payment;

    console.log("Subscription webhook received:", eventType);

    switch (eventType) {
      case "subscription.activated":
        await processSubscriptionActivated(payload);
        break;
      case "subscription.cancelled":
        await processSubscriptionCancelled(payload);
        break;
      case "subscription.paused":
        await processSubscriptionPaused(payload);
        break;
      case "subscription.resumed":
        await processSubscriptionResumed(payload);
        break;
      case "subscription.charged":
        await processSubscriptionCharged(payload);
        break;
      case "subscription.failed":
        await processSubscriptionFailed(payload);
        break;
      default:
        console.log("Unhandled subscription event:", eventType);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
};

// Helper functions for webhook processing
async function processSubscriptionActivated(payload) {
  const subscriptionId = payload.id;
  const subscription = await Ssubscription.findOne({ razorpaySubscriptionId: subscriptionId });
  
  if (subscription) {
    subscription.status = "ACTIVE";
    await subscription.save();
    console.log("Subscription activated:", subscriptionId);
  }
}

async function processSubscriptionCancelled(payload) {
  const subscriptionId = payload.id;
  const subscription = await Ssubscription.findOne({ razorpaySubscriptionId: subscriptionId });
  
  if (subscription) {
    subscription.status = "EXPIRED";
    await subscription.save();
    console.log("Subscription cancelled:", subscriptionId);
  }
}

async function processSubscriptionPaused(payload) {
  const subscriptionId = payload.id;
  const subscription = await Ssubscription.findOne({ razorpaySubscriptionId: subscriptionId });
  
  if (subscription) {
    subscription.status = "SUSPENDED";
    await subscription.save();
    console.log("Subscription paused:", subscriptionId);
  }
}

async function processSubscriptionResumed(payload) {
  const subscriptionId = payload.id;
  const subscription = await Ssubscription.findOne({ razorpaySubscriptionId: subscriptionId });
  
  if (subscription) {
    subscription.status = "ACTIVE";
    await subscription.save();
    console.log("Subscription resumed:", subscriptionId);
  }
}

async function processSubscriptionCharged(payload) {
  const subscriptionId = payload.id;
  const subscription = await Ssubscription.findOne({ razorpaySubscriptionId: subscriptionId });
  
  if (subscription) {
    subscription.totalCyclesBilled += 1;
    
    // Update next billing date
    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    subscription.nextBillingDate = nextBilling;
    
    await subscription.save();
    console.log("Subscription charged:", subscriptionId);
  }
}

async function processSubscriptionFailed(payload) {
  const subscriptionId = payload.id;
  const subscription = await Ssubscription.findOne({ razorpaySubscriptionId: subscriptionId });
  
  if (subscription) {
    subscription.status = "PAST_DUE";
    await subscription.save();
    console.log("Subscription payment failed:", subscriptionId);
  }
}

// =====================
// MIDDLEWARE HELPER
// =====================

/**
 * @desc    Check if provider has active subscription
 * @access  Internal utility
 */
export const hasActiveSubscription = async (sprovid) => {
  const subscription = await Ssubscription.findOne({
    sprovid,
    status: "ACTIVE",
  });
  return !!subscription;
};

/**
 * @desc    Get subscription limits for provider
 * @access  Internal utility
 */
export const getSubscriptionLimits = async (sprovid) => {
  const subscription = await Ssubscription.findOne({
    sprovid,
    status: "ACTIVE",
  });
  
  if (!subscription) {
    return {
      hasSubscription: false,
      maxWorks: 0,
      maxWorkRequests: 0,
    };
  }
  
  const plan = await SsubscriptionPlan.findOne({ planId: subscription.planId });
  
  return {
    hasSubscription: true,
    maxWorks: plan?.maxWorks || null,
    maxWorkRequests: plan?.maxWorkRequests || null,
    planName: subscription.planName,
    subscriptionStatus: subscription.status,
  };
};