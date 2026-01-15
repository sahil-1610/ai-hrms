import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/jobs/[id]/interview-questions - Get interview questions for a job (public endpoint for candidates)
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Verify job exists
    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("id, title")
      .eq("id", id)
      .eq("status", "active")
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found or not active" },
        { status: 404 }
      );
    }

    // Fetch custom interview questions for this job
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("job_interview_questions")
      .select("id, question, order_index, max_duration_seconds, category, is_required")
      .eq("job_id", id)
      .order("order_index", { ascending: true });

    if (questionsError) {
      console.error("Error fetching interview questions:", questionsError);
      return NextResponse.json(
        { error: "Failed to fetch interview questions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      jobId: job.id,
      jobTitle: job.title,
      questions: questions || [],
    });
  } catch (error) {
    console.error("Error in GET /api/jobs/[id]/interview-questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview questions" },
      { status: 500 }
    );
  }
}
