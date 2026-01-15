import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getFathomRecordings,
  getFathomTranscript,
  getFathomSummary,
  matchRecordingToInterview,
  formatTranscript,
} from "@/lib/fathom";

/**
 * POST /api/fathom/sync
 * Manually sync Fathom recordings with scheduled interviews
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["hr", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get company settings with Fathom API key
    const { data: settings } = await supabaseAdmin
      .from("company_settings")
      .select("fathom_api_key, fathom_enabled")
      .single();

    if (!settings?.fathom_api_key || !settings?.fathom_enabled) {
      return NextResponse.json(
        { error: "Fathom is not configured" },
        { status: 400 }
      );
    }

    // Get scheduled interviews without Fathom data
    const { data: interviews } = await supabaseAdmin
      .from("scheduled_interviews")
      .select("*")
      .is("fathom_recording_id", null)
      .eq("status", "scheduled")
      .or("status.eq.completed");

    if (!interviews || interviews.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No interviews to sync",
        synced: 0,
      });
    }

    // Get recent Fathom recordings
    const { data: recordings } = await getFathomRecordings(
      settings.fathom_api_key,
      { limit: 50 }
    );

    if (!recordings || recordings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No Fathom recordings found",
        synced: 0,
      });
    }

    let syncedCount = 0;

    // Match recordings to interviews
    for (const recording of recordings) {
      const matchedInterview = matchRecordingToInterview(recording, interviews);

      if (matchedInterview && !matchedInterview.fathom_recording_id) {
        try {
          // Get transcript and summary
          const [transcriptData, summaryData] = await Promise.allSettled([
            getFathomTranscript(settings.fathom_api_key, recording.id),
            getFathomSummary(settings.fathom_api_key, recording.id),
          ]);

          const transcript =
            transcriptData.status === "fulfilled"
              ? formatTranscript(transcriptData.value)
              : null;
          const summary =
            summaryData.status === "fulfilled"
              ? JSON.stringify(summaryData.value)
              : null;

          // Update the interview
          await supabaseAdmin
            .from("scheduled_interviews")
            .update({
              fathom_recording_id: recording.id,
              fathom_transcript: transcript,
              fathom_summary: summary,
              status: "completed",
              completed_at: recording.ended_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", matchedInterview.id);

          syncedCount++;
        } catch (error) {
          console.error(
            `Error syncing recording ${recording.id}:`,
            error
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} recording(s)`,
      synced: syncedCount,
    });
  } catch (error) {
    console.error("Error syncing Fathom recordings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync recordings" },
      { status: 500 }
    );
  }
}
