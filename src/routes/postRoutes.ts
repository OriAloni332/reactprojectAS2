import express = require('express');
import * as postController from '../controllers/postController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

router.get("/", postController.getPostBySender);

router.get("/:id", postController.getPostById);

router.post("/", authMiddleware, postController.postPost);

router.delete("/:id", authMiddleware, postController.deletePost);

router.put("/:id", authMiddleware, postController.putPost);

export = router;
