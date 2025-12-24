import express = require('express');
import * as postController from '../controllers/postController';

const router = express.Router();

router.get("/", postController.getPostBySender);

router.get("/:id", postController.getPostById);

router.post("/", postController.postPost);

router.delete("/:id", postController.deletePost);

router.put("/:id", postController.putPost);

export = router;
