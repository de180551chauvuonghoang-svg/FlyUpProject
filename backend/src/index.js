import dns from "node:dns";
import express from "express";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables as early as possible
const result = dotenv.config({ path: join(__dirname, "../.env") });

if (result.error) {
  if (result.error.code !== "ENOENT") {
    console.error("DOTENV LOAD ERROR:", result.error);
  }
} else {
  console.log("DOTENV LOADED VARS:", Object.keys(result.parsed));
}

// Force IPv4 for DNS resolution to avoid ENOTFOUND with Gmail API on some networks
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (error) {
  // Ignore if not supported (older node versions)
  console.log("Note: dns.setDefaultResultOrder not supported or failed");
}

// Import routers (after environment variables are loaded)
import authRouter from "./routers/auth.js";
import usersRouter from "./routers/users.js";
import checkoutRouter from "./routers/checkout.js";
import coursesRouter from "./routers/courses.js";
import commentRouter from "./routers/comments.js";
import wishlistRouter from "./routers/wishlist.js";
import transactionRouter from "./routers/transactions.js";
import adminRouter from "./routers/admin.js";
import chatbotRouter from "./routers/ai/chatbot.js";
import recommendationsRouter from "./routers/ai/aiCourseRecommendationsRouter.js";
import quizGenerationRouter from "./routers/ai/aiQuizGenerationRouter.js";
import aiQuestionBankGenerationRouter from "./routers/ai/aiQuestionBankGenerationRouter.js";
import aiAgentRouter from "./routers/ai/aiAgentRouter.js";
import * as courseCache from "./services/courseCacheService.js";
import quizRouter from "./routers/quiz.js";
import uploadRouter from "./routers/upload.js";
import { getCourses, getCategories } from "./services/courseService.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./configs/swagger.js";
//import routers question bank
import questionBankRouter from './routers/questionBank.js';
import payoutRouter from "./routers/payout.js";

// Dynamic import worker after env vars are loaded to ensure Redis connection works
import("./workers/emailWorker.js").catch((err) =>
  console.error("Failed to start email worker:", err),
);

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',  // Frontend
  'http://localhost:3000',
  'https://fly-up-project.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

// Middleware
app.use(compression());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use("/public", express.static(join(__dirname, "../public")));

// Support BigInt in JSON.stringify (important for Prisma)
BigInt.prototype.toJSON = function() {
  return this.toString();
};

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
app.use("/api/admin", adminRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/ai/quiz", quizGenerationRouter);
app.use("/api/ai/question-bank", aiQuestionBankGenerationRouter);
app.use("/api/ai/agent", aiAgentRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/upload", uploadRouter);

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Question Bank Routes
app.use("/api/question-banks", questionBankRouter);
// Payout Routes
app.use("/api/payouts", payoutRouter);

// Error handling middleware

app.use((err, req, res, next) => {
  console.error(err.stack);

  // Temporary file logging for debugging
  try {
    import('fs').then(fs => {
       fs.appendFileSync('./backend_error.log', `\n[${new Date().toISOString()}] ${req.method} ${req.url}\n${err.stack}\n`);
    });
  } catch (e) {}


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
const server = app.listen(PORT, () => {
  console.log(`🚀 FlyUp Backend running on http://localhost:${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);

  // Warm up cache
  (async () => {
    try {
      console.log("🔥 Warming up cache...");
      // Run sequentially to avoid DB connection timeout
      await getCategories();
      await getCourses({ page: 1, limit: 12 });
      
      // Warm up chatbot course cache
      await courseCache.refreshCache();
      
      console.log("✅ Cache warmed up successfully!");
    } catch (error) {
      console.warn(
        "⚠️ Cache warmup partial failure (non-critical):",
        error.message,
      );
    }
  })();
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("\n🛑 Received kill signal, shutting down gracefully");
  
  // Close the server first to stop accepting new requests
  server.close(async () => {
    console.log("✅ Server closed. Port released.");
    try {
      // Disconnect Prisma
      await import("./lib/prisma.js").then((m) => m.default.$disconnect());
      console.log("✅ Prisma disconnected");
      process.exit(0);
    } catch (err) {
      console.error("❌ Error during Prisma disconnect:", err);
      process.exit(1);
    }
  });

  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 5000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
process.on("SIGUSR2", gracefulShutdown);

export default app;
