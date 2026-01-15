import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} fileName - Original file name
 * @param {string} folder - Cloudinary folder (default: "resumes")
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadToCloudinary(
  fileBuffer,
  fileName,
  folder = "resumes"
) {
  return new Promise((resolve, reject) => {
    // Determine resource type based on file extension
    const ext = fileName.toLowerCase().split('.').pop();
    const isPdfOrDoc = ['pdf', 'doc', 'docx'].includes(ext);

    // Get base filename without extension and sanitize it
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const sanitizedName = baseName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');

    // For raw files (PDFs, DOCs), include the extension in public_id
    // This ensures proper content-type detection when fetching
    const publicId = isPdfOrDoc
      ? `${Date.now()}_${sanitizedName}.${ext}`
      : `${Date.now()}_${sanitizedName}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        // Use "raw" for documents - we'll proxy through our API for access
        resource_type: isPdfOrDoc ? "raw" : "auto",
        public_id: publicId,
        access_mode: "public",
        type: "upload",
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const { Readable } = require("stream");
    const stream = Readable.from(fileBuffer);
    stream.pipe(uploadStream);
  });
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<void>}
 */
export async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
}

/**
 * Generate a signed URL for accessing raw files (PDFs, docs)
 * This bypasses any public access restrictions on the Cloudinary account
 * @param {string} publicId - The public ID of the file
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {string} Signed URL
 */
export function getSignedUrl(publicId, expiresIn = 3600) {
  const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
  return cloudinary.url(publicId, {
    resource_type: "raw",
    type: "upload",
    sign_url: true,
    expires_at: timestamp,
  });
}

export default cloudinary;
