import request from "supertest";
import intApp from "../index";
import { Express } from "express";
import User from "../model/userModel";
import Post from "../model/postModel";
import jwt from "jsonwebtoken";
import { userData, singlePostData } from "./testUtils";

let app: Express;
beforeAll(async () => {
    app = await intApp();
    await User.deleteMany({});
    await Post.deleteMany({});
});

afterAll((done) => {
    done();
});

describe("Auth API", () => {
    test("access restricted url denied", async () => {
        const response = await request(app).post("/post").send(singlePostData);
        expect(response.statusCode).toBe(401);
    });

    test("test register with missing email", async () => {
        const response = await request(app).post("/auth/register").send({
            username: userData.username,
            password: userData.password
        });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test register with missing password", async () => {
        const response = await request(app).post("/auth/register").send({
            username: userData.username,
            email: userData.email
        });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test register", async () => {
        const response = await request(app).post("/auth/register").send({
            username: userData.username,
            email: userData.email,
            password: userData.password
        });
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("token");
        expect(response.body).toHaveProperty("refreshToken");
        userData._id = response.body._id;
        userData.token = response.body.token;
        userData.refreshToken = response.body.refreshToken;
    });

    test("test register with duplicate email", async () => {
        const response = await request(app).post("/auth/register").send({
            username: userData.username,
            email: userData.email,
            password: userData.password
        });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test access with token permitted1", async () => {
        const response = await request(app).post("/post")
            .set("Authorization", "Bearer " + userData.token)
            .send(singlePostData);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("_id");
    });

    test("test access with modified token restricted", async () => {
        const newToken = userData.token + "m";
        const response = await request(app).post("/post")
            .set("Authorization", "Bearer " + newToken)
            .send(singlePostData);
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test login with missing email", async () => {
        const response = await request(app).post("/auth/login").send({
            password: userData.password
        });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    test("test login with missing password", async () => {
        const response = await request(app).post("/auth/login").send({
            email: userData.email
        });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    test("test login with wrong email", async () => {
        const response = await request(app).post("/auth/login").send({
            email: "wrong@example.com",
            password: userData.password
        });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    test("test login with wrong password", async () => {
        const response = await request(app).post("/auth/login").send({
            email: userData.email,
            password: "wrongpassword"
        });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    test("test login", async () => {
        const response = await request(app).post("/auth/login").send({
            email: userData.email,
            password: userData.password
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("token");
        expect(response.body).toHaveProperty("refreshToken");
        userData.token = response.body.token;
        userData.refreshToken = response.body.refreshToken;
    });

    test("test access with token permitted2", async () => {
        const response = await request(app).post("/post")
            .set("Authorization", "Bearer " + userData.token)
            .send(singlePostData);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("_id");
        singlePostData._id = response.body._id;
    });

    //set jest timeout to 10s
    jest.setTimeout(10000);

    test("test token expiration", async () => {
        // Assuming the token expiration is set to 5 second for testing purposes
        delete singlePostData._id;
        await new Promise(resolve => setTimeout(resolve, 6000)); // wait for 6 seconds
        const response = await request(app).post("/post")
            .set("Authorization", "Bearer " + userData.token)
            .send(singlePostData);
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");

        //get new token using refresh token
        const refreshResponse = await request(app).post("/auth/refresh-token").send({
            refreshToken: userData.refreshToken
        });
        expect(refreshResponse.statusCode).toBe(200);
        expect(refreshResponse.body).toHaveProperty("token");
        expect(refreshResponse.body).toHaveProperty("refreshToken");
        userData.token = refreshResponse.body.token;
        userData.refreshToken = refreshResponse.body.refreshToken;

        //access with new token
        const newAccessResponse = await request(app).post("/post")
            .set("Authorization", "Bearer " + userData.token)
            .send(singlePostData);
        console.log(newAccessResponse.body);
        expect(newAccessResponse.statusCode).toBe(201);
        expect(newAccessResponse.body).toHaveProperty("_id");
    });

    test("test refresh token with missing token", async () => {
        const response = await request(app).post("/auth/refresh-token").send({});
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    test("test refresh token with invalid token", async () => {
        const response = await request(app).post("/auth/refresh-token").send({
            refreshToken: "invalidtoken123"
        });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
    });

    //test double use of refresh token
    test("test double use of refresh token", async () => {
        //get new token using refresh token
        const refreshResponse1 = await request(app).post("/auth/refresh-token").send({
            refreshToken: userData.refreshToken
        });
        expect(refreshResponse1.statusCode).toBe(200);
        expect(refreshResponse1.body).toHaveProperty("token");
        expect(refreshResponse1.body).toHaveProperty("refreshToken");
        const firstNewRefreshToken = refreshResponse1.body.refreshToken;

        //try to use the same refresh token again
        const refreshResponse2 = await request(app).post("/auth/refresh-token").send({
            refreshToken: userData.refreshToken
        });
        expect(refreshResponse2.statusCode).toBe(401);
        expect(refreshResponse2.body).toHaveProperty("error");

        //try to use the new refresh token to see that it is blocked
        const refreshResponse3 = await request(app).post("/auth/refresh-token").send({
            refreshToken: firstNewRefreshToken
        });
        expect(refreshResponse3.statusCode).toBe(401);
        expect(refreshResponse3.body).toHaveProperty("error");
    });

    // Logout tests
    test("test logout with missing refresh token", async () => {
        const response = await request(app).post("/auth/logout").send({});
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Refresh token is required");
    });

    test("test logout with invalid refresh token", async () => {
        const response = await request(app).post("/auth/logout").send({
            refreshToken: "invalidtoken123"
        });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Logout failed");
    });

    test("test logout with valid refresh token", async () => {
        // First, get a fresh token to logout with
        const loginResponse = await request(app).post("/auth/login").send({
            email: userData.email,
            password: userData.password
        });
        expect(loginResponse.statusCode).toBe(200);
        const logoutRefreshToken = loginResponse.body.refreshToken;

        // Now logout with this refresh token
        const response = await request(app).post("/auth/logout").send({
            refreshToken: logoutRefreshToken
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toBe("Logged out successfully");

        // Verify the refresh token is no longer valid
        const refreshResponse = await request(app).post("/auth/refresh-token").send({
            refreshToken: logoutRefreshToken
        });
        expect(refreshResponse.statusCode).toBe(401);
        expect(refreshResponse.body).toHaveProperty("error");
    });

    test("test double logout with same refresh token", async () => {
        // First, get a fresh token
        const loginResponse = await request(app).post("/auth/login").send({
            email: userData.email,
            password: userData.password
        });
        expect(loginResponse.statusCode).toBe(200);
        const logoutRefreshToken = loginResponse.body.refreshToken;

        // First logout should succeed
        const firstLogout = await request(app).post("/auth/logout").send({
            refreshToken: logoutRefreshToken
        });
        expect(firstLogout.statusCode).toBe(200);
        expect(firstLogout.body.message).toBe("Logged out successfully");

        // Second logout with same token also succeeds (idempotent)
        // but the token is already removed, so it has no effect
        const secondLogout = await request(app).post("/auth/logout").send({
            refreshToken: logoutRefreshToken
        });
        expect(secondLogout.statusCode).toBe(200);
        expect(secondLogout.body.message).toBe("Logged out successfully");

        // Verify the token cannot be used for refresh (this is the real security check)
        const refreshResponse = await request(app).post("/auth/refresh-token").send({
            refreshToken: logoutRefreshToken
        });
        expect(refreshResponse.statusCode).toBe(401);
        expect(refreshResponse.body).toHaveProperty("error");
    });
});

// Edge Case Tests: Deleted User Scenarios (covers lines 97, 114, 150)
describe("Auth API - Deleted User Edge Cases", () => {
    const deletedUserData = {
        username: "deletedUser",
        email: "deleted@test.com",
        password: "deletedPassword123"
    };

    test("test refreshToken with deleted user returns 401 (line 114)", async () => {
        // Register a user
        const registerResponse = await request(app).post("/auth/register").send(deletedUserData);
        expect(registerResponse.statusCode).toBe(201);
        const userId = registerResponse.body._id;
        const refreshToken = registerResponse.body.refreshToken;

        // Delete the user from the database
        await User.findByIdAndDelete(userId);

        // Try to use the refresh token - user no longer exists
        const refreshResponse = await request(app).post("/auth/refresh-token").send({
            refreshToken: refreshToken
        });

        expect(refreshResponse.statusCode).toBe(401);
        expect(refreshResponse.body).toHaveProperty("error");
        expect(refreshResponse.body.error).toBe("Invalid refresh token");
    });

    test("test logout with deleted user returns 401 (line 150)", async () => {
        // Register a new user
        const newUser = {
            username: "anotherDeletedUser",
            email: "anotherdeleted@test.com",
            password: "anotherPassword123"
        };
        const registerResponse = await request(app).post("/auth/register").send(newUser);
        expect(registerResponse.statusCode).toBe(201);
        const userId = registerResponse.body._id;
        const refreshToken = registerResponse.body.refreshToken;

        // Delete the user from the database
        await User.findByIdAndDelete(userId);

        // Try to logout - user no longer exists
        const logoutResponse = await request(app).post("/auth/logout").send({
            refreshToken: refreshToken
        });

        expect(logoutResponse.statusCode).toBe(401);
        expect(logoutResponse.body).toHaveProperty("error");
        expect(logoutResponse.body.error).toBe("Invalid refresh token");
    });
});

// Database Error Tests (covers line 97 - login catch block)
describe("Auth API - Database Error Handling", () => {
    test("test login handles database error (line 97)", async () => {
        console.log("Test: Login with database error");
        const originalFindOne = User.findOne;
        User.findOne = jest.fn().mockImplementation(() => {
            throw new Error("Database connection failed");
        });

        const response = await request(app).post("/auth/login").send({
            email: userData.email,
            password: userData.password
        });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Login failed");

        User.findOne = originalFindOne;
    });
});
