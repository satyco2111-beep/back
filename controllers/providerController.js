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
        const { name, email, password,mobile } = req.body;

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
            amount_due,
            accesstoken,
            sessionAccesstoken,
            emailVerifyAccesstoken,
            emailVerify,
        });

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