import express from "express";
import * as quizController from "../controllers/quizController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get quiz questions for a course (public, anyone can view)
router.get("/:courseId/questions", quizController.getQuizQuestions);

// Submit quiz answers (requires authentication)
router.post("/:courseId/submit", authenticateJWT, quizController.submitQuiz);

export default router;
