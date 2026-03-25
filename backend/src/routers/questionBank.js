import express from "express";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import * as questionBankController from "../controllers/questionBankController.js";
import * as quizController from "../controllers/quizController.js";

const router = express.Router();

router.get("/", authenticateJWT, questionBankController.getQuestionBanks);
router.get("/meta/courses", authenticateJWT, questionBankController.getQuestionBankCourses);
router.get("/published/by-course", authenticateJWT, questionBankController.getPublishedQuestionBanksByCourse);

router.patch("/:id", authenticateJWT, questionBankController.updateQuestionBank);
router.post("/:id/archive", authenticateJWT, questionBankController.archiveQuestionBank);
router.post("/:id/restore", authenticateJWT, questionBankController.restoreQuestionBank);

router.get("/:id/questions", authenticateJWT, questionBankController.getQuestionBankQuestions);
router.post("/:id/questions", authenticateJWT, questionBankController.createQuestionBankQuestion);
router.patch("/:id/questions/:questionId", authenticateJWT, questionBankController.updateQuestionBankQuestion);
router.delete("/:id/questions/:questionId", authenticateJWT, questionBankController.deleteQuestionBankQuestion);

router.post("/:id/publish", authenticateJWT, questionBankController.publishQuestionBank);
router.post("/:id/unpublish", authenticateJWT, questionBankController.unpublishQuestionBank);

router.get("/:id", authenticateJWT, questionBankController.getQuestionBankDetail);
router.post("/", authenticateJWT, questionBankController.createQuestionBank);
export default router;
