import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getFathomRecording,
  getFathomTranscript,
  getFathomSummary,
  validateFathomWebhook,
  formatTranscript,
} from "@/lib/fathom";
import { evaluateTranscript } from "@/lib/openai";

/**
 * POST /api/fathom/webhook
 * Receives webhook notifications from Fathom when recordings are ready
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const signature = request.headers.get("x-fathom-signature");

    // Validate webhook signature if secret is configured
    const webhookSecret = process.env.FATHOM_WEBHOOK_SECRET;
    if (webhookSecret && !validateFathomWebhook(body, signature, webhookSecret)) {
      console.error("Invalid Fathom webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { event, data } = body;

    // Handle different event types
    switch (event) {
      case "recording.completed":
      case "recording.ready":
        await handleRecordingReady(data);
        break;
      case "transcript.ready":
        await handleTranscriptReady(data);
        break;
      case "summary.ready":
        await handleSummaryReady(data);
        break;
      default:
        console.log(`Unhandled Fathom event: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing Fathom webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

/**
 * Handle recording ready event
 */
async function handleRecordingReady(data) {
  const { recording_id, meeting_url, calendar_event_id, started_at } = data;

  // Find matching interview
  let interview = null;

  // Try by calendar event ID
  if (calendar_event_id) {
    const { data: found } = await supabaseAdmin
      .from("scheduled_interviews")
      .select("*")
      .eq("google_event_id", calendar_event_id)
      .single();
    interview = found;
  }

  // Try by meeting URL
  if (!interview && meeting_url) {
    const { data: interviews } = await supabaseAdmin
      .from("scheduled_interviews")
      .select("*")
      .not("google_meet_link", "is", null);

    if (interviews) {
      interview = interviews.find(
        (i) =>
          i.google_meet_link &&
          (meeting_url.includes(i.google_meet_link) ||
            i.google_meet_link.includes(meeting_url))
      );
    }
  }

  // Try by time
  if (!interview && started_at) {
    const recordingTime = new Date(started_at);
    const thirtyMinBefore = new Date(recordingTime.getTime() - 30 * 60 * 1000);
    const thirtyMinAfter = new Date(recordingTime.getTime() + 30 * 60 * 1000);

    const { data: found } = await supabaseAdmin
      .from("scheduled_interviews")
      .select("*")
      .gte("scheduled_at", thirtyMinBefore.toISOString())
      .lte("scheduled_at", thirtyMinAfter.toISOString())
      .single();
    interview = found;
  }

  if (!interview) {
    console.log("No matching interview found for Fathom recording:", recording_id);
    return;
  }

  // Update interview with recording ID
  await supabaseAdmin
    .from("scheduled_interviews")
    .update({
      fathom_recording_id: recording_id,
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", interview.id);

  console.log(`Linked Fathom recording ${recording_id} to interview ${interview.id}`);
}

/**
 * Handle transcript ready event
 */
async function handleTranscriptReady(data) {
  const { recording_id, transcript } = data;

  // Find interview by recording ID
  const { data: interview, error } = await supabaseAdmin
    .from("scheduled_interviews")
    .select("*, applications(*)")
    .eq("fathom_recording_id", recording_id)
    .single();

  if (error || !interview) {
    console.log("No interview found for recording:", recording_id);
    return;
  }

  const formattedTranscript = formatTranscript(transcript);

  // Update interview with transcript
  await supabaseAdmin
    .from("scheduled_interviews")
    .update({
      fathom_transcript: formattedTranscript,
      updated_at: new Date().toISOString(),
    })
    .eq("id", interview.id);

  // If we have both transcript and summary, trigger AI evaluation
  if (interview.fathom_summary) {
    await triggerAIEvaluation(interview, formattedTranscript, interview.fathom_summary);
  }
}

/**
 * Handle summary ready event
 */
async function handleSummaryReady(data) {
  const { recording_id, summary } = data;

  // Find interview by recording ID
  const { data: interview, error } = await supabaseAdmin
    .from("scheduled_interviews")
    .select("*, applications(*)")
    .eq("fathom_recording_id", recording_id)
    .single();

  if (error || !interview) {
    console.log("No interview found for recording:", recording_id);
    return;
  }

  const summaryText = typeof summary === "string" ? summary : JSON.stringify(summary);

  // Update interview with summary
  await supabaseAdmin
    .from("scheduled_interviews")
    .update({
      fathom_summary: summaryText,
      updated_at: new Date().toISOString(),
    })
    .eq("id", interview.id);

  // If we have both transcript and summary, trigger AI evaluation
  if (interview.fathom_transcript) {
    await triggerAIEvaluation(interview, interview.fathom_transcript, summaryText);
  }
}

/**
 * Trigger AI evaluation of the interview
 */
async function triggerAIEvaluation(interview, transcript, summary) {
  try {
    // Get application and job details
    const { data: application } = await supabaseAdmin
      .from("applications")
      .select("*, jobs(*)")
      .eq("id", interview.application_id)
      .single();

    if (!application) return;

    // Use OpenAI to evaluate the interview transcript
    const evaluation = await evaluateTranscript(
      transcript,
      `Interview for ${application.jobs?.title || "Position"}`
    );

    // Update application with evaluation
    await supabaseAdmin
      .from("applications")
      .update({
        interview_transcript: transcript,
        ai_evaluation: {
          ...evaluation,
          summary,
          evaluatedAt: new Date().toISOString(),
        },
        communication_score: evaluation.score || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", interview.application_id);

    console.log(`AI evaluation completed for interview ${interview.id}`);
  } catch (error) {
    console.error("Error running AI evaluation:", error);
  }
}
