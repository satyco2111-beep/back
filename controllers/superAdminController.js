import jwt from "jsonwebtoken";
import { getPaginationQuery, paginationMeta } from "../utils/pagination.js";
import SsuperAdmin from "../models/superAdminModel.js";
import Suser from "../models/suserModel.js";
import Sprovider from "../models/providerModel.js";
import Swork from "../models/workModel.js";
import Scity from "../models/cityModel.js";
import SlocalAria from "../models/localAriaModel.js";
import Sservices from "../models/servicesModel.js";

export async function ensureDefaultSuperAdmin() {
  const email = (process.env.SUPERADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD || "";

  if (!email || !password) return;

  const existing = await SsuperAdmin.findOne({ email });
  if (existing) return;

  const sadmid = `SADMIN-${Date.now()}`;
  await SsuperAdmin.create({ sadmid, email, password, name: "Super Admin", accesstoken: "" });
  console.log("✅ Default super admin created:", email);
}

export const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const admin = await SsuperAdmin.findOne({ email: String(email).trim().toLowerCase() });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const ok = await admin.comparePassword(password);
    if (!ok) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    const token = jwt.sign({ id: admin.sadmid, email: admin.email }, "SECRET_KEY", { expiresIn: "7d" });
    admin.accesstoken = token;
    await admin.save();

    return res.json({
      success: true,
      token,
      admin: { sadmid: admin.sadmid, email: admin.email, name: admin.name },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const superAdminLogout = async (req, res) => {
  try {
    const sadmid = req.superadmin?.id;
    if (!sadmid) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    await SsuperAdmin.updateOne({ sadmid }, { $set: { accesstoken: "" } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const superAdminDashboard = async (req, res) => {
  try {
    const [users, providers, works, cities, locals, services] = await Promise.all([
      Suser.countDocuments({}),
      Sprovider.countDocuments({}),
      Swork.countDocuments({}),
      Scity.countDocuments({}),
      SlocalAria.countDocuments({}),
      Sservices.countDocuments({}),
    ]);

    return res.json({
      success: true,
      stats: { users, providers, works, cities, locals, services },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const adminListUsers = async (req, res) => {
  const { page, limit, skip } = getPaginationQuery(req);
  const total = await Suser.countDocuments({});
  const users = await Suser.find({}, "-password").sort({ createdAt: -1 }).skip(skip).limit(limit);
  return res.json({ success: true, users, pagination: paginationMeta(page, limit, total) });
};

export const adminDeleteUser = async (req, res) => {
  const { suid } = req.params;
  await Suser.deleteOne({ suid });
  await Swork.deleteMany({ suid }); // remove their works too
  return res.json({ success: true });
};

export const adminListProviders = async (req, res) => {
  const { page, limit, skip } = getPaginationQuery(req);
  const total = await Sprovider.countDocuments({});
  const providers = await Sprovider.find({}, "-password").sort({ createdAt: -1 }).skip(skip).limit(limit);
  return res.json({ success: true, providers, pagination: paginationMeta(page, limit, total) });
};

export const adminDeleteProvider = async (req, res) => {
  const { sprovid } = req.params;
  await Sprovider.deleteOne({ sprovid });
  // Unassign works (keep history)
  await Swork.updateMany({ sprovid }, { $set: { sprovid: "" } });
  return res.json({ success: true });
};

export const adminListWorks = async (req, res) => {
  const { page, limit, skip } = getPaginationQuery(req);
  const total = await Swork.countDocuments({});
  const works = await Swork.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit);
  return res.json({ success: true, works, pagination: paginationMeta(page, limit, total) });
};

export const adminDeleteWork = async (req, res) => {
  const { swrid } = req.params;
  await Swork.deleteOne({ swrid });
  return res.json({ success: true });
};

export const adminUpdateWork = async (req, res) => {
  const { swrid } = req.params;
  const patch = req.body || {};
  const work = await Swork.findOne({ swrid });
  if (!work) return res.status(404).json({ success: false, message: "Work not found" });

  // allow updating common fields
  const allowed = ["title", "description", "status", "paymentStatus", "price", "sctyid", "sloctyid", "ssrvcid", "suid", "sprovid"];
  for (const k of allowed) {
    if (patch[k] !== undefined) work[k] = patch[k];
  }
  await work.save();
  return res.json({ success: true, work });
};

// City
export const adminCreateCity = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "name is required" });
  const sctyid = `SCITY-${Date.now()}`;
  const city = await Scity.create({ sctyid, name });
  return res.status(201).json({ success: true, city });
};
export const adminDeleteCity = async (req, res) => {
  const { sctyid } = req.params;
  await Scity.deleteOne({ sctyid });
  return res.json({ success: true });
};

// Local area
export const adminCreateLocal = async (req, res) => {
  const { name, sctyid } = req.body;
  if (!name || !sctyid) return res.status(400).json({ success: false, message: "name and sctyid required" });
  const sloctyid = `SLOCALCITY-${Date.now()}`;
  const local = await SlocalAria.create({ sloctyid, sctyid, name });
  return res.status(201).json({ success: true, local });
};
export const adminDeleteLocal = async (req, res) => {
  const { sloctyid } = req.params;
  await SlocalAria.deleteOne({ sloctyid });
  return res.json({ success: true });
};

// Services
export const adminCreateService = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "name is required" });
  const ssrvcid = `SSERVICES-${Date.now()}`;
  const service = await Sservices.create({ ssrvcid, name });
  return res.status(201).json({ success: true, service });
};
export const adminDeleteService = async (req, res) => {
  const { ssrvcid } = req.params;
  await Sservices.deleteOne({ ssrvcid });
  return res.json({ success: true });
};

