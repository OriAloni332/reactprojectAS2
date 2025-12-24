import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Post & Comments REST API",
            version: "1.0.0",
            description: "A REST API for managing posts and comments with user authentication",
            contact: {
                name: "API Support",
                email: "developer@example.com",
            },
        },
        servers: [
            {
                url: process.env.BASE_URL || "http://localhost:3000",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "JWT authorization header using the Bearer scheme",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        _id: {
                            type: "string",
                            description: "User unique identifier",
                            example: "507f1f77bcf86cd799439011",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "User email address",
                            example: "user@example.com",
                        },
                        password: {
                            type: "string",
                            minLength: 6,
                            description: "User password (hashed when stored)",
                            example: "password123",
                        },
                    },
                },
                Post: {
                    type: "object",
                    required: ["title", "senderID", "owner"],
                    properties: {
                        _id: {
                            type: "string",
                            description: "Post unique identifier",
                            example: "507f1f77bcf86cd799439011",
                        },
                        title: {
                            type: "string",
                            description: "Post title",
                            example: "My First Post",
                        },
                        senderID: {
                            type: "string",
                            description: "ID of the sender",
                            example: "user123",
                        },
                        owner: {
                            type: "string",
                            description: "ID of the user who created this post",
                            example: "507f1f77bcf86cd799439011",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            description: "Post creation timestamp",
                            example: "2024-01-15T10:30:00Z",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                            description: "Post last update timestamp",
                            example: "2024-01-15T10:30:00Z",
                        },
                    },
                },
                PostInput: {
                    type: "object",
                    required: ["title", "senderID"],
                    properties: {
                        title: {
                            type: "string",
                            description: "Post title",
                            example: "My First Post",
                        },
                        senderID: {
                            type: "string",
                            description: "ID of the sender",
                            example: "user123",
                        },
                    },
                },
                Comment: {
                    type: "object",
                    required: ["postId", "content", "author", "owner"],
                    properties: {
                        _id: {
                            type: "string",
                            description: "Comment unique identifier",
                            example: "507f1f77bcf86cd799439011",
                        },
                        postId: {
                            type: "string",
                            description: "ID of the post this comment belongs to",
                            example: "507f1f77bcf86cd799439011",
                        },
                        content: {
                            type: "string",
                            description: "Comment content",
                            example: "Great post! Very informative.",
                        },
                        author: {
                            type: "string",
                            description: "Name or ID of the comment author",
                            example: "John Doe",
                        },
                        owner: {
                            type: "string",
                            description: "ID of the user who wrote this comment",
                            example: "507f1f77bcf86cd799439011",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            description: "Comment creation timestamp",
                            example: "2024-01-15T10:30:00Z",
                        },
                    },
                },
                CommentInput: {
                    type: "object",
                    required: ["content", "author"],
                    properties: {
                        content: {
                            type: "string",
                            description: "Comment content",
                            example: "Great post! Very informative.",
                        },
                        author: {
                            type: "string",
                            description: "Name or ID of the comment author",
                            example: "John Doe",
                        },
                    },
                },
                LoginRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "user@example.com",
                        },
                        password: {
                            type: "string",
                            example: "password123",
                        },
                    },
                },
                RegisterRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "user@example.com",
                        },
                        password: {
                            type: "string",
                            minLength: 6,
                            example: "password123",
                        },
                    },
                },
                AuthResponse: {
                    type: "object",
                    properties: {
                        token: {
                            type: "string",
                            description: "JWT access token",
                            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        },
                        refreshToken: {
                            type: "string",
                            description: "JWT refresh token",
                            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        },
                        _id: {
                            type: "string",
                            description: "User ID",
                            example: "507f1f77bcf86cd799439011",
                        },
                    },
                },
                RefreshTokenRequest: {
                    type: "object",
                    required: ["refreshToken"],
                    properties: {
                        refreshToken: {
                            type: "string",
                            description: "Valid refresh token",
                            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        },
                    },
                },
                Error: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            description: "Error message",
                            example: "An error occurred",
                        },
                        error: {
                            type: "string",
                            description: "Error details",
                            example: "Invalid credentials",
                        },
                    },
                },
                ValidationError: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            example: "Validation failed",
                        },
                        errors: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    field: {
                                        type: "string",
                                        example: "email",
                                    },
                                    message: {
                                        type: "string",
                                        example: "Invalid email format",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                UnauthorizedError: {
                    description: "Access token is missing or invalid",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                            example: {
                                error: "Unauthorized",
                            },
                        },
                    },
                },
                NotFoundError: {
                    description: "The specified resource was not found",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                            example: {
                                error: "Resource not found",
                            },
                        },
                    },
                },
                ForbiddenError: {
                    description: "User does not have permission to perform this action",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                            example: {
                                error: "Forbidden: You are not the owner of this resource",
                            },
                        },
                    },
                },
                ValidationError: {
                    description: "Validation error",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ValidationError",
                            },
                        },
                    },
                },
                ServerError: {
                    description: "Internal server error",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                            example: {
                                error: "Internal server error",
                            },
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [
        "./src/routes/*.ts",
        "./src/controllers/*.ts",
        "./dist/src/routes/*.js",
        "./dist/src/controllers/*.js",
    ],
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };
