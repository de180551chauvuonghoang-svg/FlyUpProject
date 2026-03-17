import {
  uploadVideo,
  uploadDocument,
  uploadThumbnail,
  deleteFile,
} from "../services/storageService.js";
import prisma from "../lib/prisma.js";

/**
 * Upload video for lecture
 * POST /api/upload/video
 * Body: multipart/form-data with 'file' field
 * Query: lectureId (optional - if updating existing lecture)
 */
export async function uploadVideoController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { lectureId } = req.body;

    // Validate file type
    const allowedMimeTypes = [
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-msvideo",
    ];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: "Invalid file type. Only MP4, MPEG, MOV, AVI are allowed",
      });
    }

    // Upload to Supabase
    const result = await uploadVideo(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );

    // If lectureId provided, save to database
    if (lectureId) {
      // Verify lecture exists
      const lecture = await prisma.lectures.findUnique({
        where: { Id: lectureId },
      });

      if (!lecture) {
        return res.status(404).json({ error: "Lecture not found" });
      }

      // Save to LectureMaterial
      await prisma.lectureMaterial.create({
        data: {
          LectureId: lectureId,
          Type: "video",
          Url: result.url,
        },
      });
    }

    res.json({
      success: true,
      message: "Video uploaded successfully",
      data: {
        url: result.url,
        path: result.path,
        type: "video",
      },
    });
  } catch (error) {
    console.error("Video upload error:", error);
    res.status(500).json({
      error: "Upload failed",
      message: error.message,
    });
  }
}

/**
 * Upload document/file for lecture
 * POST /api/upload/document
 */
export async function uploadDocumentController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { lectureId } = req.body;

    // Validate file type
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error:
          "Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, TXT are allowed",
      });
    }

    // Upload to Supabase
    const result = await uploadDocument(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );

    // If lectureId provided, save to database
    if (lectureId) {
      const lecture = await prisma.lectures.findUnique({
        where: { Id: lectureId },
      });

      if (!lecture) {
        return res.status(404).json({ error: "Lecture not found" });
      }

      await prisma.lectureMaterial.create({
        data: {
          LectureId: lectureId,
          Type: "document",
          Url: result.url,
        },
      });
    }

    res.json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        url: result.url,
        path: result.path,
        type: "document",
      },
    });
  } catch (error) {
    console.error("Document upload error:", error);
    res.status(500).json({
      error: "Upload failed",
      message: error.message,
    });
  }
}

/**
 * Upload course thumbnail
 * POST /api/upload/thumbnail
 */
export async function uploadThumbnailController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { courseId } = req.body;

    // Validate file type
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: "Invalid file type. Only JPG, PNG, WEBP are allowed",
      });
    }

    // Upload to Supabase
    const result = await uploadThumbnail(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );

    // If courseId provided, update course thumbnail
    if (courseId) {
      const course = await prisma.courses.findUnique({
        where: { Id: courseId },
      });

      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      await prisma.courses.update({
        where: { Id: courseId },
        data: { ThumbUrl: result.url },
      });
    }

    res.json({
      success: true,
      message: "Thumbnail uploaded successfully",
      data: {
        url: result.url,
        path: result.path,
        type: "thumbnail",
      },
    });
  } catch (error) {
    console.error("Thumbnail upload error:", error);
    res.status(500).json({
      error: "Upload failed",
      message: error.message,
    });
  }
}

/**
 * Get lecture materials
 * GET /api/upload/lecture/:lectureId/materials
 */
export async function getLectureMaterials(req, res) {
  try {
    const { lectureId } = req.params;

    const materials = await prisma.lectureMaterial.findMany({
      where: { LectureId: lectureId },
      orderBy: { Id: "asc" },
    });

    res.json({
      success: true,
      data: materials,
    });
  } catch (error) {
    console.error("Get materials error:", error);
    res.status(500).json({
      error: "Failed to fetch materials",
      message: error.message,
    });
  }
}

/**
 * Delete material
 * DELETE /api/upload/material/:lectureId/:materialId
 */
export async function deleteMaterial(req, res) {
  try {
    const { lectureId, materialId } = req.params;

    // Get material info
    const material = await prisma.lectureMaterial.findFirst({
      where: {
        LectureId: lectureId,
        Id: parseInt(materialId),
      },
    });

    if (!material) {
      return res.status(404).json({ error: "Material not found" });
    }

    // Extract path from URL (simplified - adjust based on your URL structure)
    const urlParts = material.Url.split("/");
    const filePath = urlParts[urlParts.length - 1];

    // Determine bucket based on type
    let bucketName;
    if (material.Type === "video") {
      bucketName = "course-videos";
    } else if (material.Type === "document") {
      bucketName = "course-documents";
    } else {
      bucketName = "course-thumbnails";
    }

    // Delete from Supabase
    await deleteFile(filePath, bucketName);

    // Delete from database
    await prisma.lectureMaterial.delete({
      where: {
        LectureId_Id: {
          LectureId: lectureId,
          Id: parseInt(materialId),
        },
      },
    });

    res.json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error) {
    console.error("Delete material error:", error);
    res.status(500).json({
      error: "Delete failed",
      message: error.message,
    });
  }
}

export default {
  uploadVideoController,
  uploadDocumentController,
  uploadThumbnailController,
  getLectureMaterials,
  deleteMaterial,
};
