import { Router } from "express";
import {
  sendWorkRequest,
  getProviderRequests,
  getWorkRequests,
  acceptWorkRequest,
  rejectWorkRequest,
  cancelWorkRequest,
  getUserSentRequests,
  markRequestAsSeen,
} from "../controllers/workRequestController.js";

const workRequestRouter = Router();

// User sends a request to a provider
workRequestRouter.post("/send", sendWorkRequest);

// Get pending requests for a provider
workRequestRouter.get("/provider/:sprovid", getProviderRequests);

// Get all requests for a specific work
workRequestRouter.get("/work/:swrid", getWorkRequests);

// Provider accepts a request
workRequestRouter.put("/accept/:srequestid", acceptWorkRequest);

// Provider rejects a request
workRequestRouter.put("/reject/:srequestid", rejectWorkRequest);

// User cancels their request
workRequestRouter.put("/cancel/:srequestid", cancelWorkRequest);

// Mark request as seen by provider
workRequestRouter.put("/mark-seen/:srequestid", markRequestAsSeen);

// Get all requests sent by a user
workRequestRouter.get("/user/:suid", getUserSentRequests);

export default workRequestRouter;
