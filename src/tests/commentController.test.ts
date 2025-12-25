import request from "supertest";
import intApp from "../index";
import Comment from "../model/commentModel";
import Post from "../model/postModel";
import User from "../model/userModel";
import { Express } from "express";
import { commentsData, createTestPost, cleanupTestData, userData, secondUserData, registerAndLoginUser, UserData } from "./testUtils";

let app: Express;
let testPostId1: string;
let testPostId2: string;
let authToken: string;
let userAData: UserData;
let userBData: UserData;

beforeAll(async () => {
  app = await intApp();
  await Comment.deleteMany({});
  await Post.deleteMany({});
  await User.deleteMany({});

  // Register and login User A (primary user)
  userAData = await registerAndLoginUser(app, userData);
  authToken = userAData.token!;

  // Register and login User B (secondary user for ownership tests)
  userBData = await registerAndLoginUser(app, secondUserData);

  // Create test posts to attach comments to
  testPostId1 = await createTestPost(app, {
    title: "Test Post for Comments 1",
    senderID: "sender1",
  }, authToken);
  testPostId2 = await createTestPost(app, {
    title: "Test Post for Comments 2",
    senderID: "sender2",
  }, authToken);

  // Update comments data with actual post IDs
  commentsData[0].postId = testPostId1;
  commentsData[1].postId = testPostId1;
  commentsData[2].postId = testPostId2;
});

afterAll(async () => {
  await cleanupTestData();
});

describe("Comment API", () => {
  test("test get comments for post from empty database", async () => {
    console.log("Test: GET comments for post from empty database");
    const response = await request(app).get(`/comment/post/${testPostId1}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("test create comment without authentication", async () => {
    console.log("Test: POST create comment without auth");
    const response = await request(app)
      .post(`/comment/post/${testPostId1}`)
      .send({
        content: "Unauthorized comment",
        author: "Test Author",
      });
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  test("test create comment with missing content", async () => {
    console.log("Test: POST create comment with missing content");
    const response = await request(app)
      .post(`/comment/post/${testPostId1}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ author: "Test Author" });
    expect(response.statusCode).toBe(500);
  });

  test("test create comment with missing author", async () => {
    console.log("Test: POST create comment with missing author");
    const response = await request(app)
      .post(`/comment/post/${testPostId1}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ content: "Test content" });
    expect(response.statusCode).toBe(500);
  });

  test("test post create comments to a post", async () => {
    console.log("Test: POST create comments");
    // Add all comments from commentsData
    for (const comment of commentsData) {
      const response = await request(app)
        .post(`/comment/post/${comment.postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          content: comment.content,
          author: comment.author,
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.content).toBe(comment.content);
      expect(response.body.author).toBe(comment.author);
      expect(response.body.postId).toBe(comment.postId);
      expect(response.body._id).toBeDefined();
    }
  });

  test("test get all comments for a specific post", async () => {
    console.log("Test: GET all comments for a specific post");
    const response = await request(app).get(`/comment/post/${testPostId1}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2); // testPostId1 has 2 comments

    // Verify all comments belong to the correct post
    response.body.forEach((comment: any) => {
      expect(comment.postId).toBe(testPostId1);
    });

    // Store the first comment ID for later tests
    commentsData[0]._id = response.body[0]._id;
  });

  test("test get comments for second post", async () => {
    console.log("Test: GET comments for second post");
    const response = await request(app).get(`/comment/post/${testPostId2}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1); // testPostId2 has 1 comment

    // Store the comment ID for later tests
    commentsData[2]._id = response.body[0]._id;
  });

  test("test get comments for non-existent post returns empty array", async () => {
    console.log("Test: GET comments for non-existent post");
    const invalidPostId = "507f1f77bcf86cd799439011"; // Valid ObjectId format but non-existent
    const response = await request(app).get(`/comment/post/${invalidPostId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("test get comment by ID", async () => {
    console.log("Test: GET comment by ID");
    const response = await request(app).get(`/comment/${commentsData[0]._id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(commentsData[0]._id);
    expect(response.body.content).toBe(commentsData[0].content);
    expect(response.body.author).toBe(commentsData[0].author);
    expect(response.body.postId).toBe(commentsData[0].postId);
  });

  test("test get comment by invalid ID returns 404", async () => {
    console.log("Test: GET comment with invalid ID");
    const invalidId = "507f1f77bcf86cd799439011"; // Valid ObjectId format but non-existent
    const response = await request(app).get(`/comment/${invalidId}`);
    expect(response.statusCode).toBe(404);
  });

  test("test update comment without authentication", async () => {
    console.log("Test: PUT update comment without auth");
    const updatedData = {
      content: "Unauthorized update",
      author: commentsData[2].author,
    };
    const response = await request(app)
      .put(`/comment/${commentsData[2]._id}`)
      .send(updatedData);
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  test("test put update comment by ID", async () => {
    console.log("Test: PUT update comment by ID");
    const updatedData = {
      content: "Updated comment content",
      author: commentsData[2].author,
      postId: commentsData[2].postId,
    };

    const response = await request(app)
      .put(`/comment/${commentsData[2]._id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedData);

    expect(response.statusCode).toBe(200);
    expect(response.body.content).toBe(updatedData.content);
    expect(response.body.author).toBe(updatedData.author);
    expect(response.body._id).toBe(commentsData[2]._id);

    // Update the test data to reflect the change
    commentsData[2].content = updatedData.content;
  });

  test("test put update comment with invalid ID returns 404", async () => {
    console.log("Test: PUT update comment with invalid ID");
    const invalidId = "507f1f77bcf86cd799439011";
    const updatedData = {
      content: "This should fail",
      author: "author",
      postId: testPostId1,
    };

    const response = await request(app)
      .put(`/comment/${invalidId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedData);

    expect(response.statusCode).toBe(404);
  });

  test("test delete comment without authentication", async () => {
    console.log("Test: DELETE comment without auth");
    const response = await request(app).delete(`/comment/${commentsData[2]._id}`);
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  test("test delete comment by ID", async () => {
    console.log("Test: DELETE comment by ID");
    const response = await request(app)
      .delete(`/comment/${commentsData[2]._id}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.statusCode).toBe(200);

    // Verify the comment is actually deleted
    const getResponse = await request(app).get(`/comment/${commentsData[2]._id}`);
    expect(getResponse.statusCode).toBe(404);
  });

  test("test delete comment with invalid ID returns 404", async () => {
    console.log("Test: DELETE comment with invalid ID");
    const invalidId = "507f1f77bcf86cd799439011";
    const response = await request(app)
      .delete(`/comment/${invalidId}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.statusCode).toBe(404);
  });

  test("test verify remaining comments after deletion", async () => {
    console.log("Test: Verify remaining comments for post after deletion");
    const response = await request(app).get(`/comment/post/${testPostId2}`);
    expect(response.statusCode).toBe(200);
    // Should have 0 comments (the one comment was deleted)
    expect(response.body.length).toBe(0);
  });

  test("test verify first post still has comments", async () => {
    console.log("Test: Verify first post still has its comments");
    const response = await request(app).get(`/comment/post/${testPostId1}`);
    expect(response.statusCode).toBe(200);
    // Should still have 2 comments
    expect(response.body.length).toBe(2);
  });
});

// Ownership/Authorization Tests (403 Forbidden scenarios)
describe("Comment API - Ownership Authorization", () => {
  let userACommentId: string;

  beforeAll(async () => {
    // User A creates a comment
    const response = await request(app)
      .post(`/comment/post/${testPostId1}`)
      .set("Authorization", `Bearer ${userAData.token}`)
      .send({ content: "User A's private comment", author: "UserA" });
    userACommentId = response.body._id;
  });

  test("test User B cannot update User A's comment (403 Forbidden)", async () => {
    console.log("Test: User B tries to update User A's comment");
    const response = await request(app)
      .put(`/comment/${userACommentId}`)
      .set("Authorization", `Bearer ${userBData.token}`)
      .send({ content: "Hijacked comment", author: "UserA" });

    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Forbidden - You can only update your own comments");
  });

  test("test User B cannot delete User A's comment (403 Forbidden)", async () => {
    console.log("Test: User B tries to delete User A's comment");
    const response = await request(app)
      .delete(`/comment/${userACommentId}`)
      .set("Authorization", `Bearer ${userBData.token}`);

    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Forbidden - You can only delete your own comments");
  });

  test("test User A can still update their own comment", async () => {
    console.log("Test: User A updates their own comment");
    const response = await request(app)
      .put(`/comment/${userACommentId}`)
      .set("Authorization", `Bearer ${userAData.token}`)
      .send({ content: "Updated by owner", author: "UserA" });

    expect(response.statusCode).toBe(200);
    expect(response.body.content).toBe("Updated by owner");
  });

  test("test User A can delete their own comment", async () => {
    console.log("Test: User A deletes their own comment");
    const response = await request(app)
      .delete(`/comment/${userACommentId}`)
      .set("Authorization", `Bearer ${userAData.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Comment deleted successfully");
  });
});

// Database Error Tests (Catch Block Coverage)
describe("Comment API - Database Error Handling", () => {
  test("test getCommentById handles database error", async () => {
    console.log("Test: GET comment by ID with database error");
    const originalFindById = Comment.findById;
    Comment.findById = jest.fn().mockImplementation(() => {
      throw new Error("Database query failed");
    });

    const response = await request(app).get("/comment/507f1f77bcf86cd799439011");
    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Database query failed");

    Comment.findById = originalFindById;
  });

  test("test getCommentsByPostId handles database error", async () => {
    console.log("Test: GET comments by post ID with database error");
    const originalFind = Comment.find;
    Comment.find = jest.fn().mockImplementation(() => {
      throw new Error("Database connection failed");
    });

    const response = await request(app).get(`/comment/post/${testPostId1}`);
    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Database connection failed");

    Comment.find = originalFind;
  });

  test("test updateCommentById handles database error", async () => {
    console.log("Test: PUT comment with database error");
    // First create a comment to have a valid ID
    const createResponse = await request(app)
      .post(`/comment/post/${testPostId1}`)
      .set("Authorization", `Bearer ${userAData.token}`)
      .send({ content: "Comment for error test", author: "TestAuthor" });
    const commentId = createResponse.body._id;

    const originalFindById = Comment.findById;
    Comment.findById = jest.fn().mockImplementation(() => {
      throw new Error("Database update error");
    });

    const response = await request(app)
      .put(`/comment/${commentId}`)
      .set("Authorization", `Bearer ${userAData.token}`)
      .send({ content: "Updated content", author: "TestAuthor" });

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Database update error");

    Comment.findById = originalFindById;

    // Clean up
    await Comment.findByIdAndDelete(commentId);
  });

  test("test deleteCommentById handles database error", async () => {
    console.log("Test: DELETE comment with database error");
    // First create a comment to have a valid ID
    const createResponse = await request(app)
      .post(`/comment/post/${testPostId1}`)
      .set("Authorization", `Bearer ${userAData.token}`)
      .send({ content: "Comment for delete error test", author: "TestAuthor" });
    const commentId = createResponse.body._id;

    const originalFindById = Comment.findById;
    Comment.findById = jest.fn().mockImplementation(() => {
      throw new Error("Database delete error");
    });

    const response = await request(app)
      .delete(`/comment/${commentId}`)
      .set("Authorization", `Bearer ${userAData.token}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Database delete error");

    Comment.findById = originalFindById;

    // Clean up
    await Comment.findByIdAndDelete(commentId);
  });
});
