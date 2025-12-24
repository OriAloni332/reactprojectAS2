import { Request } from 'express';

export interface TypedRequest<
  TBody = any,
  TParams = any,
  TQuery = any
> extends Request<TParams, any, TBody, TQuery> {}

// Post operation types
export interface CreatePostBody {
  title: string;
  senderID: string;
}

export interface UpdatePostBody {
  title?: string;
  senderID?: string;
}

export interface PostIdParams {
  id: string;
}

export interface PostQueryParams {
  senderID?: string;
}

// Comment operation types
export interface CreateCommentBody {
  content: string;
  author: string;
}

export interface UpdateCommentBody {
  content?: string;
  author?: string;
}

export interface CommentIdParams {
  commentId: string;
}

export interface PostIdForCommentParams {
  postId: string;
}
