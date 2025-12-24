import request from "supertest";
import intApp from "../index";
import Comment from "../model/commentModel";
import Post from "../model/postModel";
import User from "../model/userModel";
import { Express } from "express";
import { commentsData, createTestPost, cleanupTestData, singlePostData, userData } from "./testUtils";

let app: Express;
let testPostId1: string;
let testPostId2: string;
let authToken: string;

beforeAll(async () => {
  app = await intApp();
  await Comment.deleteMany({});
  await Post.deleteMany({});
  await User.deleteMany({});

  // Register and login to get authentication token
  await request(app).post("/auth/register").send({
    email: userData.email,
    password: userData.password,
  });

  const loginResponse = await request(app).post("/auth/login").send({
    email: userData.email,
    password: userData.password,
  });

  authToken = loginResponse.body.token;

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
