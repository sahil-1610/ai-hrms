import mammoth from "mammoth";
import { extractText } from "unpdf";

/**
 * Extract text from PDF file using unpdf, with pdf-parse as fallback
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromPDF(buffer) {
  try {
    console.log(`extractTextFromPDF: Received buffer of ${buffer.length} bytes`);

    // Check if buffer starts with PDF header
    const header = buffer.slice(0, 5).toString();
    console.log(`extractTextFromPDF: File header: ${header}`);

    if (!header.startsWith('%PDF')) {
      throw new Error(`Invalid PDF file - header is: ${header}`);
    }

    // Try unpdf first
    let text = "";
    try {
      const uint8Array = new Uint8Array(buffer);
      const result = await extractText(uint8Array);
      text = result.text || "";
      console.log(`extractTextFromPDF (unpdf): Extracted ${text.length} characters`);
    } catch (unpdfError) {
      console.log(`unpdf failed: ${unpdfError.message}, trying pdf-parse...`);
    }

    // If unpdf returned very little text, try pdf-parse as fallback
    if (text.length < 100) {
      console.log(`unpdf returned only ${text.length} chars, trying pdf-parse...`);
      try {
        // Dynamic import to avoid the test file loading issue
        const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
        const pdfData = await pdfParse(buffer);
        text = pdfData.text || "";
        console.log(`extractTextFromPDF (pdf-parse): Extracted ${text.length} characters`);
      } catch (pdfParseError) {
        console.error(`pdf-parse also failed: ${pdfParseError.message}`);
      }
    }

    return text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(`Failed to extract text from PDF file: ${error.message}`);
  }
}

/**
 * Extract text from DOCX file
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error("Failed to extract text from DOCX file");
  }
}

/**
 * Extract text from resume file (auto-detect type)
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} - Extracted text
 */
export async function extractResumeText(buffer, mimeType) {
  if (mimeType === "application/pdf") {
    return extractTextFromPDF(buffer);
  } else if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return extractTextFromDOCX(buffer);
  } else {
    throw new Error("Unsupported file type. Please upload PDF or DOCX.");
  }
}
