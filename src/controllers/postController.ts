import { Response } from 'express';
import Post = require('../model/postModel');
import {
  TypedRequest,
  CreatePostBody,
  UpdatePostBody,
  PostIdParams,
  PostQueryParams
} from './types';
import { AuthRequest } from '../middleware/authMiddleware';

export async function getPostBySender(
  req: TypedRequest<any, any, PostQueryParams>,
  res: Response
): Promise<void> {
  const filter = req.query;
  console.log(filter);
  try {
    if (filter.senderID) {
      const posts = await Post.find(filter);
      res.json(posts);
    } else {
      const posts = await Post.find();
      res.json(posts);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}

export async function getPostById(
  req: TypedRequest<any, PostIdParams>,
  res: Response
): Promise<void> {
  const id = req.params.id;
  console.log(id);
  try {
    const post = await Post.findById(id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(post);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}

export async function postPost(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const obj = req.body;
  console.log(obj);
  try {
    const postData = {
      ...obj,
      owner: req.user?._id
    };
    const response = await Post.create(postData);
    res.status(201).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}

export async function deletePost(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const id = req.params.id;
  console.log(id);
  try {
    const post = await Post.findById(id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    if (post.owner.toString() !== req.user?._id) {
      res.status(403).json({ error: 'Forbidden - You can only delete your own posts' });
      return;
    }
    const response = await Post.findByIdAndDelete(id);
    res.send(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}

export async function putPost(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const id = req.params.id;
  const obj = req.body;
  console.log(id, obj);
  try {
    const post = await Post.findById(id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    if (post.owner.toString() !== req.user?._id) {
      res.status(403).json({ error: 'Forbidden - You can only update your own posts' });
      return;
    }
    const response = await Post.findByIdAndUpdate(id, obj, { new: true });
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
