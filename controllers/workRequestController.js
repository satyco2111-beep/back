import SworkRequest from "../models/workRequestModel.js";
import Swork from "../models/workModel.js";
import Sprovider from "../models/providerModel.js";


/**
 * @desc    Send a work request to a provider
 * @route   POST /api/work-requests/send
 * @access  Private (Users only)
 */
export const sendWorkRequest = async (req, res) => {
  try {
    const { swrid, sprovid, message } = req.body;
    const suid = req.body.suid; // User ID from request

    // Validate required fields
    if (!swrid || !sprovid || !suid) {
      return res.status(400).json({
        success: false,
        message: "Work ID, Provider ID, and User ID are required",
      });
    }

    // Check if work exists and is in OPEN status
    const work = await Swork.findOne({ swrid });
    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }

    if (work.status !== "OPEN") {
      return res.status(400).json({
        success: false,
        message: `Cannot request work. Work status is ${work.status}, only OPEN works can receive requests.`,
      });
    }

    // Check if user is the one who posted the work
    if (work.suid !== suid) {
      return res.status(403).json({
        success: false,
        message: "You can only request providers for your own work",
      });
    }

    // Check if user already has a PENDING request for this work (to ANY provider)
    const existingPendingRequest = await SworkRequest.findOne({
      swrid,
      suid,
      status: "PENDING",
    });

    if (existingPendingRequest) {
      return res.status(409).json({
        success: false,
        message: `You already have a pending request for this work. Please wait for the response or cancel the existing request to ${existingPendingRequest.sprovid} before requesting another provider.`,
      });
    }

    // Check if a request already exists to THIS specific provider for this work
    const existingRequestToProvider = await SworkRequest.findOne({
      swrid,
      sprovid,
      suid,
      status: { $in: ["PENDING", "ACCEPTED"] },
    });

    if (existingRequestToProvider) {
      return res.status(409).json({
        success: false,
        message: "You have already sent a request to this provider for this work",
      });
    }

    // Create the work request
    const srequestid = `WREQ-${Date.now()}`;
    const newRequest = await SworkRequest.create({
      srequestid,
      swrid,
      suid,
      sprovid,
      message: message || "",
      status: "PENDING",
    });

    work.status = "REQUESTED";
    await work.save();

    return res.status(201).json({
      success: true,
      message: "Work request sent successfully",
      request: newRequest,
    });
  } catch (error) {
    console.error("Error sending work request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Get pending requests for a provider
 * @route   GET /api/work-requests/provider/:sprovid
 * @access  Private (Providers only)
 */
export const getProviderRequests = async (req, res) => {
  try {
    const { sprovid } = req.params;

    const requests = await SworkRequest.find({ sprovid, status: "PENDING" })
      .sort({ createdAt: -1 });

    // Populate work details
    const populatedRequests = await Promise.all(
      requests.map(async (req) => {
        const work = await Swork.findOne({ swrid: req.swrid });
        return {
          ...req.toObject(),
          work,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: populatedRequests.length,
      requests: populatedRequests,
    });
  } catch (error) {
    console.error("Error fetching provider requests:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all requests for a specific user's work
 * @route   GET /api/work-requests/work/:swrid
 * @access  Private (Users only)
 */
export const getWorkRequests = async (req, res) => {
  try {
    const { swrid } = req.params;

    const requests = await SworkRequest.find({ swrid })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Error fetching work requests:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Accept a work request
 * @route   PUT /api/work-requests/accept/:srequestid
 * @access  Private (Providers only)
 */
export const acceptWorkRequest = async (req, res) => {
  try {
    const { srequestid } = req.params;

    const request = await SworkRequest.findOne({ srequestid });
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot accept request with status ${request.status}`,
      });
    }

    // Update request status
    // request.status = "ACCEPTED";
    // request.respondedAt = new Date();
    // await request.save();


    // =================work acsep acordig to cradit=======================
           const swrid= request.swrid;
           const authedProviderId = request.sprovid; // Provider ID from the request (should match authenticated provider)
            const work = await Swork.findOne({ swrid });
            if (!work) {
                return res.status(404).json({
                    success: false,
                    message: "Work not found",
                });
            }
    
            // Accept flow: bind provider from token, check due + credit, then deduct credit request
            // if (status === "ACCEPTED") {
                if (work.status && work.status !== "REQUESTED") {
                    return res.status(400).json({
                        success: false,
                        message: "Work is not REQUESTED for acceptance",
                    });
                }
    
                const provider = await Sprovider.findOne({ sprovid: authedProviderId });
                if (!provider) {
                    return res.status(404).json({
                        success: false,
                        message: "Provider not found",
                    });
                }
    
                if (provider.payment_due === true) {
                    return res.status(400).json({
                        success: false,
                        message: "Please complete work first",
                    });
                }
    
                const currentCredit = Number(provider.cradit_value) || 0;
                const creditToDeduct = (Number(work.price) || 0) * 0.10;
                const remainingCredit = currentCredit - creditToDeduct;
    
                if (remainingCredit < 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Insufficient credit. Cannot accept this work.",
                    });
                }
    
                provider.cradit_value = Number(remainingCredit.toFixed(2));
                provider.payment_due = true;
                provider.amount_due = 10;
                await provider.save();
    
                // bind work to authenticated provider
                work.sprovid = authedProviderId;
            // }


    // ========================================
        // provider.payment_due = true;
        // provider.amount_due = amount;
    // Update work: set provider ID and change status to ACCEPTED

    await Swork.findOneAndUpdate(
      { swrid: request.swrid },
      { sprovid: request.sprovid, status: "ACCEPTED"},
      { new: true }
    );

    request.status = "ACCEPTED";
    request.respondedAt = new Date();
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Work request accepted successfully",
      request,
    });
  } catch (error) {
    console.error("Error accepting work request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Reject a work request
 * @route   PUT /api/work-requests/reject/:srequestid
 * @access  Private (Providers only)
 */
export const rejectWorkRequest = async (req, res) => {
  try {
    const { srequestid } = req.params;

    const request = await SworkRequest.findOne({ srequestid });
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status ${request.status}`,
      });
    }

       const swrid = request.swrid;
        const work = await Swork.findOne({ swrid });
        work.status = "OPEN";
        await work.save();

    // Update request status
    request.status = "REJECTED";
    request.respondedAt = new Date();
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Work request rejected successfully",
      request,
    });
  } catch (error) {
    console.error("Error rejecting work request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Cancel a work request (user can cancel their sent request)
 * @route   PUT /api/work-requests/cancel/:srequestid
 * @access  Private (Users only)
 */
export const cancelWorkRequest = async (req, res) => {
  try {
    const { srequestid } = req.params;

    const request = await SworkRequest.findOne({ srequestid });
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel request with status ${request.status}`,
      });
    }


        const swrid = request.swrid;
        const work = await Swork.findOne({ swrid });
        work.status = "OPEN";
        await work.save();

    // Update request status
    request.status = "CANCELLED";
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Work request cancelled successfully",
      request,
    });
  } catch (error) {
    console.error("Error cancelling work request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Get sent requests for a user
 * @route   GET /api/work-requests/user/:suid
 * @access  Private (Users only)
 */
export const getUserSentRequests = async (req, res) => {
  try {
    const { suid } = req.params;

    const requests = await SworkRequest.find({ suid })
      .sort({ createdAt: -1 });

    // Populate work details
    const populatedRequests = await Promise.all(
      requests.map(async (req) => {
        const work = await Swork.findOne({ swrid: req.swrid });
        return {
          ...req.toObject(),
          work,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: populatedRequests.length,
      requests: populatedRequests,
    });
  } catch (error) {
    console.error("Error fetching user requests:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Mark a request as seen by provider
 * @route   PUT /api/work-requests/mark-seen/:srequestid
 * @access  Private (Providers only)
 */
export const markRequestAsSeen = async (req, res) => {
  try {
    const { srequestid } = req.params;

    const request = await SworkRequest.findOne({ srequestid });
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Mark as seen
    request.isSeen = true;
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Request marked as seen",
      request,
    });
  } catch (error) {
    console.error("Error marking request as seen:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
