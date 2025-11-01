import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import {
  applicationShortlistedTemplate,
  applicationRejectedTemplate,
  interviewScheduledTemplate,
  offerExtendedTemplate,
  applicationHiredTemplate,
} from "@/lib/emailTemplates";

// PATCH /api/applications/[id]/status - Update application status
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    // Only hr and admin can update application status
    if (
      !session ||
      (session.user.role !== "hr" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = [
      "submitted",
      "shortlisted",
      "rejected",
      "interviewing",
      "offered",
      "hired",
    ];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Update application status
    const { data: application, error } = await supabaseAdmin
      .from("applications")
      .update({ status })
      .eq("id", id)
      .select("*, jobs(title)")
      .single();

    if (error || !application) {
      console.error("Error updating application:", error);
      return NextResponse.json(
        { error: "Failed to update application" },
        { status: 500 }
      );
    }

    // Send email notification to candidate
    await sendStatusUpdateEmail(application, status);

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error in PATCH /api/applications/[id]/status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Send email notification based on status update
 */
async function sendStatusUpdateEmail(application, newStatus) {
  try {
    const { name, email, application_token, jobs } = application;
    const jobTitle = jobs?.title || "Position";

    let emailTemplate;
    let subject;

    switch (newStatus) {
      case "shortlisted":
        emailTemplate = applicationShortlistedTemplate(
          name,
          jobTitle,
          application_token
        );
        subject = `🎉 Your Application Has Been Shortlisted - ${jobTitle}`;
        break;

      case "rejected":
        emailTemplate = applicationRejectedTemplate(name, jobTitle);
        subject = `Update on Your Application - ${jobTitle}`;
        break;

      case "interviewing":
        emailTemplate = interviewScheduledTemplate(
          name,
          jobTitle,
          application_token
        );
        subject = `📅 Interview Invitation - ${jobTitle}`;
        break;

      case "offered":
        emailTemplate = offerExtendedTemplate(
          name,
          jobTitle,
          application_token
        );
        subject = `🎊 Job Offer - ${jobTitle}`;
        break;

      case "hired":
        emailTemplate = applicationHiredTemplate(name, jobTitle);
        subject = `🎉 Welcome to the Team - ${jobTitle}`;
        break;

      default:
        // Don't send email for 'submitted' as it's sent during application creation
        return;
    }

    if (emailTemplate) {
      await sendEmail({
        to: email,
        subject,
        html: emailTemplate,
      });
      console.log(
        `Status update email sent to ${email} for status: ${newStatus}`
      );
    }
  } catch (error) {
    console.error("Error sending status update email:", error);
    // Don't throw error - email failure shouldn't break the status update
  }
}
