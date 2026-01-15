import { NextResponse } from "next/server";
import { parseResume } from "@/lib/openai";
import { extractResumeText } from "@/lib/resumeParser";

// POST /api/parse-resume - Parse uploaded resume
// Supports both file upload (for DOCX) and pre-extracted text (for PDF parsed client-side)
export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let resumeText;

    // Check if it's a JSON request with pre-extracted text (client-side PDF parsing)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      resumeText = body.text;

      if (!resumeText || resumeText.trim().length < 50) {
        return NextResponse.json(
          {
            error:
              "Could not extract sufficient text from resume. Please ensure the file contains readable text.",
          },
          { status: 400 }
        );
      }
    } else {
      // Handle file upload (for DOCX files that need server-side parsing)
      const formData = await request.formData();
      const file = formData.get("resume");

      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      // Validate file type
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Please upload PDF or DOCX" },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Extract text from DOCX (PDF should be parsed client-side)
      try {
        resumeText = await extractResumeText(buffer, file.type);
      } catch (extractError) {
        console.error("Text extraction error:", extractError);
        return NextResponse.json(
          {
            error:
              "Failed to extract text from resume. Please ensure the file is not corrupted.",
          },
          { status: 400 }
        );
      }

      // Validate that we got meaningful text
      if (!resumeText || resumeText.trim().length < 50) {
        return NextResponse.json(
          {
            error:
              "Could not extract sufficient text from resume. Please ensure the file contains readable text.",
          },
          { status: 400 }
        );
      }
    }

    // Parse resume with AI
    const parsedData = await parseResume(resumeText);

    // Return parsed data with the extracted text
    return NextResponse.json({
      ...parsedData,
      extractedText: resumeText, // Include raw text for debugging/matching
      textLength: resumeText.length,
    });
  } catch (error) {
    console.error("Error in POST /api/parse-resume:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse resume" },
      { status: 500 }
    );
  }
}
