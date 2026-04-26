import { hasActiveSubscription, getSubscriptionLimits } from "../controllers/subscriptionController.js";

/**
 * @desc    Middleware to check if provider has active subscription
 * @route   Use before protected routes
 */
export const requireSubscription = async (req, res, next) => {
  try {
    const sprovid = req.provider?.id;
    
    if (!sprovid) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const hasActive = await hasActiveSubscription(sprovid);
    
    if (!hasActive) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required. Please subscribe to access this feature.",
        code: "SUBSCRIPTION_REQUIRED",
      });
    }

    next();
  } catch (error) {
    console.error("Subscription middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * @desc    Middleware to attach subscription limits to request
 * @route   Use to get subscription limits for feature gating
 */
export const attachSubscriptionLimits = async (req, res, next) => {
  try {
    const sprovid = req.provider?.id;
    
    if (sprovid) {
      const limits = await getSubscriptionLimits(sprovid);
      req.subscriptionLimits = limits;
    }
    
    next();
  } catch (error) {
    console.error("Attach subscription limits error:", error);
    // Don't block request, just continue without limits
    req.subscriptionLimits = {
      hasSubscription: false,
      maxWorks: 0,
      maxWorkRequests: 0,
    };
    next();
  }
};

/**
 * @desc    Check if provider can perform action based on subscription limits
 * @param   action - "create_work" | "send_request" | etc.
 */
export const checkSubscriptionLimit = (action) => {
  return async (req, res, next) => {
    try {
      const sprovid = req.provider?.id;
      
      if (!sprovid) {
        return next(); // Let other auth middleware handle
      }

      const limits = await getSubscriptionLimits(sprovid);
      
      if (!limits.hasSubscription) {
        return res.status(403).json({
          success: false,
          message: "Subscription required to perform this action",
          code: "SUBSCRIPTION_REQUIRED",
        });
      }

      // Store limits for use in controller
      req.subscriptionLimits = limits;
      next();
    } catch (error) {
      console.error("Check subscription limit error:", error);
      next();
    }
  };
};