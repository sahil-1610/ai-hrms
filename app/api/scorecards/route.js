import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET - Fetch scorecards for an interview or application
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "hr" && session.user.role !== "admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const interviewId = searchParams.get("interviewId");
        const applicationId = searchParams.get("applicationId");

        let query = supabaseAdmin
            .from("interview_scorecards")
            .select(`
                *,
                hr_users:interviewer_id (id, name, email),
                scheduled_interviews:interview_id (id, scheduled_at, interview_type)
            `)
            .order("created_at", { ascending: false });

        if (interviewId) {
            query = query.eq("interview_id", interviewId);
        }

        if (applicationId) {
            // Get all scorecards for interviews related to this application
            const { data: interviews } = await supabaseAdmin
                .from("scheduled_interviews")
                .select("id")
                .eq("application_id", applicationId);

            if (interviews && interviews.length > 0) {
                const interviewIds = interviews.map((i) => i.id);
                query = query.in("interview_id", interviewIds);
            } else {
                return NextResponse.json([]);
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching scorecards:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a new scorecard
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "hr" && session.user.role !== "admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            interviewId,
            technicalSkills,
            communication,
            problemSolving,
            culturalFit,
            leadership,
            overallRating,
            recommendation,
            strengths,
            concerns,
            notes,
        } = body;

        if (!interviewId) {
            return NextResponse.json(
                { error: "Interview ID is required" },
                { status: 400 }
            );
        }

        // Validate rating values
        const ratings = [technicalSkills, communication, problemSolving, culturalFit, leadership, overallRating];
        for (const rating of ratings) {
            if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
                return NextResponse.json(
                    { error: "Ratings must be between 1 and 5" },
                    { status: 400 }
                );
            }
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

        // Check if scorecard already exists for this interviewer and interview
        const { data: existing } = await supabaseAdmin
            .from("interview_scorecards")
            .select("id")
            .eq("interview_id", interviewId)
            .eq("interviewer_id", hrUser.id)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: "You have already submitted a scorecard for this interview" },
                { status: 409 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from("interview_scorecards")
            .insert({
                interview_id: interviewId,
                interviewer_id: hrUser.id,
                technical_skills: technicalSkills || null,
                communication: communication || null,
                problem_solving: problemSolving || null,
                cultural_fit: culturalFit || null,
                leadership: leadership || null,
                overall_rating: overallRating || null,
                recommendation: recommendation || null,
                strengths: strengths || null,
                concerns: concerns || null,
                notes: notes || null,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating scorecard:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
