import { Response } from 'express';
import Comment = require('../model/commentModel');
import {
  TypedRequest,
  CreateCommentBody,
  UpdateCommentBody,
  CommentIdParams,
  PostIdForCommentParams
} from './types';
import { AuthRequest } from '../middleware/authMiddleware';

// create Comment to Post by using post id
export async function addCommentToPost(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const postId = req.params.postId;
  const commentData = req.body;
  console.log(postId, commentData);

  try {
    // Associate the comment with the post by adding postId and owner
    const newComment = await Comment.create({
      ...commentData,
      postId: postId,
      owner: req.user?._id
    });
    res.status(201).json(newComment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}

// Read a single comment by its ID
export async function getCommentById(
  req: TypedRequest<any, CommentIdParams>,
  res: Response
): Promise<void> {
  const commentId = req.params.commentId;
  try {
    const commentData = await Comment.findById(commentId);
    if (!commentData) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }
    res.status(200).json(commentData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}

//read comment of post by post id
export async function getCommentsByPostId(
  req: TypedRequest<any, PostIdForCommentParams>,
  res: Response
): Promise<void> {
  const postId = req.params.postId;
  try {
    const comments = await Comment.find({ postId: postId });
    res.status(200).json(comments);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}

//update comment of post by comment id
export async function updateCommentById(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const commentId = req.params.commentId;
  const updatedData = req.body;
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }
    if (comment.owner.toString() !== req.user?._id) {
      res.status(403).json({ error: 'Forbidden - You can only update your own comments' });
      return;
    }
    const updatedComment = await Comment.findByIdAndUpdate(commentId, updatedData, { new: true });
    res.status(200).json(updatedComment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}

//delete comment of post by comment id
export async function deleteCommentById(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const commentId = req.params.commentId;
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }
    if (comment.owner.toString() !== req.user?._id) {
      res.status(403).json({ error: 'Forbidden - You can only delete your own comments' });
      return;
    }
    const deleted = await Comment.findByIdAndDelete(commentId);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
