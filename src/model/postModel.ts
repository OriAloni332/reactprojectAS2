import mongoose = require('mongoose');
import { IPostDocument, IPostModel } from './types';

const postSchema = new mongoose.Schema<IPostDocument>(
  {
    title: {
      type: String,
      required: true
    },
    senderID: {
      type: String,
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Post = mongoose.model<IPostDocument, IPostModel>('post', postSchema);

export = Post;
