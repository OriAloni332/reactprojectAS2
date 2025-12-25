import request from "supertest";
import intApp from "../index";
import Post from "../model/postModel";
import User from "../model/userModel";
import { Express } from "express";
import { postsData, cleanupTestData, userData, secondUserData, registerAndLoginUser, UserData } from "./testUtils";

let app: Express;
let authToken: string;
let userAData: UserData;
let userBData: UserData;

beforeAll(async () => {
  app = await intApp();
  await Post.deleteMany({});
  await User.deleteMany({});

  // Register and login User A (primary user)
  userAData = await registerAndLoginUser(app, userData);
  authToken = userAData.token!;

  // Register and login User B (secondary user for ownership tests)
  userBData = await registerAndLoginUser(app, secondUserData);
});

afterAll(async () => {
  await cleanupTestData();
});

describe("Post API", () => {
  test("test get all posts from empty database", async () => {
    console.log("Test: GET all posts from empty database");
    const response = await request(app).get("/post");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("test create post without authentication", async () => {
    console.log("Test: POST create post without auth");
    const response = await request(app).post("/post").send(postsData[0]);
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  test("test create post with missing title", async () => {
    console.log("Test: POST create post with missing title");
    const response = await request(app)
      .post("/post")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ senderID: "sender123" });
    expect(response.statusCode).toBe(500);
  });

  test("test create post with missing senderID", async () => {
    console.log("Test: POST create post with missing senderID");
    const response = await request(app)
      .post("/post")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Test Post" });
    expect(response.statusCode).toBe(500);
  });

  test("test post create new posts", async () => {
    console.log("Test: POST create new posts");
    // Add all posts from postsData
    for (const post of postsData) {
      const response = await request(app)
        .post("/post")
        .set("Authorization", `Bearer ${authToken}`)
        .send(post);
      expect(response.statusCode).toBe(201);
      expect(response.body).toMatchObject(post);
      expect(response.body._id).toBeDefined();
    }
  });

  test("test get all posts after creation", async () => {
    console.log("Test: GET all posts after creation");
    const response = await request(app).get("/post");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(postsData.length);
  });

  test("test get posts by sender filter", async () => {
    console.log("Test: GET posts with sender filter");
    const senderID = postsData[0].senderID;
    const response = await request(app).get(`/post?senderID=${senderID}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);

    // Verify all posts have the same senderID
    response.body.forEach((post: any) => {
      expect(post.senderID).toBe(senderID);
    });

    // Store the first post ID for later tests
    postsData[0]._id = response.body[0]._id;
  });

  test("test get post by ID", async () => {
    console.log("Test: GET post by ID");
    const response = await request(app).get(`/post/${postsData[0]._id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(postsData[0]._id);
    expect(response.body.title).toBe(postsData[0].title);
    expect(response.body.senderID).toBe(postsData[0].senderID);
  });

  test("test get post by invalid ID returns 404", async () => {
    console.log("Test: GET post with invalid ID");
    const invalidId = "507f1f77bcf86cd799439011"; // Valid ObjectId format but non-existent
    const response = await request(app).get(`/post/${invalidId}`);
    expect(response.statusCode).toBe(404);
  });

  test("test update post without authentication", async () => {
    console.log("Test: PUT update post without auth");
    const updatedData = {
      title: "Updated Title",
      senderID: postsData[0].senderID,
    };
    const response = await request(app)
      .put(`/post/${postsData[0]._id}`)
      .send(updatedData);
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  test("test put update post by ID", async () => {
    console.log("Test: PUT update post by ID");
    const updatedData = {
      title: "Updated First Post",
      senderID: postsData[0].senderID,
    };

    const response = await request(app)
      .put(`/post/${postsData[0]._id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedData);

    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe(updatedData.title);
    expect(response.body.senderID).toBe(updatedData.senderID);
    expect(response.body._id).toBe(postsData[0]._id);

    // Update the test data to reflect the change
    postsData[0].title = updatedData.title;
  });

  test("test put update post with invalid ID returns 404", async () => {
    console.log("Test: PUT update post with invalid ID");
    const invalidId = "507f1f77bcf86cd799439011";
    const updatedData = {
      title: "This should fail",
      senderID: "sender123",
    };

    const response = await request(app)
      .put(`/post/${invalidId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedData);

    expect(response.statusCode).toBe(404);
  });

  test("test delete post without authentication", async () => {
    console.log("Test: DELETE post without auth");
    const response = await request(app).delete(`/post/${postsData[0]._id}`);
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  test("test delete post by ID", async () => {
    console.log("Test: DELETE post by ID");
    const response = await request(app)
      .delete(`/post/${postsData[0]._id}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.statusCode).toBe(200);

    // Verify the post is actually deleted
    const getResponse = await request(app).get(`/post/${postsData[0]._id}`);
    expect(getResponse.statusCode).toBe(404);
  });

  test("test delete post with invalid ID returns 404", async () => {
    console.log("Test: DELETE post with invalid ID");
    const invalidId = "507f1f77bcf86cd799439011";
    const response = await request(app)
      .delete(`/post/${invalidId}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.statusCode).toBe(404);
  });

  test("test verify remaining posts count after deletion", async () => {
    console.log("Test: Verify remaining posts count");
    const response = await request(app).get("/post");
    expect(response.statusCode).toBe(200);
    // Should have postsData.length - 1 posts (one was deleted)
    expect(response.body.length).toBe(postsData.length - 1);
  });
});

// Ownership/Authorization Tests (403 Forbidden scenarios)
describe("Post API - Ownership Authorization", () => {
  let userAPostId: string;

  beforeAll(async () => {
    // User A creates a post
    const response = await request(app)
      .post("/post")
      .set("Authorization", `Bearer ${userAData.token}`)
      .send({ title: "User A's Private Post", senderID: "userA" });
    userAPostId = response.body._id;
  });

  test("test User B cannot update User A's post (403 Forbidden)", async () => {
    console.log("Test: User B tries to update User A's post");
    const response = await request(app)
      .put(`/post/${userAPostId}`)
      .set("Authorization", `Bearer ${userBData.token}`)
      .send({ title: "Hijacked Title", senderID: "userA" });

    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Forbidden - You can only update your own posts");
  });

  test("test User B cannot delete User A's post (403 Forbidden)", async () => {
    console.log("Test: User B tries to delete User A's post");
    const response = await request(app)
      .delete(`/post/${userAPostId}`)
      .set("Authorization", `Bearer ${userBData.token}`);

    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Forbidden - You can only delete your own posts");
  });

  test("test User A can still update their own post", async () => {
    console.log("Test: User A updates their own post");
    const response = await request(app)
      .put(`/post/${userAPostId}`)
      .set("Authorization", `Bearer ${userAData.token}`)
      .send({ title: "Updated by Owner", senderID: "userA" });

    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe("Updated by Owner");
  });

  test("test User A can delete their own post", async () => {
    console.log("Test: User A deletes their own post");
    const response = await request(app)
      .delete(`/post/${userAPostId}`)
      .set("Authorization", `Bearer ${userAData.token}`);

    expect(response.statusCode).toBe(200);
  });
});

// Database Error Tests (Catch Block Coverage)
describe("Post API - Database Error Handling", () => {
  test("test getPostBySender handles database error", async () => {
    console.log("Test: GET posts with database error");
    // Mock Post.find to throw an error
    const originalFind = Post.find;
    Post.find = jest.fn().mockImplementation(() => {
      throw new Error("Database connection failed");
    });

    const response = await request(app).get("/post");
    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Database connection failed");

    // Restore original method
    Post.find = originalFind;
  });

  test("test getPostById handles database error", async () => {
    console.log("Test: GET post by ID with database error");
    const originalFindById = Post.findById;
    Post.findById = jest.fn().mockImplementation(() => {
      throw new Error("Database query failed");
    });

    const response = await request(app).get("/post/507f1f77bcf86cd799439011");
    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Database query failed");

    Post.findById = originalFindById;
  });

  test("test deletePost handles database error", async () => {
    console.log("Test: DELETE post with database error");
    // First create a post to have a valid ID
    const createResponse = await request(app)
      .post("/post")
      .set("Authorization", `Bearer ${userAData.token}`)
      .send({ title: "Post for error test", senderID: "sender" });
    const postId = createResponse.body._id;

    const originalFindById = Post.findById;
    Post.findById = jest.fn().mockImplementation(() => {
      throw new Error("Database delete error");
    });

    const response = await request(app)
      .delete(`/post/${postId}`)
      .set("Authorization", `Bearer ${userAData.token}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Database delete error");

    Post.findById = originalFindById;

    // Clean up - delete the post normally
    await Post.findByIdAndDelete(postId);
  });

  test("test putPost handles database error", async () => {
    console.log("Test: PUT post with database error");
    // First create a post to have a valid ID
    const createResponse = await request(app)
      .post("/post")
      .set("Authorization", `Bearer ${userAData.token}`)
      .send({ title: "Post for update error test", senderID: "sender" });
    const postId = createResponse.body._id;

    const originalFindById = Post.findById;
    Post.findById = jest.fn().mockImplementation(() => {
      throw new Error("Database update error");
    });

    const response = await request(app)
      .put(`/post/${postId}`)
      .set("Authorization", `Bearer ${userAData.token}`)
      .send({ title: "Updated Title", senderID: "sender" });

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Database update error");

    Post.findById = originalFindById;

    // Clean up
    await Post.findByIdAndDelete(postId);
  });
});
