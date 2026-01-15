import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET - Fetch notifications for the current user
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "hr" && session.user.role !== "admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get("unreadOnly") === "true";
        const limit = parseInt(searchParams.get("limit") || "50");

        // Get the HR user ID
        const { data: hrUser } = await supabaseAdmin
            .from("hr_users")
            .select("id")
            .eq("email", session.user.email)
            .single();

        if (!hrUser) {
            return NextResponse.json({ error: "HR user not found" }, { status: 404 });
        }

        let query = supabaseAdmin
            .from("notifications")
            .select(`
                *,
                applications:application_id (id, name, email),
                jobs:job_id (id, title)
            `)
            .or(`hr_user_id.eq.${hrUser.id},hr_user_id.is.null`)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (unreadOnly) {
            query = query.eq("is_read", false);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching notifications:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get unread count
        const { count } = await supabaseAdmin
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .or(`hr_user_id.eq.${hrUser.id},hr_user_id.is.null`)
            .eq("is_read", false);

        return NextResponse.json({
            notifications: data,
            unreadCount: count || 0,
        });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a notification (usually called internally)
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "hr" && session.user.role !== "admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { hrUserId, type, title, message, link, applicationId, jobId } = body;

        if (!type || !title || !message) {
            return NextResponse.json(
                { error: "Type, title, and message are required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from("notifications")
            .insert({
                hr_user_id: hrUserId || null, // null means broadcast to all HR users
                type,
                title,
                message,
                link: link || null,
                application_id: applicationId || null,
                job_id: jobId || null,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating notification:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Mark notifications as read
export async function PATCH(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "hr" && session.user.role !== "admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { notificationIds, markAllRead } = body;

        // Get the HR user ID
        const { data: hrUser } = await supabaseAdmin
            .from("hr_users")
            .select("id")
            .eq("email", session.user.email)
            .single();

        if (!hrUser) {
            return NextResponse.json({ error: "HR user not found" }, { status: 404 });
        }

        if (markAllRead) {
            // Mark all notifications as read for this user
            const { error } = await supabaseAdmin
                .from("notifications")
                .update({ is_read: true })
                .or(`hr_user_id.eq.${hrUser.id},hr_user_id.is.null`)
                .eq("is_read", false);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, markedAll: true });
        }

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return NextResponse.json(
                { error: "notificationIds array is required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from("notifications")
            .update({ is_read: true })
            .in("id", notificationIds)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, updated: data.length });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
