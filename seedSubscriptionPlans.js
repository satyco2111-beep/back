import mongoose from "mongoose";
import dotenv from "dotenv";
import SsubscriptionPlan from "../models/subscriptionPlanModel.js";

dotenv.config();

const defaultPlans = [
  {
    planId: "PLAN-BASIC",
    name: "Basic",
    description: "Perfect for getting started",
    amount: 299,
    features: [
      "Up to 5 active works",
      "10 work requests per month",
      "Email support",
      "Basic analytics",
    ],
    maxWorks: 5,
    maxWorkRequests: 10,
    sortOrder: 1,
    isActive: true,
  },
  {
    planId: "PLAN-PRO",
    name: "Pro",
    description: "Best for growing businesses",
    amount: 599,
    features: [
      "Up to 20 active works",
      "Unlimited work requests",
      "Priority support",
      "Advanced analytics",
      "Custom branding",
    ],
    maxWorks: 20,
    maxWorkRequests: null,
    sortOrder: 2,
    isActive: true,
  },
  {
    planId: "PLAN-ENTERPRISE",
    name: "Enterprise",
    description: "For large teams and agencies",
    amount: 1499,
    features: [
      "Unlimited active works",
      "Unlimited work requests",
      "24/7 dedicated support",
      "Full analytics suite",
      "API access",
      "White-label options",
    ],
    maxWorks: null,
    maxWorkRequests: null,
    sortOrder: 3,
    isActive: true,
  },
];

async function seedPlans() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/dosomething";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    for (const plan of defaultPlans) {
      const existing = await SsubscriptionPlan.findOne({ planId: plan.planId });
      if (!existing) {
        await SsubscriptionPlan.create(plan);
        console.log(`Created plan: ${plan.name}`);
      } else {
        console.log(`Plan already exists: ${plan.name}`);
      }
    }

    console.log("\n✅ Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seedPlans();