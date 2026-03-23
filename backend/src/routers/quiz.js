import express from "express";
import * as quizController from "../controllers/quizController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get list of assignments for a course
router.get("/course/:courseId/assignments", quizController.getAssignmentsByCourse);

// Get submission history for user + assignment
router.get("/assignment/:assignmentId/submissions", quizController.getSubmissionHistory);

// Get quiz questions for a course (public, anyone can view)
router.get("/:courseId/questions", quizController.getQuizQuestions);

// Submit quiz answers (requires authentication)
router.post("/:courseId/submit", authenticateJWT, quizController.submitQuiz);

// CAT routes
router.post("/cat/start", authenticateJWT, quizController.startCatQuiz);
router.post("/cat/answer", authenticateJWT, quizController.answerCatQuestion);
router.post("/cat/finish", authenticateJWT, quizController.finishCatQuiz);
router.post("/cat/explain", authenticateJWT, quizController.explainQuizAnswer);
router.post("/assignments/from-bank", authenticateJWT, quizController.createAssignmentFromBank);
router.get("/course/:courseId/sections", authenticateJWT, quizController.getSectionsByCourseForInstructor);
router.get("/question-bank/:questionBankId/assignments", authenticateJWT, quizController.getAssignmentsByQuestionBank);
router.get("/assignments/:assignmentId/preview", authenticateJWT, quizController.getAssignmentSnapshotDetail);
export default router;