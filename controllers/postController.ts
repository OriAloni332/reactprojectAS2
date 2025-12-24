import { Response } from 'express';
import Post = require('../model/postModel');
import {
  TypedRequest,
  CreatePostBody,
  UpdatePostBody,
  PostIdParams,
  PostQueryParams
} from './types';

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
  req: TypedRequest<CreatePostBody>,
  res: Response
): Promise<void> {
  const obj = req.body;
  console.log(obj);
  try {
    const response = await Post.create(obj);
    res.status(201).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}

export async function deletePost(
  req: TypedRequest<any, PostIdParams>,
  res: Response
): Promise<void> {
  const id = req.params.id;
  console.log(id);
  try {
    const response = await Post.findByIdAndDelete(id);
    if (!response) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.send(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}

export async function putPost(
  req: TypedRequest<UpdatePostBody, PostIdParams>,
  res: Response
): Promise<void> {
  const id = req.params.id;
  const obj = req.body;
  console.log(id, obj);
  try {
    const response = await Post.findByIdAndUpdate(id, obj, { new: true });
    if (!response) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
