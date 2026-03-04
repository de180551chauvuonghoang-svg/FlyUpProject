import { supabaseAdmin } from "../configs/supabase.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Supabase Storage Service
 * Handles file uploads to Supabase Storage buckets
 */

// Bucket names
const BUCKETS = {
  VIDEOS: "course-videos",
  DOCUMENTS: "course-documents",
  THUMBNAILS: "course-thumbnails",
};

/**
 * Upload file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} bucketName - Bucket to upload to
 * @param {string} mimeType - File MIME type
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadToSupabase(
  fileBuffer,
  fileName,
  bucketName,
  mimeType,
) {
  try {
    // Generate unique file name
    const fileExt = fileName.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${Date.now()}-${uniqueFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      bucket: bucketName,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

/**
 * Upload video file
 * @param {Buffer} fileBuffer - Video file buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - Video MIME type
 */
export async function uploadVideo(fileBuffer, fileName, mimeType) {
  return uploadToSupabase(fileBuffer, fileName, BUCKETS.VIDEOS, mimeType);
}

/**
 * Upload document file
 * @param {Buffer} fileBuffer - Document file buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - Document MIME type
 */
export async function uploadDocument(fileBuffer, fileName, mimeType) {
  return uploadToSupabase(fileBuffer, fileName, BUCKETS.DOCUMENTS, mimeType);
}

/**
 * Upload thumbnail/image
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - Image MIME type
 */
export async function uploadThumbnail(fileBuffer, fileName, mimeType) {
  return uploadToSupabase(fileBuffer, fileName, BUCKETS.THUMBNAILS, mimeType);
}

/**
 * Delete file from Supabase Storage
 * @param {string} filePath - File path in bucket
 * @param {string} bucketName - Bucket name
 */
export async function deleteFile(filePath, bucketName) {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
}

/**
 * Create storage buckets if they don't exist
 * Run this once during setup
 */
export async function initializeStorageBuckets() {
  const bucketsToCreate = Object.values(BUCKETS);

  for (const bucketName of bucketsToCreate) {
    try {
      // Check if bucket exists
      const { data: existingBuckets, error: listError } =
        await supabaseAdmin.storage.listBuckets();

      if (listError) {
        console.error(`Error listing buckets: ${listError.message}`);
        continue;
      }

      const bucketExists = existingBuckets.some((b) => b.name === bucketName);

      if (!bucketExists) {
        // Create bucket with public access (file size limit managed by Supabase settings)
        const { error: createError } = await supabaseAdmin.storage.createBucket(
          bucketName,
          {
            public: true,
          },
        );

        if (createError) {
          console.error(
            `Error creating bucket ${bucketName}: ${createError.message}`,
          );
        } else {
          console.log(`✅ Created bucket: ${bucketName}`);
        }
      } else {
        console.log(`✓ Bucket already exists: ${bucketName}`);
      }
    } catch (error) {
      console.error(`Error initializing bucket ${bucketName}:`, error);
    }
  }
}

export default {
  uploadVideo,
  uploadDocument,
  uploadThumbnail,
  deleteFile,
  initializeStorageBuckets,
  BUCKETS,
};
