/**
 * Extract text from PDF or DOCX file
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} - Extracted text
 */
export async function extractText(fileBuffer, mimeType) {
  try {
    if (mimeType === "application/pdf") {
      // Use pdf-parse with canvas polyfill disabled
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const data = await pdfParse(fileBuffer, {
        max: 0, // Parse all pages
        version: "default",
      });
      return data.text || "";
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      // Dynamic import for mammoth (ESM compatibility)
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value || "";
    }
    throw new Error("Unsupported file type. Only PDF and DOCX are supported.");
  } catch (error) {
    console.error("Text extraction error:", error);
    // Return empty string instead of throwing - AI can still parse from base64
    return "";
  }
}

/**
 * Validate file type
 * @param {string} mimeType - File MIME type
 * @returns {boolean} - Is valid
 */
export function isValidResumeFile(mimeType) {
  const validTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];
  return validTypes.includes(mimeType);
}

/**
 * Validate file size (max 10MB)
 * @param {number} size - File size in bytes
 * @returns {boolean} - Is valid
 */
export function isValidFileSize(size) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return size <= maxSize;
}

/**
 * Extract email from text using regex
 * @param {string} text - Text to search
 * @returns {string|null} - Found email or null
 */
export function extractEmail(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

/**
 * Extract phone number from text
 * @param {string} text - Text to search
 * @returns {string|null} - Found phone or null
 */
export function extractPhone(text) {
  const phoneRegex =
    /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : null;
}
