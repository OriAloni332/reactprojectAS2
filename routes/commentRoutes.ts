import express = require('express');
import * as commentController from '../controllers/commentController';

const router = express.Router();

// Route to add a comment to a post by post ID
router.post("/post/:postId", commentController.addCommentToPost);
// Route to get comments of a post by post ID
router.get("/post/:postId", commentController.getCommentsByPostId);
// Route to get a single comment by comment ID
router.get("/:commentId", commentController.getCommentById);
// Route to update a comment by comment ID
router.put("/:commentId", commentController.updateCommentById);
// Route to delete a comment by comment ID
router.delete("/:commentId", commentController.deleteCommentById);

export = router;
