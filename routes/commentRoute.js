import { Router } from "express";
import { getAllComment, registerComment, getCommentsByWork, getCommentsByUser, addComment } from "../controllers/commentController.js";

const commentRouter = Router();

commentRouter.get("/", getAllComment);
commentRouter.post("/register", registerComment);
commentRouter.get("/work/:swrid", getCommentsByWork);
commentRouter.get("/user/:suid", getCommentsByUser);
commentRouter.post("/add", addComment);

export default commentRouter;
