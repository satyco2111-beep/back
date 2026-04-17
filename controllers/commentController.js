import Scomment from "../models/commentModel.js";

/**
 * @desc    Get all Comments
 * @route   GET /api/comment
 * @access  Public / Admin
 */
export const getAllComment = async (req, res) => {
  try {
    const comments = await Scomment.find({});
    return res.status(200).json({
      success: true,
      message: "All comments fetched successfully",
      comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Register new Comment
 * @route   POST /api/comment/register
 * @access  Public
 */
export const registerComment = async (req, res) => {
  try {
    const { comment, swrid } = req.body;

    // Basic validation
    if (!comment || !swrid) {
      return res.status(400).json({
        success: false,
        message: "Comment and swrid are required",
      });
    }

    // Generate custom comment ID
    const scommentid = `SCOMMENT-${Date.now()}`;

    // Create and save new comment
    const newComment = await Scomment.create({
      scommentid,
      comment,
      swrid,
    });

    const commentResponse = newComment.toObject();

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: commentResponse,
    });
  } catch (error) {
    console.error("Error registering comment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Get comments by work ID
 * @route   GET /api/comment/work/:swrid
 * @access  Public
 */
export const getCommentsByWork = async (req, res) => {
  try {
    const { swrid } = req.params;

    const comments = await Scomment.find({ swrid }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all comments by user ID
 * @route   GET /api/comment/user/:suid
 * @access  Public
 */
export const getCommentsByUser = async (req, res) => {
  try {
    const { suid } = req.params;

    const comments = await Scomment.find({ receiverId: suid }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Add comment with author info
 * @route   POST /api/comment/add
 * @access  Private
 */
export const addComment = async (req, res) => {
  try {
    const { comment, swrid, authorId, authorType, authorName, receiverId } = req.body;

    if (!comment || !swrid || !authorId || !authorType || !authorName || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Only providers can submit comments
    if (authorType !== "provider") {
      return res.status(403).json({
        success: false,
        message: "Only providers can submit comments on this work",
      });
    }

    // Check if provider has already commented on this work
    const existingComment = await Scomment.findOne({
      swrid,
      authorId,
      authorType: "provider",
    });

    if (existingComment) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a comment for this work",
      });
    }

    const scommentid = `SCOMMENT-${Date.now()}`;

    const newComment = await Scomment.create({
      scommentid,
      comment,
      swrid,
      authorId,
      authorType,
      authorName,
      receiverId,
    });

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
