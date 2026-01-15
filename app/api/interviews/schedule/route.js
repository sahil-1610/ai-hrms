import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { createCalendarEventWithMeet } from "@/lib/google";
import { sendEmail } from "@/lib/email";

// POST /api/interviews/schedule - Schedule an interview with Google Meet
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["hr", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      applicationId,
      scheduledAt,
      durationMinutes = 30, // Default 30 minutes
      timezone = "Asia/Kolkata", // India IST
      interviewType = "video",
      interviewerEmails = [],
      notes,
    } = body;

    if (!applicationId || !scheduledAt) {
      return NextResponse.json(
        { error: "Application ID and scheduled time are required" },
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

    // Get HR user's Google tokens and email
    const { data: hrUser } = await supabaseAdmin
      .from("hr_users")
      .select("google_access_token, google_refresh_token, google_email, email")
      .eq("id", session.user.id)
      .single();

    // Get recruiter email (prefer google_email, fallback to regular email)
    const recruiterEmail = hrUser?.google_email || hrUser?.email || session.user.email;

    let meetLink = null;
    let eventId = null;
    let calendarLink = null;

    // If HR has connected Google, create calendar event
    if (hrUser?.google_access_token && hrUser?.google_refresh_token) {
      try {
        const startTime = new Date(scheduledAt);
        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

        // Build attendees list: candidate + recruiter + additional interviewers
        const allAttendees = [
          application.email, // Candidate
          recruiterEmail, // Recruiter who scheduled
          ...interviewerEmails, // Additional interviewers
        ].filter((email, index, self) =>
          email && self.indexOf(email) === index // Remove duplicates and empty
        );

        const calendarEvent = await createCalendarEventWithMeet({
          accessToken: hrUser.google_access_token,
          refreshToken: hrUser.google_refresh_token,
          summary: `Interview: ${application.name} - ${application.jobs.title}`,
          description: `Interview with ${application.name} for the position of ${application.jobs.title}.\n\nCandidate Email: ${application.email}\nCandidate Phone: ${application.phone || "N/A"}\n\nScheduled by: ${recruiterEmail}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          attendees: allAttendees,
          timeZone: timezone,
        });

        meetLink = calendarEvent.meetLink || calendarEvent.hangoutLink;
        eventId = calendarEvent.eventId;
        calendarLink = calendarEvent.htmlLink;
      } catch (calendarError) {
        console.error("Error creating calendar event:", calendarError);
        // Continue without calendar integration
      }
    }

    // Create scheduled interview record
    const { data: interview, error: interviewError } = await supabaseAdmin
      .from("scheduled_interviews")
      .insert({
        application_id: applicationId,
        job_id: application.job_id,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        timezone,
        interview_type: interviewType,
        interviewer_emails: interviewerEmails,
        google_event_id: eventId,
        google_meet_link: meetLink,
        google_calendar_link: calendarLink,
        notes,
        status: "scheduled",
      })
      .select()
      .single();

    if (interviewError) {
      console.error("Error creating interview:", interviewError);
      return NextResponse.json(
        { error: "Failed to schedule interview" },
        { status: 500 }
      );
    }

    // Update application status
    await supabaseAdmin
      .from("applications")
      .update({
        status: "interviewing",
        scheduled_interview_id: interview.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    // Send email to candidate
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 40px auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .details { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Interview Scheduled!</h1>
            </div>
            <div class="content">
              <p>Hi ${application.name},</p>
              <p>Great news! Your interview for the position of <strong>${application.jobs.title}</strong> has been scheduled.</p>

              <div class="details">
                <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZoneName: "short"
                })}</p>
                <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
                <p><strong>Type:</strong> ${interviewType === "video" ? "Video Interview" : interviewType === "phone" ? "Phone Interview" : "In-Person Interview"}</p>
                ${meetLink ? `<p><strong>Meeting Link:</strong> <a href="${meetLink}">${meetLink}</a></p>` : ""}
              </div>

              ${meetLink ? `
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${meetLink}" class="button">Join Video Interview</a>
                </p>
              ` : ""}

              <p><strong>Tips for your interview:</strong></p>
              <ul>
                <li>Test your audio and video before the interview</li>
                <li>Find a quiet, well-lit space</li>
                <li>Have your resume ready to reference</li>
                <li>Prepare questions about the role and company</li>
              </ul>

              <p>If you need to reschedule, please reply to this email.</p>

              <p>Good luck!</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: application.email,
        subject: `Interview Scheduled - ${application.jobs.title}`,
        html: emailHtml,
      });

      // Send confirmation email to recruiter
      const recruiterEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 40px auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #10B981, #059669); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .details { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Interview Confirmed</h1>
            </div>
            <div class="content">
              <p>You have scheduled an interview with <strong>${application.name}</strong> for the <strong>${application.jobs.title}</strong> position.</p>

              <div class="details">
                <p><strong>Candidate:</strong> ${application.name}</p>
                <p><strong>Email:</strong> ${application.email}</p>
                <p><strong>Phone:</strong> ${application.phone || "N/A"}</p>
                <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZoneName: "short"
                })}</p>
                <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
                ${meetLink ? `<p><strong>Meeting Link:</strong> <a href="${meetLink}">${meetLink}</a></p>` : ""}
              </div>

              ${meetLink ? `
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${meetLink}" class="button">Join Google Meet</a>
                </p>
              ` : ""}

              ${calendarLink ? `<p>This interview has been added to your Google Calendar. <a href="${calendarLink}">View in Calendar</a></p>` : ""}
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: recruiterEmail,
        subject: `Interview Confirmed: ${application.name} - ${application.jobs.title}`,
        html: recruiterEmailHtml,
      });
    } catch (emailError) {
      console.error("Error sending interview email:", emailError);
    }

    return NextResponse.json({
      success: true,
      interview: {
        id: interview.id,
        scheduledAt: interview.scheduled_at,
        meetLink,
        calendarLink,
        status: interview.status,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/interviews/schedule:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/interviews/schedule - Get scheduled interviews
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["hr", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming") === "true";

    let query = supabaseAdmin
      .from("scheduled_interviews")
      .select("*, applications(id, name, email, phone), jobs(id, title)")
      .order("scheduled_at", { ascending: true });

    if (applicationId) {
      query = query.eq("application_id", applicationId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (upcoming) {
      query = query.gte("scheduled_at", new Date().toISOString());
    }

    const { data: interviews, error } = await query;

    if (error) {
      console.error("Error fetching interviews:", error);
      return NextResponse.json(
        { error: "Failed to fetch interviews" },
        { status: 500 }
      );
    }

    return NextResponse.json(interviews);
  } catch (error) {
    console.error("Error in GET /api/interviews/schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
