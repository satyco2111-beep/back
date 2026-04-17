import Suser from "../models/suserModel.js";
import CreditWithdrawalRequest from "../models/creditWithdrawalRequestModel.js";
import { getPaginationQuery, paginationMeta } from "../utils/pagination.js";

function isValidUpi(upi) {
  const s = String(upi).trim();
  if (s.length < 5 || s.length > 100) return false;
  return /^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/.test(s);
}

export const createUserWithdrawalRequest = async (req, res) => {
  try {
    const suid = req.user.id;
    const { upiId, amount } = req.body;

    if (!upiId || !String(upiId).trim()) {
      return res.status(400).json({ success: false, message: "UPI ID is required" });
    }
    if (!isValidUpi(upiId)) {
      return res.status(400).json({ success: false, message: "Enter a valid UPI ID (e.g. name@paytm)" });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ success: false, message: "Enter a valid amount greater than 0" });
    }

    const user = await Suser.findOne({ suid });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const balance = Number(user.cradit_value) || 0;
    const roundedAmt = Number(amt.toFixed(2));

    if (roundedAmt > balance) {
      return res.status(400).json({ success: false, message: "Amount exceeds your available credit" });
    }

    const pendingAgg = await CreditWithdrawalRequest.aggregate([
      { $match: { suid, status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const pendingTotal = pendingAgg[0]?.total || 0;
    if (pendingTotal + roundedAmt > balance) {
      return res.status(400).json({
        success: false,
        message: "Total of pending requests plus this amount exceeds your available credit",
      });
    }

    const swrid = `SWREQ-${Date.now()}`;
    const doc = await CreditWithdrawalRequest.create({
      swrid,
      suid,
      upiId: String(upiId).trim(),
      amount: roundedAmt,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted. Super admin will review it.",
      request: {
        swrid: doc.swrid,
        upiId: doc.upiId,
        amount: doc.amount,
        status: doc.status,
        createdAt: doc.createdAt,
      },
    });
  } catch (e) {
    console.error("createUserWithdrawalRequest:", e);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const listMyWithdrawalRequests = async (req, res) => {
  try {
    const suid = req.user.id;
    const list = await CreditWithdrawalRequest.find({ suid }).sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, requests: list });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const listWithdrawalsSuperAdmin = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationQuery(req);
    const total = await CreditWithdrawalRequest.countDocuments({});
    const list = await CreditWithdrawalRequest.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const withdrawals = await Promise.all(
      list.map(async (r) => {
        const u = await Suser.findOne({ suid: r.suid }, "name email mobile cradit_value suid");
        const o = r.toObject();
        return {
          ...o,
          user: u
            ? {
                suid: u.suid,
                name: u.name,
                email: u.email,
                mobile: u.mobile,
                cradit_value: u.cradit_value,
              }
            : null,
        };
      })
    );
    return res.json({ success: true, withdrawals, pagination: paginationMeta(page, limit, total) });
  } catch (e) {
    console.error("listWithdrawalsSuperAdmin:", e);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateWithdrawalSuperAdmin = async (req, res) => {
  try {
    const { swrid } = req.params;
    const { action } = req.body || {};

    if (action !== "approve" && action !== "reject") {
      return res.status(400).json({ success: false, message: 'action must be "approve" or "reject"' });
    }

    const w = await CreditWithdrawalRequest.findOne({ swrid });
    if (!w) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    if (w.status !== "pending") {
      return res.status(400).json({ success: false, message: "Request is already processed" });
    }

    if (action === "reject") {
      w.status = "rejected";
      await w.save();
      return res.json({ success: true, message: "Request rejected", withdrawal: w });
    }

    const user = await Suser.findOne({ suid: w.suid });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const balance = Number(user.cradit_value) || 0;
    if (balance < w.amount) {
      return res.status(400).json({
        success: false,
        message: "User no longer has enough credit. Reject this request instead.",
      });
    }

    user.cradit_value = String(Number((balance - w.amount).toFixed(2)));
    await user.save();

    w.status = "approved";
    await w.save();

    return res.json({
      success: true,
      message: "Withdrawal approved and credit deducted. Pay the user via UPI when ready.",
      withdrawal: w,
      userCreditAfter: user.cradit_value,
    });
  } catch (e) {
    console.error("updateWithdrawalSuperAdmin:", e);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
