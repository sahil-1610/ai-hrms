import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { matchResumeToJob, generateEmbedding } from "@/lib/openai";
import { calculateMatchScore } from "@/utils/scoring";
import { extractTextFromPDF, extractTextFromDOCX } from "@/lib/resumeParser";

/**
 * Fetch resume file from Cloudinary URL and return as buffer
 */
async function fetchResumeFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch resume: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Detect file type from URL or content-type
 */
function getFileType(url) {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes(".pdf")) {
    return "application/pdf";
  } else if (lowercaseUrl.includes(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else if (lowercaseUrl.includes(".doc")) {
    return "application/msword";
  }
  // Default to PDF if we can't determine
  return "application/pdf";
}

// POST /api/applications/[id]/analyze - Analyze candidate resume (HR only)
// Fetches resume from Cloudinary, parses text, and runs AI analysis
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    // Only HR and admin can analyze
    if (
      !session ||
      (session.user.role !== "hr" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: applicationId } = await params;

    // Get application with job details
    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .select("*, jobs(*)")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (!application.resume_url) {
      return NextResponse.json(
        { error: "No resume URL found for this application" },
        { status: 400 }
      );
    }

    const job = application.jobs;

    if (!job || !job.jd_text) {
      return NextResponse.json(
        { error: "Job description not found" },
        { status: 400 }
      );
    }

    // Fetch resume from Cloudinary
    console.log(`Fetching resume from: ${application.resume_url}`);
    const resumeBuffer = await fetchResumeFromUrl(application.resume_url);
    const fileType = getFileType(application.resume_url);

    // Extract text from resume
    let resumeText;
    try {
      if (fileType === "application/pdf") {
        resumeText = await extractTextFromPDF(resumeBuffer);
      } else {
        resumeText = await extractTextFromDOCX(resumeBuffer);
      }
    } catch (extractError) {
      console.error("Error extracting text from resume:", extractError);
      // Fall back to basic info if text extraction fails
      resumeText = `
        Candidate: ${application.name}
        Email: ${application.email}
        Phone: ${application.phone}
        Current Company: ${application.current_company || "N/A"}
        Experience: ${application.experience || "N/A"} years
        Skills: ${application.skills?.join(", ") || "N/A"}
        Education: ${application.education || "N/A"}
        Cover Letter: ${application.cover_letter || "N/A"}
      `.trim();
    }

    console.log(`Extracted ${resumeText.length} characters from resume`);

    // Generate resume embedding for vector search
    const resumeEmbedding = await generateEmbedding(resumeText);

    // Calculate cosine similarity score
    const cosineSimilarityScore = job.jd_embedding
      ? calculateMatchScore(resumeEmbedding, job.jd_embedding)
      : 0;

    // Perform AI match analysis
    const aiMatchAnalysis = await matchResumeToJob(resumeText, job.jd_text, {
      title: job.title,
      skills: job.skills || [],
      minExp: job.experience_min || 0,
      maxExp: job.experience_max || 5,
      location: job.location,
    });

    // Use AI score as primary
    const finalMatchScore = aiMatchAnalysis.matchScore;

    console.log("AI Match Analysis:", {
      aiScore: aiMatchAnalysis.matchScore,
      cosineScore: cosineSimilarityScore,
      recommendation: aiMatchAnalysis.recommendation,
    });

    // Update application with analysis results
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("applications")
      .update({
        resume_text: resumeText,
        resume_embedding: resumeEmbedding,
        resume_match_score: finalMatchScore,
        overall_score: finalMatchScore,
        ai_match_data: JSON.stringify({
          recommendation: aiMatchAnalysis.recommendation,
          strengths: aiMatchAnalysis.strengths,
          concerns: aiMatchAnalysis.concerns,
          skillsMatch: aiMatchAnalysis.skillsMatch,
          experienceMatch: aiMatchAnalysis.experienceMatch,
          summary: aiMatchAnalysis.summary,
          aiScore: aiMatchAnalysis.matchScore,
          cosineScore: cosineSimilarityScore,
          analyzedAt: new Date().toISOString(),
          analyzedBy: session.user.email,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to save analysis results" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Resume analyzed successfully",
      application: updated,
      analysis: {
        matchScore: finalMatchScore,
        recommendation: aiMatchAnalysis.recommendation,
        strengths: aiMatchAnalysis.strengths,
        concerns: aiMatchAnalysis.concerns,
        skillsMatch: aiMatchAnalysis.skillsMatch,
        experienceMatch: aiMatchAnalysis.experienceMatch,
        summary: aiMatchAnalysis.summary,
        cosineScore: cosineSimilarityScore,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/applications/[id]/analyze:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze resume" },
      { status: 500 }
    );
  }
}
