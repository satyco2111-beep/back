import Suser from "../models/suserModel.js";
import Sprovider from "../models/providerModel.js";
import Sreferral from "../models/referralModel.js";
import SreferralInvite from "../models/referralInviteModel.js";
import { sendEmail } from "../utils/sendEmail.js";

const USER_REFERRAL_PERCENT = Number(process.env.USER_REFERRAL_PERCENT || 0.03);
const PROVIDER_REFERRAL_REWARD_CREDIT = Number(process.env.PROVIDER_REFERRAL_REWARD_CREDIT || 10);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function generateReferralCode(prefix) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}

export async function ensureUserReferralCode(user) {
  if (user.referralCode) return user.referralCode;
  // retry few times in case of unique collision
  for (let i = 0; i < 5; i++) {
    user.referralCode = generateReferralCode("USR");
    try {
      await user.save();
      return user.referralCode;
    } catch (e) {
      // ignore collision and retry
    }
  }
  return user.referralCode;
}

export async function ensureProviderReferralCode(provider) {
  if (provider.referralCode) return provider.referralCode;
  for (let i = 0; i < 5; i++) {
    provider.referralCode = generateReferralCode("PRO");
    try {
      await provider.save();
      return provider.referralCode;
    } catch (e) {
      // ignore collision and retry
    }
  }
  return provider.referralCode;
}

export async function createUserReferralFromCode({ inviteeUser, referralCode }) {
  if (!referralCode) return null;
  const code = String(referralCode).trim();
  const inviter = await Suser.findOne({ referralCode: code });
  if (!inviter) return null;
  if (inviter.suid === inviteeUser.suid) return null;

  const existing = await Sreferral.findOne({ inviteeType: "USER", inviteeId: inviteeUser.suid });
  if (existing) return existing;

  const srefid = `SREF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const referral = await Sreferral.create({
    srefid,
    inviterType: "USER",
    inviterId: inviter.suid,
    inviteeType: "USER",
    inviteeId: inviteeUser.suid,
    inviteeEmail: inviteeUser.email,
  });

  await SreferralInvite.updateMany(
    { inviterType: "USER", inviterId: inviter.suid, inviteeEmail: normalizeEmail(inviteeUser.email), status: "PENDING" },
    { $set: { status: "ACCEPTED" } }
  );

  return referral;
}

export async function createProviderReferralFromCode({ inviteeProvider, referralCode }) {
  if (!referralCode) return null;
  const code = String(referralCode).trim();
  const inviter = await Sprovider.findOne({ referralCode: code });
  if (!inviter) return null;
  if (inviter.sprovid === inviteeProvider.sprovid) return null;

  const existing = await Sreferral.findOne({ inviteeType: "PROVIDER", inviteeId: inviteeProvider.sprovid });
  if (existing) return existing;

  const srefid = `SREF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const referral = await Sreferral.create({
    srefid,
    inviterType: "PROVIDER",
    inviterId: inviter.sprovid,
    inviteeType: "PROVIDER",
    inviteeId: inviteeProvider.sprovid,
    inviteeEmail: inviteeProvider.email,
  });

  await SreferralInvite.updateMany(
    { inviterType: "PROVIDER", inviterId: inviter.sprovid, inviteeEmail: normalizeEmail(inviteeProvider.email), status: "PENDING" },
    { $set: { status: "ACCEPTED" } }
  );

  return referral;
}

export const getMyReferralInfoUser = async (req, res) => {
  try {
    const suid = req.user?.id;
    const user = await Suser.findOne({ suid });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const code = await ensureUserReferralCode(user);
    const referrals = await Sreferral.find({ inviterType: "USER", inviterId: suid }).sort({ createdAt: -1 });
    const invites = await SreferralInvite.find({ inviterType: "USER", inviterId: suid }).sort({ createdAt: -1 }).limit(50);

    return res.json({
      success: true,
      referralCode: code,
      userCredit: user.cradit_value || "0",
      referrals,
      invites,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getMyReferralInfoProvider = async (req, res) => {
  try {
    const sprovid = req.provider?.id;
    const provider = await Sprovider.findOne({ sprovid });
    if (!provider) return res.status(404).json({ success: false, message: "Provider not found" });

    const code = await ensureProviderReferralCode(provider);
    const referrals = await Sreferral.find({ inviterType: "PROVIDER", inviterId: sprovid }).sort({ createdAt: -1 });
    const invites = await SreferralInvite.find({ inviterType: "PROVIDER", inviterId: sprovid }).sort({ createdAt: -1 }).limit(50);

    return res.json({ success: true, referralCode: code, referrals, invites });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const inviteByEmailUser = async (req, res) => {
  try {
    const suid = req.user?.id;
    const { email } = req.body;
    const inviteeEmail = normalizeEmail(email);
    if (!inviteeEmail) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await Suser.findOne({ suid });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const code = await ensureUserReferralCode(user);
    const sinviteid = `SINV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const invite = await SreferralInvite.create({
      sinviteid,
      inviterType: "USER",
      inviterId: suid,
      inviterEmail: user.email,
      inviteeEmail,
      referralCode: code,
      status: "PENDING",
    });

    // Email contains the code (frontend can show it too)
    await sendEmail(
      inviteeEmail,
      "Referral Invitation",
      `You have been referred by ${user.email}. Use this referral code during signup: ${code}`
    );

    return res.status(201).json({ success: true, message: "Referral invite sent", invite, referralCode: code });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const inviteByEmailProvider = async (req, res) => {
  try {
    const sprovid = req.provider?.id;
    const { email } = req.body;
    const inviteeEmail = normalizeEmail(email);
    if (!inviteeEmail) return res.status(400).json({ success: false, message: "Email is required" });

    const provider = await Sprovider.findOne({ sprovid });
    if (!provider) return res.status(404).json({ success: false, message: "Provider not found" });

    const code = await ensureProviderReferralCode(provider);
    const sinviteid = `SINV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const invite = await SreferralInvite.create({
      sinviteid,
      inviterType: "PROVIDER",
      inviterId: sprovid,
      inviterEmail: provider.email,
      inviteeEmail,
      referralCode: code,
      status: "PENDING",
    });

    await sendEmail(
      inviteeEmail,
      "Referral Invitation",
      `You have been referred by ${provider.email}. Use this referral code during provider signup: ${code}`
    );

    return res.status(201).json({ success: true, message: "Referral invite sent", invite, referralCode: code });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Called when a referred USER's first posted work is ACCEPTED
export async function rewardUserInviterForWorkAccepted(inviteeSuid, acceptedWorkPrice) {
  const referral = await Sreferral.findOne({ inviteeType: "USER", inviteeId: inviteeSuid });
  if (!referral || referral.rewardWorkAcceptedGiven) return;

  if (referral.inviterType !== "USER") return;
  const inviter = await Suser.findOne({ suid: referral.inviterId });
  if (!inviter) return;

  const current = Number(inviter.cradit_value) || 0;
  const workPrice = Number(acceptedWorkPrice) || 0;
  const reward = Number((workPrice * USER_REFERRAL_PERCENT).toFixed(2));
  inviter.cradit_value = String(Number((current + reward).toFixed(2)));
  await inviter.save();

  referral.rewardWorkAcceptedGiven = true;
  await referral.save();
}

// Called when a referred PROVIDER ACCEPTS their first work
export async function rewardProviderInviterForFirstAccept(inviteeSprovid) {
  const referral = await Sreferral.findOne({ inviteeType: "PROVIDER", inviteeId: inviteeSprovid });
  if (!referral || referral.rewardProviderFirstAcceptGiven) return;

  if (referral.inviterType !== "PROVIDER") return;
  const inviter = await Sprovider.findOne({ sprovid: referral.inviterId });
  if (!inviter) return;

  const current = Number(inviter.cradit_value) || 0;
  inviter.cradit_value = String(Number((current + PROVIDER_REFERRAL_REWARD_CREDIT).toFixed(2)));
  await inviter.save();

  referral.rewardProviderFirstAcceptGiven = true;
  await referral.save();
}

