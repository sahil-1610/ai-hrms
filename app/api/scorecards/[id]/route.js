import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET - Fetch a specific scorecard
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "hr" && session.user.role !== "admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from("interview_scorecards")
            .select(`
                *,
                hr_users:interviewer_id (id, name, email),
                scheduled_interviews:interview_id (id, scheduled_at, interview_type)
            `)
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return NextResponse.json({ error: "Scorecard not found" }, { status: 404 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Update a scorecard
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

        // Check if user owns this scorecard or is admin
        const { data: scorecard } = await supabaseAdmin
            .from("interview_scorecards")
            .select("interviewer_id")
            .eq("id", id)
            .single();

        if (!scorecard) {
            return NextResponse.json({ error: "Scorecard not found" }, { status: 404 });
        }

        if (scorecard.interviewer_id !== hrUser.id && session.user.role !== "admin") {
            return NextResponse.json(
                { error: "You can only edit your own scorecards" },
                { status: 403 }
            );
        }

        const updateData = {};
        const fieldMappings = {
            technicalSkills: "technical_skills",
            communication: "communication",
            problemSolving: "problem_solving",
            culturalFit: "cultural_fit",
            leadership: "leadership",
            overallRating: "overall_rating",
            recommendation: "recommendation",
            strengths: "strengths",
            concerns: "concerns",
            notes: "notes",
        };

        for (const [jsKey, dbKey] of Object.entries(fieldMappings)) {
            if (body[jsKey] !== undefined) {
                updateData[dbKey] = body[jsKey];
            }
        }

        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from("interview_scorecards")
            .update(updateData)
            .eq("id", id)
            .select()
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

// DELETE - Delete a scorecard
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

        // Check if user owns this scorecard or is admin
        const { data: scorecard } = await supabaseAdmin
            .from("interview_scorecards")
            .select("interviewer_id")
            .eq("id", id)
            .single();

        if (!scorecard) {
            return NextResponse.json({ error: "Scorecard not found" }, { status: 404 });
        }

        if (scorecard.interviewer_id !== hrUser.id && session.user.role !== "admin") {
            return NextResponse.json(
                { error: "You can only delete your own scorecards" },
                { status: 403 }
            );
        }

        const { error } = await supabaseAdmin
            .from("interview_scorecards")
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
