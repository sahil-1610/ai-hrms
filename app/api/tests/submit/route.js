import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/tests/submit - Submit test answers (Public - no auth required, uses token)
export async function POST(request) {
  try {
    const { testToken, answers } = await request.json();

    if (!testToken) {
      return NextResponse.json(
        { error: "Test token is required" },
        { status: 400 }
      );
    }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Answers must be an array" },
        { status: 400 }
      );
    }

    // Find application by test token
    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .select("*, jobs(id, title)")
      .eq("test_token", testToken)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Invalid test token" },
        { status: 404 }
      );
    }

    // Check if test already submitted
    if (application.test_score !== null && application.test_score !== 0) {
      return NextResponse.json(
        { error: "Test has already been submitted" },
        { status: 400 }
      );
    }

    // Get test questions
    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select("*")
      .eq("job_id", application.job_id)
      .single();

    if (testError || !test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Validate answers length
    if (answers.length !== test.questions.length) {
      return NextResponse.json(
        {
          error: `Expected ${test.questions.length} answers, got ${answers.length}`,
        },
        { status: 400 }
      );
    }

    // Calculate score
    let correctAnswers = 0;
    const results = test.questions.map((question, index) => {
      const isCorrect = answers[index] === question.correctIndex;
      if (isCorrect) correctAnswers++;

      return {
        questionIndex: index,
        question: question.q,
        candidateAnswer: answers[index],
        correctAnswer: question.correctIndex,
        isCorrect,
      };
    });

    const testScore = Math.round(
      (correctAnswers / test.questions.length) * 100
    );

    // Calculate overall score (weighted average)
    // Formula: 0.5 × resumeScore + 0.3 × testScore + 0.2 × commScore
    const resumeScore = application.resume_match_score || 0;
    const commScore = application.communication_score || 0;
    const overallScore = Math.round(
      0.5 * resumeScore + 0.3 * testScore + 0.2 * commScore
    );

    // Update application with test score and overall score
    const { error: updateError } = await supabaseAdmin
      .from("applications")
      .update({
        test_score: testScore,
        overall_score: overallScore,
        test_submitted_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to save test results" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test submitted successfully",
      score: testScore,
      totalQuestions: test.questions.length,
      correctAnswers,
      passed: testScore >= (test.passing_score || 60),
      overallScore,
      // Don't return detailed results to prevent answer sharing
    });
  } catch (error) {
    console.error("Error in POST /api/tests/submit:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit test" },
      { status: 500 }
    );
  }
}
