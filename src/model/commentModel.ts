import mongoose = require('mongoose');
import { ICommentDocument, ICommentModel } from './types';

const commentSchema = new mongoose.Schema<ICommentDocument>({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Post'
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Static method
commentSchema.statics.findByPostId = async function(
  postId: string
): Promise<ICommentDocument[]> {
  return this.find({ postId });
};

const Comment = mongoose.model<ICommentDocument, ICommentModel>(
  'Comment',
  commentSchema
);

export = Comment;
