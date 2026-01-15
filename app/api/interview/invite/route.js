import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

// Email template for interview invitation
const interviewInvitationTemplate = (name, jobTitle, interviewUrl) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 40px auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px; background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎤 Interview Invitation</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Congratulations! We'd like to invite you to complete a video interview for the position of <strong>${jobTitle}</strong>.</p>
      <p>This is an asynchronous interview where you can record your answers at your convenience. The interview includes 5 questions and should take approximately 20-30 minutes to complete.</p>
      <p><strong>Important Tips:</strong></p>
      <ul>
        <li>Find a quiet place with good lighting</li>
        <li>Use a device with a working microphone</li>
        <li>You can re-record answers as needed</li>
        <li>Complete the interview within 7 days</li>
      </ul>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${interviewUrl}" class="button">Start Interview</a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">This link is unique to you. Please don't share it with anyone.</p>
    </div>
  </div>
</body>
</html>
`;

// POST /api/interview/invite - Send interview invitation to a candidate
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only HR and admin can invite
    if (!["hr", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Fetch application with job details
    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .select("*, jobs(title)")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if already invited
    if (application.interview_token) {
      return NextResponse.json(
        { error: "Interview invitation already sent", token: application.interview_token },
        { status: 400 }
      );
    }

    // Generate unique interview token
    const interviewToken = crypto.randomBytes(32).toString("hex");

    // Update application with interview token
    const { data: updatedApp, error: updateError } = await supabaseAdmin
      .from("applications")
      .update({
        interview_token: interviewToken,
        status: "interviewing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to create interview invitation" },
        { status: 500 }
      );
    }

    // Send interview invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const interviewUrl = `${appUrl}/interview/${interviewToken}`;

    try {
      const emailHtml = interviewInvitationTemplate(
        application.name,
        application.jobs.title,
        interviewUrl
      );

      await sendEmail({
        to: application.email,
        subject: `Interview Invitation - ${application.jobs.title}`,
        html: emailHtml,
      });

      console.log(`Interview invitation sent to ${application.email}`);
    } catch (emailError) {
      console.error("Error sending interview invitation email:", emailError);
      // Don't fail if email fails - token is already created
    }

    return NextResponse.json({
      success: true,
      message: "Interview invitation sent successfully",
      interviewToken,
      interviewUrl,
    });
  } catch (error) {
    console.error("Error in POST /api/interview/invite:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
