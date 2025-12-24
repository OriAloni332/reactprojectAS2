import express = require('express');
import * as commentController from '../controllers/commentController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

// Route to add a comment to a post by post ID
router.post("/post/:postId", authMiddleware, commentController.addCommentToPost);
// Route to get comments of a post by post ID
router.get("/post/:postId", commentController.getCommentsByPostId);
// Route to get a single comment by comment ID
router.get("/:commentId", commentController.getCommentById);
// Route to update a comment by comment ID
router.put("/:commentId", authMiddleware, commentController.updateCommentById);
// Route to delete a comment by comment ID
router.delete("/:commentId", authMiddleware, commentController.deleteCommentById);

export = router;
