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
        // Use "raw" for documents - setting access_mode to "public" for accessibility
        resource_type: isPdfOrDoc ? "raw" : "auto",
        public_id: publicId,
        access_mode: "public",
        type: "upload",
        overwrite: true,
        // Disable strict transformations for this upload
        invalidate: true,
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
 * @param {string} publicId - The public ID of the file (including folder path)
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {string} Signed URL
 */
export function getSignedUrl(publicId, expiresIn = 3600) {
  // Use private_download_url for authenticated access to raw files
  try {
    const url = cloudinary.utils.private_download_url(publicId, "", {
      resource_type: "raw",
      type: "upload",
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    });
    return url;
  } catch (e) {
    // Fallback to signed URL approach
    console.log("Falling back to signed URL:", e.message);
    return cloudinary.url(publicId, {
      resource_type: "raw",
      type: "upload",
      sign_url: true,
      secure: true,
    });
  }
}

/**
 * Get authenticated download URL using API credentials
 * This fetches the file through Cloudinary's authenticated API
 * @param {string} publicId - The public ID of the file
 * @returns {Promise<Buffer>} File buffer
 */
export async function fetchFileFromCloudinary(publicId) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Build the authenticated URL for the Admin API
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { public_id: publicId, timestamp },
    apiSecret
  );

  // Try multiple URL formats
  const urls = [
    // Direct authenticated URL with signature
    `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`,
    // With authentication header approach - we'll try the API
  ];

  // First, try using the API to get resource details which includes a secure URL
  try {
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: "raw",
      type: "upload",
    });

    if (resource && resource.secure_url) {
      const response = await fetch(resource.secure_url);
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        return buffer;
      }
    }
  } catch (e) {
    console.log("API resource fetch failed:", e.message);
  }

  // Try direct fetch with basic auth
  const authHeader = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${authHeader}`,
        },
      });

      if (response.ok) {
        return Buffer.from(await response.arrayBuffer());
      }
    } catch (e) {
      console.log(`Fetch attempt failed for ${url}:`, e.message);
    }
  }

  throw new Error("Failed to fetch file from Cloudinary");
}

export default cloudinary;
