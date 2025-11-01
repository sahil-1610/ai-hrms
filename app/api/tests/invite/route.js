import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { testInvitationTemplate } from "@/lib/emailTemplates";

// POST /api/tests/invite - Invite candidate to take test (HR/Admin only)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    // Only HR and admin can invite candidates
    if (
      !session ||
      (session.user.role !== "hr" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Get application details
    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .select("*, jobs(id, title)")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if test exists for this job
    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .select("id, duration_minutes")
      .eq("job_id", application.job_id)
      .single();

    if (testError || !test) {
      return NextResponse.json(
        {
          error:
            "No test available for this job. Please generate a test first.",
        },
        { status: 404 }
      );
    }

    // Check if candidate already has a test token
    if (application.test_token) {
      return NextResponse.json(
        {
          error: "Candidate has already been invited to take the test",
          testToken: application.test_token,
        },
        { status: 400 }
      );
    }

    // Generate unique test token
    const testToken = crypto.randomBytes(32).toString("hex");

    // Update application with test token
    const { error: updateError } = await supabaseAdmin
      .from("applications")
      .update({
        test_token: testToken,
        status: "interviewing", // Move to interviewing stage
      })
      .eq("id", applicationId);

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to generate test invitation" },
        { status: 500 }
      );
    }

    // Send test invitation email to candidate
    try {
      const emailTemplate = testInvitationTemplate(
        application.name,
        application.jobs.title,
        testToken,
        test.duration_minutes || 30
      );
      await sendEmail({
        to: application.email,
        subject: `📝 Assessment Invitation - ${application.jobs.title}`,
        html: emailTemplate,
      });
      console.log(`Test invitation email sent to ${application.email}`);
    } catch (emailError) {
      console.error("Error sending test invitation email:", emailError);
      // Don't fail the invitation if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Test invitation sent successfully",
      testToken,
      testUrl: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/test/${testToken}`,
    });
  } catch (error) {
    console.error("Error in POST /api/tests/invite:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send test invitation" },
      { status: 500 }
    );
  }
}
