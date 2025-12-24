import express = require('express');
import mongoose = require('mongoose');
import postRoutes = require('./routes/postRoutes');
import commentRoutes = require('./routes/commentRoutes');

const app = express();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not defined');
  process.exit(1);
}

mongoose.connect(MONGODB_URI);

const db = mongoose.connection;
db.on("error", (error: Error) => {
  console.error(error);
});
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes
app.use("/post", postRoutes);
app.use("/comment", commentRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
