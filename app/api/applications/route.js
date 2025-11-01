import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/applications - List all applications (HR/Admin only) OR get by token (public)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const testToken = searchParams.get("testToken");

    // If test token is provided, allow public access for test taking
    if (testToken) {
      const { data: application, error } = await supabaseAdmin
        .from("applications")
        .select("*, jobs(id, title, location, company, description)")
        .eq("test_token", testToken)
        .single();

      if (error || !application) {
        return NextResponse.json(
          { error: "Invalid test link or test not assigned" },
          { status: 404 }
        );
      }

      return NextResponse.json(application);
    }

    // If application token is provided, allow public access for candidate status tracking
    if (token) {
      const { data: application, error } = await supabaseAdmin
        .from("applications")
        .select("*, jobs(id, title, location)")
        .eq("application_token", token)
        .single();

      if (error || !application) {
        return NextResponse.json(
          { error: "Application not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(application);
    }

    // Otherwise, require authentication for HR/Admin
    const session = await getServerSession(authOptions);

    // Only hr and admin can view all applications
    if (
      !session ||
      (session.user.role !== "hr" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = searchParams.get("job_id");
    const status = searchParams.get("status");

    let query = supabaseAdmin
      .from("applications")
      .select("*, jobs(id, title, location, status)");

    // Filter by job if specified
    if (jobId) {
      query = query.eq("job_id", jobId);
    }

    // Filter by status if specified
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Order by match score (best matches first)
    const { data: applications, error } = await query.order(
      "resume_match_score",
      {
        ascending: false,
      }
    );

    if (error) {
      console.error("Error fetching applications:", error);
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 }
      );
    }

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error in GET /api/applications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
