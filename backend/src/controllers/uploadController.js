import {
  uploadVideo,
  uploadDocument,
  uploadThumbnail,
  deleteFile,
} from "../services/storageService.js";
import prisma from "../lib/prisma.js";
import { safeDel } from "../lib/cache.js";

/**
 * Upload video for lecture
 * POST /api/upload/video
 * Body: multipart/form-data with 'file' field
 * Query: lectureId (optional - if updating existing lecture)
 */
export async function uploadVideoController(req, res) {
  try {
    console.log("[UPLOAD_VIDEO_START]", {
      timestamp: new Date().toISOString(),
      file: req.file
        ? { name: req.file.originalname, size: req.file.size }
        : null,
      lectureId: req.body.lectureId,
    });

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
      console.log("[UPLOAD_VIDEO] Invalid mime type:", req.file.mimetype);
      return res.status(400).json({
        error: "Invalid file type. Only MP4, MPEG, MOV, AVI are allowed",
      });
    }

    // Upload to Supabase
    console.log("[UPLOAD_VIDEO] Uploading to Supabase...");
    const result = await uploadVideo(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );
    console.log("[UPLOAD_VIDEO] Supabase response:", {
      url: result.url.substring(0, 100),
      path: result.path,
    });

    // DEBUG: Log lectureId status
    console.log("[UPLOAD_VIDEO] lectureId received:", {
      value: lectureId,
      type: typeof lectureId,
      isEmpty: !lectureId,
      isString: typeof lectureId === 'string',
    });

    // If lectureId provided, save to database
    if (lectureId) {
      console.log("[UPLOAD_VIDEO] Checking lecture:", lectureId);
      // Verify lecture exists and get course ID
      const lecture = await prisma.lectures.findUnique({
        where: { Id: lectureId },
        include: {
          Sections: {
            select: { CourseId: true },
          },
        },
      });

      if (!lecture) {
        console.log("[UPLOAD_VIDEO] Lecture not found:", lectureId);
        return res.status(404).json({ error: "Lecture not found" });
      }

      console.log("[UPLOAD_VIDEO] Lecture found, deleting old videos...");
      // Delete old video if exists (1 lecture can only have 1 video)
      const deleted = await prisma.lectureMaterial.deleteMany({
        where: {
          LectureId: lectureId,
          Type: {
            equals: "video",
            mode: "insensitive",
          },
        },
      });
      console.log("[UPLOAD_VIDEO] Old videos deleted:", deleted.count);

      console.log("[UPLOAD_VIDEO] Creating new material record...");
      // Save new video to LectureMaterial
      const newMaterial = await prisma.lectureMaterial.create({
        data: {
          LectureId: lectureId,
          Type: "video",
          Url: result.url,
        },
      });

      // Update lecture duration if provided
      const duration = parseInt(req.body.duration);
      if (!isNaN(duration) && duration > 0) {
        console.log(`[UPLOAD_VIDEO] Updating lecture ${lectureId} duration to ${duration}`);
        await prisma.lectures.update({
          where: { Id: lectureId },
          data: { Duration: duration },
        });
      }

      console.log("[UPLOAD_VIDEO] Material created:", {
        LectureId: newMaterial.LectureId,
        Id: newMaterial.Id,
        Type: newMaterial.Type,
      });

      // Update coarse status to require re-approval
      const courseId = lecture.Sections.CourseId;
      await prisma.courses.update({
        where: { Id: courseId },
        data: { ApprovalStatus: "None", Status: "Draft" },
      });
      await safeDel(`course:${courseId}`);
      console.log(`[UPLOAD_VIDEO] Cache invalidated and status reset for course: ${courseId}`);
    } else {
      console.log("[UPLOAD_VIDEO] ⚠️ WARNING: lectureId NOT provided!");
      console.log("[UPLOAD_VIDEO] File uploaded to storage but NOT saved to database!");
      console.log("[UPLOAD_VIDEO] Request body:", req.body);
    }

    console.log("[UPLOAD_VIDEO_END] Success");
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
    console.error("[UPLOAD_VIDEO_ERROR]", {
      message: error.message,
      stack: error.stack,
    });
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
        include: {
          Sections: {
            select: { CourseId: true },
          },
        },
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

      // Update coarse status to require re-approval
      const courseId = lecture.Sections.CourseId;
      await prisma.courses.update({
        where: { Id: courseId },
        data: { ApprovalStatus: "None", Status: "Draft" },
      });
      await safeDel(`course:${courseId}`);
      console.log(
        `[Cache] Invalidated cache and reset status for course after material upload: ${courseId}`,
      );
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
        data: { ThumbUrl: result.url, ApprovalStatus: "None", Status: "Draft" },
      });
      // Invalidate cache
      await safeDel(`course:${courseId}`);
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

    // Get course ID to reset status
    const lecture = await prisma.lectures.findUnique({
      where: { Id: lectureId },
      include: { Sections: true },
    });
    if (lecture) {
      const courseId = lecture.Sections.CourseId;
      await prisma.courses.update({
        where: { Id: courseId },
        data: { ApprovalStatus: "None", Status: "Draft" },
      });
      await safeDel(`course:${courseId}`);
    }

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
