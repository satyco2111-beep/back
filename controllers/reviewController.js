import Sreview from "../models/reviewModel.js";

/**
 * @desc    Get all Reviews
 * @route   GET /api/review
 * @access  Public / Admin
 */
export const getAllReview = async (req, res) => {
  try {
    const reviews = await Sreview.find({});

    return res.status(200).json({
      success: true,
      message: "All reviews fetched successfully",
      reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Register new Review
 * @route   POST /api/review/register
 * @access  Public
 */
export const registerReview = async (req, res) => {
  try {
    const { review, swrid } = req.body;

    // Basic validation
    if (!review || !swrid) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Generate custom review ID
    const sreviewid = `SREVIEW-${Date.now()}`;

    // Create new review
    const newReview = await Sreview.create({
      sreviewid,
      review,
      swrid,
    });

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      review: newReview,
    });
  } catch (error) {
    console.error("Error registering review:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Get reviews by work ID
 * @route   GET /api/review/work/:swrid
 * @access  Public
 */
export const getReviewsByWork = async (req, res) => {
  try {
    const { swrid } = req.params;

    const reviews = await Sreview.find({ swrid }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Get reviews by provider ID (receiverId)
 * @route   GET /api/review/provider/:sprovid
 * @access  Public
 */
export const getReviewsByProvider = async (req, res) => {
  try {
    const { sprovid } = req.params;

    const reviews = await Sreview.find({ receiverId: sprovid }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Add review with rating and author info
 * @route   POST /api/review/add
 * @access  Private
 */
export const addReview = async (req, res) => {
  try {
    const { review, swrid, rating, authorId, authorType, authorName, receiverId } = req.body;

    if (!review || !swrid || !rating || !authorId || !authorType || !authorName || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Only users can submit reviews
    if (authorType !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only users can submit reviews for this work",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Check if user has already reviewed this work
    const existingReview = await Sreview.findOne({
      swrid,
      authorId,
      authorType: "user",
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a review for this work",
      });
    }

    const sreviewid = `SREVIEW-${Date.now()}`;

    const newReview = await Sreview.create({
      sreviewid,
      review,
      swrid,
      rating,
      authorId,
      authorType,
      authorName,
      receiverId,
    });

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      review: newReview,
    });
  } catch (error) {
    console.error("Error adding review:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
