import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { matchResumeToJob, generateEmbedding } from "@/lib/openai";
import { calculateMatchScore } from "@/utils/scoring";

// POST /api/applications/[id]/reanalyze - Re-analyze candidate against job (HR only)
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    // Only HR and admin can re-analyze
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

    const job = application.jobs;

    if (!application.resume_text || !job.jd_text) {
      return NextResponse.json(
        {
          error:
            "Missing resume text or job description. Cannot perform analysis.",
        },
        { status: 400 }
      );
    }

    // Re-generate embedding (in case job description changed)
    const resumeEmbedding = await generateEmbedding(application.resume_text);

    // Calculate new cosine similarity score
    const cosineSimilarityScore = job.jd_embedding
      ? calculateMatchScore(resumeEmbedding, job.jd_embedding)
      : 0;

    // Perform AI match analysis
    const aiMatchAnalysis = await matchResumeToJob(
      application.resume_text,
      job.jd_text,
      {
        title: job.title,
        skills: job.skills || [],
        minExp: job.experience_min || 0,
        maxExp: job.experience_max || 5,
        location: job.location,
      }
    );

    // Use AI score as primary
    const finalMatchScore = aiMatchAnalysis.matchScore;

    // Update application with new analysis
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
          reanalyzedAt: new Date().toISOString(),
          reanalyzedBy: session.user.email,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to update analysis" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application re-analyzed successfully",
      application: updated,
      analysis: {
        matchScore: finalMatchScore,
        recommendation: aiMatchAnalysis.recommendation,
        strengths: aiMatchAnalysis.strengths,
        concerns: aiMatchAnalysis.concerns,
        skillsMatch: aiMatchAnalysis.skillsMatch,
        experienceMatch: aiMatchAnalysis.experienceMatch,
        summary: aiMatchAnalysis.summary,
        previousScore: application.resume_match_score,
        scoreChange: finalMatchScore - (application.resume_match_score || 0),
      },
    });
  } catch (error) {
    console.error("Error in POST /api/applications/[id]/reanalyze:", error);
    return NextResponse.json(
      { error: error.message || "Failed to re-analyze application" },
      { status: 500 }
    );
  }
}
