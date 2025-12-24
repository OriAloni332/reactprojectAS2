import request from "supertest";
import intApp from "../index";
import Post from "../model/postModel";
import User from "../model/userModel";
import { Express } from "express";
import { postsData, cleanupTestData, userData } from "./testUtils";

let app: Express;
let authToken: string;

beforeAll(async () => {
  app = await intApp();
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
