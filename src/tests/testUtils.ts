import { Express } from "express";
import intApp from "../index";
import Post from "../model/postModel";
import Comment from "../model/commentModel";
import User from "../model/userModel";

// User test data types
export type UserData = {
  email: string;
  password: string;
  _id?: string;
  token?: string;
  refreshToken?: string;
};

export const userData: UserData = {
  email: "test@testAuth.com",
  password: "testPasswordAuth123",
};

// Post test data types
export type PostData = {
  title: string;
  senderID: string;
  _id?: string;
};

// Comment test data types
export type CommentData = {
  postId: string;
  content: string;
  author: string;
  _id?: string;
};

// Test data for posts
export const postsData: PostData[] = [
  { title: "First Post", senderID: "sender123" },
  { title: "Second Post", senderID: "sender456" },
  { title: "Third Post", senderID: "sender123" },
];

// Single post for testing
export const singlePostData: PostData = {
  title: "Single Test Post",
  senderID: "senderSingle",
};

// Test data for comments
export const commentsData: CommentData[] = [
  { postId: "temp1", content: "Great post!", author: "author1" },
  { postId: "temp1", content: "Very informative", author: "author2" },
  { postId: "temp2", content: "Nice work", author: "author3" },
];

// Helper function to initialize test app
export const initializeTestApp = async (): Promise<Express> => {
  const app = await intApp();
  return app;
};

// Helper function to clean up test data
export const cleanupTestData = async (): Promise<void> => {
  await Post.deleteMany({});
  await Comment.deleteMany({});
  await User.deleteMany({});
};

// Helper function to create a test post and return its ID
export const createTestPost = async (app: Express, postData?: PostData, token?: string): Promise<string> => {
  const request = require("supertest");
  const data = postData || singlePostData;
  const req = request(app).post("/post");

  if (token) {
    req.set("Authorization", `Bearer ${token}`);
  }

  const response = await req.send(data);
  return response.body._id;
};
