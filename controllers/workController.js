import Swork from "../models/workModel.js";
import Sprovider from "../models/providerModel.js";
import SsubscriptionMeProvider from "../models/subscriptionModelMeProvider.js";
import { rewardProviderInviterForFirstAccept, rewardUserInviterForWorkAccepted } from "./referralController.js";


/**
 * @desc    Get all works
 * @route   GET /api/works
 * @access  Public / Admin
 * // /api/works?page=1&limit=10&city=cityId&locality=localityId&minPrice=100&maxPrice=500&title=Design
 */



export const getAllWorks = async (req, res) => {
    try {
        const {
            status,
            service,
            title,
            city,
            local,
            page = 1,
            limit = 6,
        } = req.query;

        const query = {};

        if (status) query.status = status;
        if (service) query.ssrvcid = service;
        if (city) query.sctyid = city;
        if (local) query.sloctyid = local;
        if (title) query.title = { $regex: title, $options: "i" };

        const skip = (page - 1) * limit;

        const total = await Swork.countDocuments(query);
        const works = await Swork.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            works,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};



/**
 * @desc    Get a single work by ID
 * @route   GET /api/works/:id
 * @access  Public
 */
export const getSingleWork = async (req, res) => {
    const { id } = req.params;
    const swrid = id;
    try {
        const work = await Swork.findOne({ swrid });
        if (!work) {
            return res.status(404).json({
                success: false,
                message: "Work not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Work fetched successfully",
            work,
        });
    } catch (error) {
        console.error("Error fetching work:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

/**
 * @desc    Register new work
 * @route   POST /api/works/register
 * @access  Public 
 */
export const registerWork = async (req, res) => {
    try {
        const { title, description, sctyid, sloctyid, ssrvcid, status, paymentStatus, price, suid, sprovid } = req.body;

        // Basic validation
        if (!title || !sctyid || !sloctyid || !ssrvcid || !suid || !price) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Generate custom work ID
        const swrid = `SWORK-${Date.now()}`;

        // Create and save new work
        const newWork = await Swork.create({ swrid, title, description, sctyid, sloctyid, ssrvcid, status, paymentStatus, price, suid, sprovid });

        // Exclude sensitive data from response if needed
        const workResponse = newWork.toObject();

        return res.status(201).json({
            success: true,
            message: "Work registered successfully",
            work: workResponse,
        });
    } catch (error) {
        console.error("Error registering work:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

/**
 * @desc    Update an existing work
 * @route   PUT /api/works/:id
 * @access  Public / Admin
 */
export const updateWork = async (req, res) => {
    const { id } = req.params;
    const swrid = id;
    const { title, description, sctyid, sloctyid, ssrvcid, status, paymentStatus, price, suid, sprovid } = req.body;

    try {
        const providerOnlyStatuses = new Set(["ACCEPTED", "STARTED", "COMPLETED", "DONE"]);

        const authedProviderId = req.provider?.id || null;
        const authedUserId = req.user?.id || null;

        // Provider lifecycle actions must be authenticated as provider
        if (status && providerOnlyStatuses.has(status) && !authedProviderId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const work = await Swork.findOne({ swrid });
        if (!work) {
            return res.status(404).json({
                success: false,
                message: "Work not found",
            });
        }

        // Accept flow: bind provider from token, check due + credit, then deduct credit
        if (status === "ACCEPTED") {
            if (work.status && work.status !== "OPEN") {
                return res.status(400).json({
                    success: false,
                    message: "Work is not open for acceptance",
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

            //     const existingSub = await SsubscriptionMeProvider.findOne({
            //       sprovid: authedProviderId,
            //       status: "ACTIVE",
            //     });

            // const currentCredit = Number(provider.cradit_value) || 0;
            // let creditToDeduct = (Number(work.price) || 0) * 0.10; 
            // if(existingSub){
                
            //     creditToDeduct =(Number(work.price) || 0) * 0.06; 
            // }
            // const remainingCredit = currentCredit - creditToDeduct;

                 const existingSub = await SsubscriptionMeProvider.findOne({
                sprovid: authedProviderId,
                status: "ACTIVE",
                });

                // Ensure numeric price
                const workPrice = Number(work.price) || 0;

                // Default = 10%
                let deductionRate = 0.10;

                // If subscription exists → 6%
                if (existingSub) {
                deductionRate = 0.06;
                }

                // Final credit deduction
                const creditToDeduct = workPrice * deductionRate;

                const currentCredit = Number(provider.cradit_value) || 0;
                const remainingCredit = currentCredit - creditToDeduct;

            if (remainingCredit < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient credit. Cannot accept this work.",
                });
            }

            provider.cradit_value = Number(remainingCredit.toFixed(2));
            await provider.save();



            // bind work to authenticated provider
            work.sprovid = authedProviderId;
        }

        // Cancel flow: can be triggered by assigned provider or work owner.
        // It should unassign provider and reset provider due.
        if (status === "CANCELED" || status === "CANCELLED") {
            const isAssignedProviderCancelling =
                !!authedProviderId && !!work.sprovid && work.sprovid === authedProviderId;
            const isOwnerUserCancelling = !!authedUserId && work.suid === authedUserId;

            if ((authedProviderId || authedUserId) && !isAssignedProviderCancelling && !isOwnerUserCancelling) {
                return res.status(403).json({
                    success: false,
                    message: "You are not allowed to cancel this work",
                });
            }

            if (work.sprovid) {
                const assignedProvider = await Sprovider.findOne({ sprovid: work.sprovid });
                if (assignedProvider) {
                    assignedProvider.payment_due = false;
                    assignedProvider.amount_due = "00.00";
                    await assignedProvider.save();
                }
            }

            work.sprovid = "";
            work.status = "CANCELED";
        }

        // Reopen flow: only work owner can reopen their cancelled work
        if (status === "OPEN") {
            if (authedUserId && work.suid !== authedUserId) {
                return res.status(403).json({
                    success: false,
                    message: "You are not allowed to reopen this work",
                });
            }

            work.sprovid = "";
            work.status = "OPEN";
        }

        // Update the work with new data
        work.title = title || work.title;
        work.description = description || work.description;
        work.sctyid = sctyid || work.sctyid;
        work.sloctyid = sloctyid || work.sloctyid;
        work.ssrvcid = ssrvcid || work.ssrvcid;
        if (!["CANCELED", "CANCELLED", "OPEN"].includes(status)) {
            work.status = status || work.status;
        }
        work.paymentStatus = paymentStatus || work.paymentStatus;
        work.price = price || work.price;
        work.suid = suid || work.suid;

        // Do not allow client to spoof provider id on provider-authenticated requests
        if (!authedProviderId) {
            // for legacy/admin usage (unauthed route), keep previous behavior
            work.sprovid = sprovid || work.sprovid;
        }

        await work.save();

        // Referral rewards (best-effort, non-blocking)
        if (status === "ACCEPTED") {
            Promise.resolve()
                .then(() => rewardUserInviterForWorkAccepted(work.suid, work.price))
                .then(() => rewardProviderInviterForFirstAccept(authedProviderId))
                .catch(() => {});
        }

        return res.status(200).json({
            success: true,
            message: "Work updated successfully",
            work,
        });
    } catch (error) {
        console.error("Error updating work:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

/**
 * @desc    Increase work price by predefined amounts
 * @route   PUT /api/works/increase-price/:id
 * @access  Private (User who posted the work)
 */
export const increaseWorkPrice = async (req, res) => {
    const { id } = req.params;
    const swrid = id;
    const { increaseBy } = req.body;

    // Valid increase amounts
    const validAmounts = [10, 30, 50, 100];
    
    if (!increaseBy || !validAmounts.includes(Number(increaseBy))) {
        return res.status(400).json({
            success: false,
            message: `Invalid amount. Choose from: ${validAmounts.join(", ")}`,
        });
    }

    try {
        const work = await Swork.findOne({ swrid });
        if (!work) {
            return res.status(404).json({
                success: false,
                message: "Work not found",
            });
        }

        // Only allow price increase for OPEN or REQUESTED works
        if (!["OPEN", "REQUESTED"].includes(work.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot increase price. Work status is ${work.status}`,
            });
        }

        // Parse current price and add increase
        const currentPrice = Number(work.price) || 0;
        const newPrice = currentPrice + Number(increaseBy);

        work.price = String(newPrice);
        await work.save();

        return res.status(200).json({
            success: true,
            message: `Price increased by ₹${increaseBy}`,
            work,
            previousPrice: currentPrice,
            newPrice: newPrice,
        });
    } catch (error) {
        console.error("Error increasing work price:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

/**
 * @desc    Delete a work by ID
 * @route   DELETE /api/works/:id
 * @access  Admin
 */
export const deleteWork = async (req, res) => {
    const { id } = req.params;
    const swrid = id;
    try {
        const work = await Swork.findOne({ swrid });
        if (!work) {
            return res.status(404).json({
                success: false,
                message: "Work not found",
            });
        }

        await Swork.deleteOne({ swrid });

        return res.status(200).json({
            success: true,
            message: "Work deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting work:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};



// export const getWorksByUser = async (req, res) => {
//   const { id } = req.params;
//   const works = await Swork.find({ suid: id }).sort({ updatedAt: -1 });
//   res.json({ success: true, works });
// };


// export const getWorksByProvider = async (req, res) => {
//   const { id } = req.params;
//   const works = await Swork.find({ sprovid: id }) .sort({ updatedAt: -1 }) ;
//   res.json({ success: true, works });
// };

export const getWorksByUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 6 } = req.query;

        const query = { suid: id };
        const skip = (page - 1) * limit;

        const total = await Swork.countDocuments(query);
        const works = await Swork.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            works,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const getWorksByProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 6 } = req.query;

        const query = { sprovid: id };
        const skip = (page - 1) * limit;

        const total = await Swork.countDocuments(query);
        const works = await Swork.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            works,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// =============== By user cancele =======================================

export const byUserCanceleWork = async (req, res) => {
    const { id } = req.params;
    const swrid = id;
    const { title, description, sctyid, sloctyid, ssrvcid, status, paymentStatus, price, suid, sprovid } = req.body;

    try {
        // const work = await Swork.findById(id);
        const work = await Swork.findOne({ swrid });
        if (!work) {
            return res.status(404).json({
                success: false,
                message: "Work not found",
            });
        }

        if (work.sprovid) {
            const assignedProvider = await Sprovider.findOne({ sprovid: work.sprovid });
            if (assignedProvider) {
                assignedProvider.payment_due = false;
                assignedProvider.amount_due = "00.00";
                await assignedProvider.save();
            }
        }

        // Update the work with new data
        work.title = title || work.title;
        work.description = description || work.description;
        work.sctyid = sctyid || work.sctyid;
        work.sloctyid = sloctyid || work.sloctyid;
        work.ssrvcid = ssrvcid || work.ssrvcid;
        work.status = "CANCELED";
        work.paymentStatus = paymentStatus || work.paymentStatus;
        work.price = price || work.price;
        work.suid = suid || work.suid;
        work.sprovid = "";

        await work.save();

        return res.status(200).json({
            success: true,
            message: "Work updated successfully",
            work,
        });
    } catch (error) {
        console.error("Error updating work:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};




