import express from "express";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import * as questionBankController from "../controllers/questionBankController.js";

const router = express.Router();

router.get("/", authenticateJWT, questionBankController.getQuestionBanks);
router.get("/meta/courses", authenticateJWT, questionBankController.getQuestionBankCourses);
router.get("/:id", authenticateJWT, questionBankController.getQuestionBankDetail);
router.post("/", authenticateJWT, questionBankController.createQuestionBank);

export default router;