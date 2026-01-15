import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

// POST - Perform bulk operations on applications
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "hr" && session.user.role !== "admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { action, applicationIds, data } = body;

        if (!action) {
            return NextResponse.json(
                { error: "Action is required" },
                { status: 400 }
            );
        }

        if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
            return NextResponse.json(
                { error: "applicationIds array is required" },
                { status: 400 }
            );
        }

        let result;

        switch (action) {
            case "update_status":
                result = await handleBulkStatusUpdate(applicationIds, data);
                break;
            case "advance_stage":
                result = await handleBulkAdvanceStage(applicationIds, data);
                break;
            case "reject":
                result = await handleBulkReject(applicationIds, data);
                break;
            case "send_email":
                result = await handleBulkEmail(applicationIds, data);
                break;
            case "send_test_invite":
                result = await handleBulkTestInvite(applicationIds);
                break;
            case "send_interview_invite":
                result = await handleBulkInterviewInvite(applicationIds);
                break;
            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Bulk action error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

async function handleBulkStatusUpdate(applicationIds, data) {
    const { status } = data || {};

    if (!status) {
        throw new Error("Status is required for bulk status update");
    }

    const validStatuses = ["pending", "shortlisted", "in_progress", "rejected", "hired"];
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
    }

    const { data: updated, error } = await supabaseAdmin
        .from("applications")
        .update({
            status,
            updated_at: new Date().toISOString(),
        })
        .in("id", applicationIds)
        .select("id, name, email, status");

    if (error) throw error;

    return {
        success: true,
        action: "update_status",
        updatedCount: updated.length,
        applications: updated,
    };
}

async function handleBulkAdvanceStage(applicationIds, data) {
    const { targetStage } = data || {};

    // Get current applications
    const { data: applications, error: fetchError } = await supabaseAdmin
        .from("applications")
        .select("id, current_stage, name, email")
        .in("id", applicationIds);

    if (fetchError) throw fetchError;

    const stages = ["resume_screening", "mcq_test", "async_interview", "live_interview", "offer"];
    const results = [];

    for (const app of applications) {
        const currentIndex = stages.indexOf(app.current_stage);
        let newStage;

        if (targetStage) {
            newStage = targetStage;
        } else if (currentIndex < stages.length - 1) {
            newStage = stages[currentIndex + 1];
        } else {
            results.push({ id: app.id, name: app.name, error: "Already at final stage" });
            continue;
        }

        const { error: updateError } = await supabaseAdmin
            .from("applications")
            .update({
                current_stage: newStage,
                status: newStage === "hired" ? "hired" : "in_progress",
                updated_at: new Date().toISOString(),
            })
            .eq("id", app.id);

        if (updateError) {
            results.push({ id: app.id, name: app.name, error: updateError.message });
        } else {
            results.push({ id: app.id, name: app.name, newStage, success: true });
        }
    }

    return {
        success: true,
        action: "advance_stage",
        results,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => r.error).length,
    };
}

async function handleBulkReject(applicationIds, data) {
    const { sendRejectionEmail, rejectionReason } = data || {};

    const { data: updated, error } = await supabaseAdmin
        .from("applications")
        .update({
            status: "rejected",
            current_stage: "rejected",
            updated_at: new Date().toISOString(),
        })
        .in("id", applicationIds)
        .select("id, name, email, job_id, jobs(title)");

    if (error) throw error;

    // Send rejection emails if requested
    if (sendRejectionEmail && updated.length > 0) {
        const emailPromises = updated.map(app =>
            sendEmail({
                to: app.email,
                subject: `Application Update - ${app.jobs?.title || "Position"}`,
                html: `
                    <p>Dear ${app.name},</p>
                    <p>Thank you for your interest in the ${app.jobs?.title || "position"} role.</p>
                    <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
                    ${rejectionReason ? `<p>${rejectionReason}</p>` : ""}
                    <p>We appreciate the time you invested in your application and wish you success in your career.</p>
                    <p>Best regards,<br>The Hiring Team</p>
                `,
            }).catch(err => console.error(`Failed to send rejection email to ${app.email}:`, err))
        );

        await Promise.all(emailPromises);
    }

    return {
        success: true,
        action: "reject",
        rejectedCount: updated.length,
        emailsSent: sendRejectionEmail,
        applications: updated,
    };
}

async function handleBulkEmail(applicationIds, data) {
    const { subject, message } = data || {};

    if (!subject || !message) {
        throw new Error("Subject and message are required for bulk email");
    }

    // Get applications with emails
    const { data: applications, error } = await supabaseAdmin
        .from("applications")
        .select("id, name, email, jobs(title)")
        .in("id", applicationIds);

    if (error) throw error;

    const results = [];

    for (const app of applications) {
        try {
            await sendEmail({
                to: app.email,
                subject: subject.replace("{name}", app.name).replace("{job_title}", app.jobs?.title || ""),
                html: message
                    .replace(/{name}/g, app.name)
                    .replace(/{job_title}/g, app.jobs?.title || "the position"),
            });
            results.push({ id: app.id, email: app.email, success: true });
        } catch (emailError) {
            results.push({ id: app.id, email: app.email, error: emailError.message });
        }
    }

    return {
        success: true,
        action: "send_email",
        results,
        sentCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => r.error).length,
    };
}

async function handleBulkTestInvite(applicationIds) {
    const crypto = await import("crypto");
    const results = [];

    for (const appId of applicationIds) {
        try {
            // Check if test token already exists
            const { data: app } = await supabaseAdmin
                .from("applications")
                .select("id, name, email, test_token, job_id, jobs(title)")
                .eq("id", appId)
                .single();

            if (app.test_token) {
                results.push({ id: appId, name: app.name, error: "Test already sent" });
                continue;
            }

            // Generate test token
            const testToken = crypto.randomBytes(32).toString("hex");

            await supabaseAdmin
                .from("applications")
                .update({
                    test_token: testToken,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", appId);

            // Send email
            const testUrl = `${process.env.NEXT_PUBLIC_APP_URL}/test/${testToken}`;
            await sendEmail({
                to: app.email,
                subject: `MCQ Test Invitation - ${app.jobs?.title || "Position"}`,
                html: `
                    <p>Dear ${app.name},</p>
                    <p>Congratulations! You have been shortlisted for the ${app.jobs?.title || "position"} role.</p>
                    <p>Please complete the following MCQ test:</p>
                    <p><a href="${testUrl}">Click here to start your test</a></p>
                    <p>Good luck!</p>
                    <p>Best regards,<br>The Hiring Team</p>
                `,
            });

            results.push({ id: appId, name: app.name, success: true });
        } catch (err) {
            results.push({ id: appId, error: err.message });
        }
    }

    return {
        success: true,
        action: "send_test_invite",
        results,
        sentCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => r.error).length,
    };
}

async function handleBulkInterviewInvite(applicationIds) {
    const crypto = await import("crypto");
    const results = [];

    for (const appId of applicationIds) {
        try {
            // Check if interview token already exists
            const { data: app } = await supabaseAdmin
                .from("applications")
                .select("id, name, email, interview_token, job_id, jobs(title)")
                .eq("id", appId)
                .single();

            if (app.interview_token) {
                results.push({ id: appId, name: app.name, error: "Interview already sent" });
                continue;
            }

            // Generate interview token
            const interviewToken = crypto.randomBytes(32).toString("hex");

            await supabaseAdmin
                .from("applications")
                .update({
                    interview_token: interviewToken,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", appId);

            // Send email
            const interviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/interview/${interviewToken}`;
            await sendEmail({
                to: app.email,
                subject: `Async Interview Invitation - ${app.jobs?.title || "Position"}`,
                html: `
                    <p>Dear ${app.name},</p>
                    <p>You have been selected for an async interview for the ${app.jobs?.title || "position"} role.</p>
                    <p>Please record your interview at your convenience:</p>
                    <p><a href="${interviewUrl}">Click here to start your interview</a></p>
                    <p>Best regards,<br>The Hiring Team</p>
                `,
            });

            results.push({ id: appId, name: app.name, success: true });
        } catch (err) {
            results.push({ id: appId, error: err.message });
        }
    }

    return {
        success: true,
        action: "send_interview_invite",
        results,
        sentCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => r.error).length,
    };
}
