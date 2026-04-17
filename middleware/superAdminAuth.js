import jwt from "jsonwebtoken";
import SsuperAdmin from "../models/superAdminModel.js";

export const superAdminAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, "SECRET_KEY");
    const sadmid = decoded.id;

    const admin = await SsuperAdmin.findOne({ sadmid });
    if (!admin || admin.accesstoken !== token) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    req.superadmin = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

