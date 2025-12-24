import { Document, Model, Types } from 'mongoose';

// Post Types
export interface IPost {
  title: string;
  senderID: string;
  owner: Types.ObjectId;
}

export interface IPostDocument extends IPost, Document {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IPostModel = Model<IPostDocument>;

// Comment Types
export interface IComment {
  postId: Types.ObjectId;
  content: string;
  author: string;
  owner: Types.ObjectId;
  createdAt: Date;
}

export interface ICommentDocument extends IComment, Document {
  _id: Types.ObjectId;
}

export interface ICommentModel extends Model<ICommentDocument> {
  findByPostId(postId: string): Promise<ICommentDocument[]>;
}
