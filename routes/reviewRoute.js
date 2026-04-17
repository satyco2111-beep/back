import { Router } from "express";
import { getAllReview, registerReview, getReviewsByWork, getReviewsByProvider, addReview } from "../controllers/reviewController.js";

const reviewRouter = Router();

reviewRouter.get("/", getAllReview);
reviewRouter.post("/register", registerReview);
reviewRouter.get("/work/:swrid", getReviewsByWork);
reviewRouter.get("/provider/:sprovid", getReviewsByProvider);
reviewRouter.post("/add", addReview);

export default reviewRouter;
