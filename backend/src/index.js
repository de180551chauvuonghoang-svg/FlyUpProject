import express from "express";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Import routers
import authRouter from "./routers/auth.js";
import usersRouter from "./routers/users.js";
import checkoutRouter from "./routers/checkout.js";
import coursesRouter from "./routers/courses.js";
import commentRouter from "./routers/comments.js";
import wishlistRouter from "./routers/wishlist.js";
import transactionRouter from "./routers/transactions.js";
import uploadRouter from "./routers/upload.js";
import quizRouter from "./routers/quiz.js";
import { getCourses, getCategories } from "./services/courseService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = dotenv.config({ path: join(__dirname, "../.env") });

if (result.error) {
  console.error("DOTENV LOAD ERROR:", result.error);
} else {
  console.log("DOTENV LOADED VARS:", Object.keys(result.parsed));
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(compression());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests from localhost on any port (5173, 5174, 5175, etc.)
      // Or from the FRONTEND_URL env variable
      const allowedOrigins = [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://localhost:3001",
      ];

      // Also allow if origin matches the pattern
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (origin && origin.startsWith("http://localhost:"))
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Allow in development
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use("/public", express.static(join(__dirname, "../public")));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "FlyUp Backend is running!" });
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/comments", commentRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/quiz", quizRouter);

// Error handling middleware

app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Invalid JSON format. Please check your request body.",
    });
  }

  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FlyUp Backend running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);

  // Warm up cache
  (async () => {
    try {
      console.log("🔥 Warming up cache...");
      console.log("🔥 Warming up cache...");
      // Run sequentially to avoid DB connection timeout
      await getCategories();
      await getCourses({ page: 1, limit: 12 });
      console.log("✅ Cache warmed up successfully!");
    } catch (error) {
      console.warn(
        "⚠️ Cache warmup partial failure (non-critical):",
        error.message,
      );
    }
  })();
});

export default app;
