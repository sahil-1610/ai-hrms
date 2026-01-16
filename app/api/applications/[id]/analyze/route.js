import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { matchResumeToJob, generateEmbedding } from "@/lib/openai";
import { calculateMatchScore } from "@/utils/scoring";

// POST /api/applications/[id]/analyze - Analyze candidate resume (HR only)
// Uses already-parsed resume_text from database, no need to fetch from Cloudinary
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

    // Get application with job details and resume_text
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

    const job = application.jobs;

    if (!job || !job.jd_text) {
      return NextResponse.json(
        { error: "Job description not found" },
        { status: 400 }
      );
    }

    // Use the already-parsed resume_text from the database
    let resumeText = application.resume_text;

    // If resume_text is not available, use fallback info
    if (!resumeText || resumeText.length < 50) {
      console.log("Resume text not found in DB, using fallback info");
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

    console.log(`Using resume text: ${resumeText.length} characters`);

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
