import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET - Fetch notes for an application
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "hr" && session.user.role !== "admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const applicationId = searchParams.get("applicationId");

        if (!applicationId) {
            return NextResponse.json(
                { error: "Application ID is required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from("candidate_notes")
            .select(`
                *,
                hr_users:hr_user_id (id, name, email)
            `)
            .eq("application_id", applicationId)
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching notes:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a new note
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "hr" && session.user.role !== "admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { applicationId, content, isPinned } = body;

        if (!applicationId || !content) {
            return NextResponse.json(
                { error: "Application ID and content are required" },
                { status: 400 }
            );
        }

        // Get the HR user ID
        const { data: hrUser } = await supabaseAdmin
            .from("hr_users")
            .select("id")
            .eq("email", session.user.email)
            .single();

        if (!hrUser) {
            return NextResponse.json({ error: "HR user not found" }, { status: 404 });
        }

        const { data, error } = await supabaseAdmin
            .from("candidate_notes")
            .insert({
                application_id: applicationId,
                hr_user_id: hrUser.id,
                content: content.trim(),
                is_pinned: isPinned || false,
            })
            .select(`
                *,
                hr_users:hr_user_id (id, name, email)
            `)
            .single();

        if (error) {
            console.error("Error creating note:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
