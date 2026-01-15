import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

// PATCH - Update a note
export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "hr" && session.user.role !== "admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Get the HR user ID
        const { data: hrUser } = await supabaseAdmin
            .from("hr_users")
            .select("id")
            .eq("email", session.user.email)
            .single();

        if (!hrUser) {
            return NextResponse.json({ error: "HR user not found" }, { status: 404 });
        }

        // Check if user owns this note or is admin
        const { data: note } = await supabaseAdmin
            .from("candidate_notes")
            .select("hr_user_id")
            .eq("id", id)
            .single();

        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        if (note.hr_user_id !== hrUser.id && session.user.role !== "admin") {
            return NextResponse.json(
                { error: "You can only edit your own notes" },
                { status: 403 }
            );
        }

        const updateData = {
            updated_at: new Date().toISOString(),
        };

        if (body.content !== undefined) {
            updateData.content = body.content.trim();
        }

        if (body.isPinned !== undefined) {
            updateData.is_pinned = body.isPinned;
        }

        const { data, error } = await supabaseAdmin
            .from("candidate_notes")
            .update(updateData)
            .eq("id", id)
            .select(`
                *,
                hr_users:hr_user_id (id, name, email)
            `)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete a note
export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "hr" && session.user.role !== "admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Get the HR user ID
        const { data: hrUser } = await supabaseAdmin
            .from("hr_users")
            .select("id")
            .eq("email", session.user.email)
            .single();

        if (!hrUser) {
            return NextResponse.json({ error: "HR user not found" }, { status: 404 });
        }

        // Check if user owns this note or is admin
        const { data: note } = await supabaseAdmin
            .from("candidate_notes")
            .select("hr_user_id")
            .eq("id", id)
            .single();

        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        if (note.hr_user_id !== hrUser.id && session.user.role !== "admin") {
            return NextResponse.json(
                { error: "You can only delete your own notes" },
                { status: 403 }
            );
        }

        const { error } = await supabaseAdmin
            .from("candidate_notes")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
