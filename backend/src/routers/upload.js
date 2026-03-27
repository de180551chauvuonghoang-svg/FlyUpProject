import express from "express";
import multer from "multer";
import { authenticateJWT } from "../middleware/authMiddleware.js";
import {
  uploadVideoController,
  uploadDocumentController,
  uploadThumbnailController,
  getLectureMaterials,
  deleteMaterial,
} from "../controllers/uploadController.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size (Supabase free tier default)
  },
});

/**
 * @route   POST /api/upload/video
 * @desc    Upload video file for lecture
 * @access  Private (Instructor only)
 * @body    multipart/form-data { file, lectureId? }
 */
router.post(
  "/video",
  authenticateJWT,
  upload.single("file"),
  uploadVideoController,
);

/**
 * @route   POST /api/upload/document
 * @desc    Upload document file for lecture
 * @access  Private (Instructor only)
 * @body    multipart/form-data { file, lectureId? }
 */
router.post(
  "/document",
  authenticateJWT,
  upload.single("file"),
  uploadDocumentController,
);

/**
 * @route   POST /api/upload/thumbnail
 * @desc    Upload course thumbnail
 * @access  Private (Instructor only)
 * @body    multipart/form-data { file, courseId? }
 */
router.post(
  "/thumbnail",
  authenticateJWT,
  upload.single("file"),
  uploadThumbnailController,
);

/**
 * @route   GET /api/upload/lecture/:lectureId/materials
 * @desc    Get all materials for a lecture
 * @access  Private
 */
router.get(
  "/lecture/:lectureId/materials",
  authenticateJWT,
  getLectureMaterials,
);

/**
 * @route   DELETE /api/upload/material/:lectureId/:materialId
 * @desc    Delete a material
 * @access  Private (Instructor only)
 */
router.delete(
  "/material/:lectureId/:materialId",
  authenticateJWT,
  deleteMaterial,
);

export default router;
