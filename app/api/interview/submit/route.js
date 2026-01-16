import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { transcribeAudio, evaluateTranscript } from "@/lib/openai";
import { calculateOverallScore } from "@/utils/scoring";
import { checkAndAutoAdvance } from "@/lib/pipeline";

// POST /api/interview/submit - Submit interview recording (No auth - token based)
export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");
    const token = formData.get("token");
    const questionsJson = formData.get("questions");
    const answeredQuestionsJson = formData.get("answeredQuestions");

    if (!audioFile || !token) {
      return NextResponse.json(
        { error: "Audio file and token are required" },
        { status: 400 }
      );
    }

    // Verify interview token and get application
    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .select("*, jobs(title, skills)")
      .eq("interview_token", token)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Invalid or expired interview token" },
        { status: 404 }
      );
    }

    // Check if already submitted
    if (application.interview_completed_at) {
      return NextResponse.json(
        { error: "Interview has already been submitted" },
        { status: 400 }
      );
    }

    // Parse questions if provided
    let questions = [];
    try {
      if (questionsJson) {
        questions = JSON.parse(questionsJson);
      }
    } catch (e) {
      console.error("Error parsing questions:", e);
    }

    // Convert audio file to buffer
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload audio to Cloudinary
    let audioUrl;
    try {
      const uploadResult = await uploadToCloudinary(
        buffer,
        `interview-${application.id}.webm`,
        "hrms/interviews"
      );
      audioUrl = uploadResult.url;
    } catch (uploadError) {
      console.error("Error uploading audio:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload interview recording" },
        { status: 500 }
      );
    }

    // Transcribe audio using Whisper
    let transcript = "";
    try {
      // Pass the buffer directly with a filename
      transcript = await transcribeAudio(buffer, `interview-${application.id}.webm`);
      console.log("Transcription completed, length:", transcript.length);
    } catch (transcribeError) {
      console.error("Transcription error:", transcribeError);
      // Continue without transcription - we still have the audio
      transcript = "[Transcription unavailable]";
    }

    // Evaluate the transcript using AI
    let evaluation = null;
    let communicationScore = 50; // Default score

    if (transcript && transcript !== "[Transcription unavailable]") {
      try {
        evaluation = await evaluateTranscript(
          transcript,
          questions[0] || "Tell me about yourself"
        );
        communicationScore = evaluation.score || 50;
        console.log("Evaluation completed:", evaluation);
      } catch (evalError) {
        console.error("Evaluation error:", evalError);
        // Continue without evaluation
      }
    }

    // Calculate new overall score
    const newOverallScore = calculateOverallScore(
      application.resume_match_score || 0,
      application.test_score || 0,
      communicationScore
    );

    // Update application with interview results
    const { data: updatedApp, error: updateError } = await supabaseAdmin
      .from("applications")
      .update({
        interview_audio_url: audioUrl,
        interview_transcript: transcript,
        communication_score: communicationScore,
        interview_score: communicationScore, // Also store as interview_score for pipeline
        overall_score: newOverallScore,
        interview_completed_at: new Date().toISOString(),
        ai_evaluation: evaluation ? JSON.stringify(evaluation) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to save interview results" },
        { status: 500 }
      );
    }

    // Check for auto-advancement
    const autoAdvanceResult = await checkAndAutoAdvance(
      application.id,
      "async_interview",
      communicationScore
    );

    // Create notification for HR users
    try {
      await supabaseAdmin.from("notifications").insert({
        hr_user_id: null,
        type: "interview_completed",
        title: "Async Interview Completed",
        message: `${application.name} completed async interview for ${application.jobs?.title || "job"} with score ${communicationScore}%`,
        link: `/admin/candidates/${application.id}`,
        application_id: application.id,
        job_id: application.job_id,
      });
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Interview submitted successfully",
      results: {
        communicationScore,
        overallScore: newOverallScore,
        transcriptLength: transcript.length,
        feedback: evaluation?.feedback || "Thank you for your response!",
        autoAdvanced: autoAdvanceResult.advanced,
        newStage: autoAdvanceResult.newStage,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/interview/submit:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
