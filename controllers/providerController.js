// import Sprovider from "../models/providerModel.js";

// /**
//  * @desc    Get all provider
//  * @route   GET /api/provider
//  * @access  Public / Admin
//  */
// export const getAllProvider = async (req, res) => {
//     try {
//         const providers = await Sprovider.find({}, "-password"); // exclude password field
//         return res.status(200).json({
//             success: true,
//             message: "All providers fetched successfully",
//             providers,
//         });
//     } catch (error) {
//         console.error("Error fetching users:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message,
//         });
//     }
// };

// /**
//  * @desc    Register new provider
//  * @route   POST /api/provider/register
//  * @access  Public
//  */
// export const registerProvider = async (req, res) => {
//     try {
//         const { name, email, password } = req.body;

//         // Basic validation
//         if (!name || !email || !password) {
//             return res
//                 .status(400)
//                 .json({ success: false, message: "All fields are required" });
//         }

//         // Check if user already exists
//         const existingUser = await Sprovider.findOne({ email });
//         if (existingUser) {
//             return res
//                 .status(409)
//                 .json({ success: false, message: "Email is already registered" });
//         }

//         // Generate custom user ID
//         const sprovid = `SPROVIDER-${Date.now()}`;

//         // Create and save new user
//         const newUser = await Sprovider.create({ sprovid, name, email, password });

//         // Exclude password from response
//         const userResponse = newUser.toObject();
//         delete userResponse.password;

//         return res.status(201).json({
//             success: true,
//             message: "Provider registered successfully",
//             user: userResponse,
//         });
//     } catch (error) {
//         console.error("Error registering Provider:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message,
//         });
//     }
// };


/////////////////////


import Sprovider from "../models/providerModel.js";
import Swork from "../models/workModel.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";

/**
 * @desc    Get all providers
 * @route   GET /api/provider
 * @access  Public/Admin
 */
export const getAllProvider = async (req, res) => {
    try {
        const providers = await Sprovider.find({});
        return res.status(200).json({
            success: true,
            message: "All providers fetched successfully",
            providers,
        });
    } catch (error) {
        console.error("Error fetching provider:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

/**
 * @desc    Register provider
 * @route   POST /api/provider/register
 * @access  Public
 */
export const registerProvider = async (req, res) => {
    try {
        const { name, email, password, mobile, referralCode } = req.body;

        if (!name || !email || !password || !mobile) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const existingProvider = await Sprovider.findOne({ email });
        if (existingProvider) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered",
            });
        }

        const sprovid = `SPROVIDER-${Date.now()}`;
        const accesstoken = "";
        const cradit_value = "00";
        const amount_due = "00.00";
        const sessionAccesstoken = "";
        const emailVerifyAccesstoken = `${Math.floor(
            100000 + Math.random() * 900000
        )}`;
        const emailVerify = false;

        const newProvider = await Sprovider.create({
            sprovid,
            name,
            email,
            mobile,
            password,
            cradit_value,
            amount_due,
            referralCode: undefined,
            accesstoken,
            sessionAccesstoken,
            emailVerifyAccesstoken,
            emailVerify,
        });

        // referral: link invitee provider to inviter provider (optional)
        try {
            const { createProviderReferralFromCode, ensureProviderReferralCode } = await import("./referralController.js");
            await ensureProviderReferralCode(newProvider);
            await createProviderReferralFromCode({ inviteeProvider: newProvider, referralCode });
        } catch (e) {
            // don't block registration on referral issues
        }

        await sendEmail(
            email,
            "Verify Email",
            `Your verification code is: ${emailVerifyAccesstoken}`
        );

        const providerResponse = newProvider.toObject();
        delete providerResponse.password;

        return res.status(201).json({
            success: true,
            message: "Provider registered successfully. Check your email for OTP.",
            provider: providerResponse,
        });
    } catch (error) {
        console.error("Error registering provider:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

/**
 * @desc    Verify Email
 * @route   POST /api/provider/verify-email
 * @access  Public
 */
export const verifyProviderEmail = async (req, res) => {
    try {
        const { email, password, otp } = req.body;

        if (!email || !password || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email, New Password, and OTP required",
            });
        }

        const provider = await Sprovider.findOne({ email });

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: "Provider not found",
            });
        }

        if (provider.emailVerifyAccesstoken !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        provider.emailVerify = true;
        provider.emailVerifyAccesstoken = "";
        provider.password = password;
        await provider.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
        });
    } catch (error) {
        console.error("Error verifying provider email:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

/**
 * @desc    Forgot password (Send OTP)
 * @route   POST /api/provider/forgot-password
 * @access  Public
 */
export const providerForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const provider = await Sprovider.findOne({ email });

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: "Provider not found",
            });
        }

        const otp = `${Math.floor(100000 + Math.random() * 900000)}`;

        provider.emailVerifyAccesstoken = otp;
        await provider.save();

        await sendEmail(
            email,
            "Reset Your Password",
            `Your password reset OTP is: ${otp}`
        );

        return res.status(200).json({
            success: true,
            message: "OTP sent to your email",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

/**
 * @desc    Login provider
 * @route   POST /api/provider/login
 * @access  Public
 */
export const loginProvider = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const provider = await Sprovider.findOne({ email });

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: "Provider not found",
            });
        }

        if (!provider.emailVerify) {
            return res.status(401).json({
                success: false,
                message: "Please verify your email first",
            });
        }

        const isMatch = await provider.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect password",
            });
        }

        const token = jwt.sign(
            { id: provider.sprovid, email: provider.email },
            "SECRET_KEY",
            { expiresIn: "7d" }
        );

        provider.accesstoken = token;
        await provider.save();

        const providerData = provider.toObject();
        delete providerData.password;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            provider: providerData,
        }); 
    } catch (error) {
        console.log("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

/**
 * @desc    Logout provider
 * @route   POST /api/provider/logout
 * @access  Public
 */
export const logoutProvider = async (req, res) => {
    try {
        const { sprovid } = req.body;

        const provider = await Sprovider.findOne({ sprovid });

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: "Provider not found",
            });
        }

        provider.accesstoken = "";
        await provider.save();

        return res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    } catch (error) {
        console.log("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};



//   ============   SINGLE PROVIDER ==============

export const getProviderById = async (req, res) => {
    try {
        const { sprovid } = req.params;

        if (!sprovid) {
            return res.status(400).json({
                success: false,
                message: "sprovid is required",
            });
        }

        const provider = await Sprovider.findOne({ sprovid });

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: "Provider not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Provider fetched successfully",
            provider,
        });
    } catch (error) {
        console.error("Error fetching provider by sprovid:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};




//==============verify token ======================

export const verifyProviderToken = async (req, res) => {
    const { token, id, role } = req.body;

    // Check for required fields
    if (!token || !id || !role) {
        return res.status(400).json({
            success: false,
            valid: false,
            message: "Token, id and role are required",
        });
    }

    try {
        const sprovid = id;
        const accesstoken = token;

        // Check if a user exists with this ID + token
        const user = await Sprovider.findOne({ sprovid, accesstoken });

        if (!user) {
            return res.json({
                success: false,
                valid: false,
                message: "Invalid token or user not found",
            });
        }

        return res.json({
            success: true,
            valid: true, // token matched
        });

    } catch (err) {
        return res.json({
            success: false,
            valid: false,
            message: "Error verifying token",
        });
    }
};




/**
 * @desc    Mark payment as completed
 * @route   PUT /api/provider/payment-complete/:sprovid
 * @access  Admin
 */
export const providerPaymentComplete = async (req, res) => {
    try {
        const { sprovid } = req.params;

        if (!sprovid) {
            return res.status(400).json({
                success: false,
                message: "sprovid is required",
            });
        }

        const provider = await Sprovider.findOne({ sprovid });

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: "Provider not found",
            });
        }

        provider.payment_due = false;
        provider.amount_due = "00.00";

        await provider.save();

        return res.status(200).json({
            success: true,
            message: "Payment marked as completed",
            provider,
        });
    } catch (error) {
        console.error("Payment complete error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
/**
 * @desc    Set payment due with amount
 * @route   PUT /api/provider/payment-due/:sprovid?amount=500.00
 * @access  Admin
 */
export const providerPaymentDue = async (req, res) => {
    try {
        const { sprovid } = req.params;
        const { amount } = req.query;

        if (!sprovid || !amount) {
            return res.status(400).json({
                success: false,
                message: "sprovid and amount are required",
            });
        }

        const provider = await Sprovider.findOne({ sprovid });

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: "Provider not found",
            });
        }

        provider.payment_due = true;
        provider.amount_due = amount;

        await provider.save();

        return res.status(200).json({
            success: true,
            message: "Payment due updated successfully",
            provider,
        });
    } catch (error) {
        console.error("Payment due error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};




/**
 * @desc    Update provider credit value
 * @route   PUT /api/provider/update-credit/:sprovid
 * @access  Private (recommended)
 */
export const updateProviderCredit = async (req, res) => {
    try {
        const { sprovid } = req.params;
        const { cradit_value } = req.body;

        if (cradit_value === undefined) {
            return res.status(400).json({
                success: false,
                message: "cradit_value is required",
            });
        }

        const amountToAdd = Number(cradit_value);

        if (isNaN(amountToAdd)) {
            return res.status(400).json({
                success: false,
                message: "Invalid credit value",
            });
        }

        const provider = await Sprovider.findOne({ sprovid });

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: "Provider not found",
            });
        }

        // convert existing value safely
        const currentCredit = Number(provider.cradit_value) || 0;

        // ✅ ADD instead of overwrite
        provider.cradit_value = currentCredit + amountToAdd;

        await provider.save();

        const response = provider.toObject();
        delete response.password;

        return res.status(200).json({
            success: true,
            message: "Credit added successfully",
            provider: response,
        });

    } catch (error) {
        console.error("Error updating credit:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const getProviderDashboard = async (req, res) => {
    try {
        const sprovid = req.provider.id;
        const providerDoc = await Sprovider.findOne({ sprovid }).select("-password").lean();
        if (!providerDoc) {
            return res.status(404).json({ success: false, message: "Provider not found" });
        }
        const profile = { ...providerDoc };
        delete profile.accesstoken;
        delete profile.sessionAccesstoken;
        delete profile.emailVerifyAccesstoken;

        const [totalAssigned, activeCount, completedCount, availableOpenJobs] = await Promise.all([
            Swork.countDocuments({ sprovid }),
            Swork.countDocuments({ sprovid, status: { $in: ["ACCEPTED", "STARTED"] } }),
            Swork.countDocuments({ sprovid, status: { $in: ["COMPLETED", "DONE"] } }),
            Swork.countDocuments({ status: "OPEN" }),
        ]);

        const completedWorks = await Swork.find({
            sprovid,
            status: { $in: ["COMPLETED", "DONE"] },
        }).lean();
        const totalEarnings = completedWorks.reduce((sum, w) => sum + (Number(w.price) || 0), 0);

        const creditVal = providerDoc.cradit_value;

        const [recentOpenJobs, recentActive, recentCompleted] = await Promise.all([
            Swork.find({ status: "OPEN" }).sort({ createdAt: -1 }).limit(5).lean(),
            Swork.find({ sprovid, status: { $in: ["ACCEPTED", "STARTED"] } })
                .sort({ updatedAt: -1 })
                .limit(5)
                .lean(),
            Swork.find({ sprovid, status: { $in: ["COMPLETED", "DONE"] } })
                .sort({ updatedAt: -1 })
                .limit(5)
                .lean(),
        ]);

        return res.json({
            success: true,
            profile,
            stats: {
                credit: creditVal || "0",
                payment_due: providerDoc.payment_due,
                amount_due: providerDoc.amount_due,
                totalAssigned,
                activeCount,
                completedCount,
                availableOpenJobs,
                totalEarnings: Number(totalEarnings.toFixed(2)),
            },
            recentOpenJobs,
            recentActive,
            recentCompleted,
        });
    } catch (error) {
        console.error("getProviderDashboard:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const updateProviderProfile = async (req, res) => {
    try {
        const sprovid = req.provider.id;
        const { name, mobile } = req.body;

        const provider = await Sprovider.findOne({ sprovid });
        if (!provider) {
            return res.status(404).json({ success: false, message: "Provider not found" });
        }

        if (name !== undefined && name !== null) {
            const t = String(name).trim();
            if (t) provider.name = t;
        }
        if (mobile !== undefined && mobile !== null) {
            provider.mobile = String(mobile).trim();
        }

        await provider.save();
        const p = provider.toObject();
        delete p.password;
        delete p.accesstoken;
        delete p.sessionAccesstoken;
        delete p.emailVerifyAccesstoken;
        return res.json({ success: true, provider: p });
    } catch (error) {
        console.error("updateProviderProfile:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @desc    Update provider service, city, local area and live status
 * @route   PUT /api/providers/provider/:sprovid
 * @access  Private
 */
export const updateProvider = async (req, res) => {
    try {
        const { sprovid } = req.params;
        const updates = {};

        if (req.body.islive !== undefined) {
            const isGoingLive = !!req.body.islive;
            updates.islive = isGoingLive;

            // When going offline, clear service, city, and local area
            if (!isGoingLive) {
                updates.ssrvcid = null;
                updates.sctyid = null;
                updates.sloctyid = null;
            }
        }

        // Only update service, city, local area if provider is going/staying live
        if (req.body.islive !== false) {
            if (req.body.ssrvcid !== undefined) updates.ssrvcid = req.body.ssrvcid;
            if (req.body.sctyid !== undefined) updates.sctyid = req.body.sctyid;
            if (req.body.sloctyid !== undefined) updates.sloctyid = req.body.sloctyid;
        }

        const provider = await Sprovider.findOneAndUpdate(
            { sprovid },
            updates,
            { new: true }
        );

        if (!provider) {
            return res.status(404).json({ success: false, message: "Provider not found" });
        }

        const p = provider.toObject();
        delete p.password;
        delete p.accesstoken;
        delete p.sessionAccesstoken;
        delete p.emailVerifyAccesstoken;

        return res.json({ success: true, provider: p });
    } catch (error) {
        console.error("updateProvider:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @desc    Get live providers with filters by service, city, and local area
 * @route   GET /api/providers/live?ssrvcid=&sctyid=&sloctyid=
 * @access  Public
 */
export const getLiveProviders = async (req, res) => {
    try {
        const { ssrvcid, sctyid, sloctyid } = req.query;
        const query = { islive: true };

        if (ssrvcid) query.ssrvcid = ssrvcid;
        if (sctyid) query.sctyid = sctyid;
        if (sloctyid) query.sloctyid = sloctyid;

        const providers = await Sprovider.find(query, "-password -accesstoken -sessionAccesstoken -emailVerifyAccesstoken");
        const count = providers.length;

        return res.status(200).json({
            success: true,
            count,
            providers,
        });
    } catch (error) {
        console.error("Error fetching live providers:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};