import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/applications/[id]/advance - Advance candidate to next stage
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["hr", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { targetStage, score, notes } = body;

    // Get application with job pipeline config
    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .select("*, jobs(pipeline_config, mcq_config)")
      .eq("id", id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const currentStage = application.current_stage || "resume_screening";
    const pipelineConfig = application.jobs?.pipeline_config || getDefaultPipelineConfig();

    // Define stage order
    const stageOrder = [
      "resume_screening",
      "mcq_test",
      "async_interview",
      "live_interview",
      "offer",
      "hired",
      "rejected"
    ];

    // Validate target stage
    if (targetStage && !stageOrder.includes(targetStage)) {
      return NextResponse.json(
        { error: "Invalid target stage" },
        { status: 400 }
      );
    }

    // Determine next stage
    let nextStage = targetStage;
    if (!nextStage) {
      const currentIndex = stageOrder.indexOf(currentStage);
      // Find next enabled stage
      for (let i = currentIndex + 1; i < stageOrder.length; i++) {
        const stage = stageOrder[i];
        if (stage === "hired" || stage === "rejected") {
          nextStage = stage;
          break;
        }
        if (pipelineConfig.stages?.[stage]?.enabled !== false) {
          nextStage = stage;
          break;
        }
      }
    }

    if (!nextStage) {
      return NextResponse.json(
        { error: "No next stage available" },
        { status: 400 }
      );
    }

    // Update stage history
    const stageHistory = application.stage_history || [];
    stageHistory.push({
      from: currentStage,
      to: nextStage,
      score: score || null,
      notes: notes || null,
      timestamp: new Date().toISOString(),
      advanced_by: session.user.id,
    });

    // Update application
    const { data: updatedApplication, error: updateError } = await supabaseAdmin
      .from("applications")
      .update({
        current_stage: nextStage,
        stage_history: stageHistory,
        status: getStatusFromStage(nextStage),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to advance candidate" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      previousStage: currentStage,
      newStage: nextStage,
    });
  } catch (error) {
    console.error("Error in POST /api/applications/[id]/advance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper to get status from stage
function getStatusFromStage(stage) {
  const stageStatusMap = {
    resume_screening: "screening",
    mcq_test: "testing",
    async_interview: "interviewing",
    live_interview: "interviewing",
    offer: "offered",
    hired: "hired",
    rejected: "rejected",
  };
  return stageStatusMap[stage] || "screening";
}

// Default pipeline config
function getDefaultPipelineConfig() {
  return {
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
}
