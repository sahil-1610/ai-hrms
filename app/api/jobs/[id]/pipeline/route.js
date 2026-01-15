import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";

// Default pipeline configuration
const DEFAULT_PIPELINE_CONFIG = {
  stages: {
    resume_screening: { enabled: true, auto_advance_threshold: 60 },
    mcq_test: { enabled: true, auto_advance_threshold: 60 },
    async_interview: { enabled: true, auto_advance_threshold: 50 },
    live_interview: { enabled: true },
    offer: { enabled: true },
  },
  scoring_weights: {
    resume: 0.4,
    mcq: 0.3,
    async_interview: 0.2,
    live_interview: 0.1,
  },
};

const DEFAULT_MCQ_CONFIG = {
  enabled: true,
  question_count: 10,
  duration_minutes: 30,
  passing_score: 60,
  difficulty: "mixed", // easy, medium, hard, mixed
  difficulty_distribution: { easy: 30, medium: 50, hard: 20 },
};

/**
 * GET /api/jobs/[id]/pipeline
 * Get pipeline configuration for a job
 */
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["hr", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: job, error } = await supabaseAdmin
      .from("jobs")
      .select("id, title, pipeline_config, mcq_config, interview_questions")
      .eq("id", id)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get custom interview questions
    const { data: questions } = await supabaseAdmin
      .from("job_interview_questions")
      .select("*")
      .eq("job_id", id)
      .order("order_index", { ascending: true });

    return NextResponse.json({
      jobId: job.id,
      jobTitle: job.title,
      pipelineConfig: job.pipeline_config || DEFAULT_PIPELINE_CONFIG,
      mcqConfig: job.mcq_config || DEFAULT_MCQ_CONFIG,
      interviewQuestions: questions || [],
    });
  } catch (error) {
    console.error("Error fetching pipeline config:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline configuration" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/jobs/[id]/pipeline
 * Update pipeline configuration for a job
 */
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["hr", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { pipelineConfig, mcqConfig, interviewQuestions } = body;

    // Validate pipeline config
    if (pipelineConfig) {
      const totalWeight = Object.values(pipelineConfig.scoring_weights || {}).reduce(
        (sum, w) => sum + w,
        0
      );
      if (Math.abs(totalWeight - 1) > 0.01) {
        return NextResponse.json(
          { error: "Scoring weights must sum to 1.0" },
          { status: 400 }
        );
      }
    }

    // Update job with new configuration
    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .update({
        pipeline_config: pipelineConfig,
        mcq_config: mcqConfig,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (jobError) {
      console.error("Error updating job:", jobError);
      return NextResponse.json(
        { error: "Failed to update pipeline configuration" },
        { status: 500 }
      );
    }

    // Update interview questions if provided
    if (interviewQuestions !== undefined) {
      // Delete existing questions
      await supabaseAdmin
        .from("job_interview_questions")
        .delete()
        .eq("job_id", id);

      // Insert new questions
      if (interviewQuestions.length > 0) {
        const questionsToInsert = interviewQuestions.map((q, index) => ({
          job_id: id,
          question: q.question,
          order_index: index,
          max_duration_seconds: q.max_duration_seconds || 120,
          category: q.category || "general",
          is_required: q.is_required !== false,
        }));

        const { error: questionsError } = await supabaseAdmin
          .from("job_interview_questions")
          .insert(questionsToInsert);

        if (questionsError) {
          console.error("Error inserting questions:", questionsError);
        }
      }
    }

    // Fetch updated questions
    const { data: questions } = await supabaseAdmin
      .from("job_interview_questions")
      .select("*")
      .eq("job_id", id)
      .order("order_index", { ascending: true });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      pipelineConfig: job.pipeline_config,
      mcqConfig: job.mcq_config,
      interviewQuestions: questions || [],
    });
  } catch (error) {
    console.error("Error updating pipeline config:", error);
    return NextResponse.json(
      { error: "Failed to update pipeline configuration" },
      { status: 500 }
    );
  }
}
