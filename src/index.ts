import express, { Express } from 'express';
import mongoose = require('mongoose');
import postRoutes = require('./routes/postRoutes');
import commentRoutes = require('./routes/commentRoutes');
import authRoutes from './routes/authRoutes';

const intApp = (): Promise<Express> => {
  const promise = new Promise<Express>((resolve, reject) => {
    const app = express();

    // Middleware
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

    // Routes
    app.use("/auth", authRoutes);
    app.use("/post", postRoutes);
    app.use("/comment", commentRoutes);

    // MongoDB connection
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not defined');
      reject(new Error('MONGODB_URI is not defined'));
      return;
    }

    mongoose.connect(MONGODB_URI).then(() => {
      resolve(app);
    }).catch((error) => {
      console.error('MongoDB connection error:', error);
      reject(error);
    });

    const db = mongoose.connection;
    db.on("error", (error: Error) => {
      console.error(error);
    });
    db.once("open", () => {
      console.log("Connected to MongoDB");
    });
  });

  return promise;
};

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  intApp().then((app) => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  }).catch((error) => {
    console.error('Failed to initialize app:', error);
    process.exit(1);
  });
}

export = intApp;
