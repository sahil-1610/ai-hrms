import mammoth from "mammoth";

/**
 * Extract text from PDF file
 * Uses pdf-parse with custom render to avoid test file issue
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromPDF(buffer) {
  try {
    // pdf-parse has a bug where it tries to load a test PDF file on first import
    // We need to import the library and call it in a specific way
    const pdfParse = (await import("pdf-parse")).default;

    // Create a custom pagerender function to avoid the test file issue
    const options = {
      // This is a workaround for the pdf-parse test file bug
      // By passing a pagerender function, we force it to use our buffer
      pagerender: function(pageData) {
        return pageData.getTextContent().then(function(textContent) {
          let text = '';
          for (let item of textContent.items) {
            text += item.str + ' ';
          }
          return text;
        });
      }
    };

    const data = await pdfParse(buffer, options);
    return data.text || '';
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF file");
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
