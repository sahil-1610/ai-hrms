import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/openai";

// GET /api/jobs - List all jobs (admin/hr) or active jobs (public)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabaseAdmin.from("jobs").select("*, applications(count)");

    // If not authenticated or not hr/admin, show only active jobs
    if (
      !session ||
      (session.user.role !== "hr" && session.user.role !== "admin")
    ) {
      query = query.eq("status", "active");
    } else if (status) {
      // Filter by status for hr/admin
      query = query.eq("status", status);
    }

    const { data: jobs, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching jobs:", error);
      return NextResponse.json(
        {
          error: "Unable to load jobs at this time. Please try again later.",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    // Format the response
    const formattedJobs = jobs.map((job) => ({
      ...job,
      description: job.jd_text, // Map jd_text to description for frontend
      applicationCount: job.applications?.[0]?.count || 0,
    }));

    return NextResponse.json(formattedJobs);
  } catch (error) {
    console.error("Error in GET /api/jobs:", error);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while loading jobs. Please refresh the page.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    // Only hr and admin can create jobs
    if (
      !session ||
      (session.user.role !== "hr" && session.user.role !== "admin")
    ) {
      return NextResponse.json(
        {
          error:
            "You don't have permission to create jobs. Only HR staff can create job postings.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      location,
      experienceMin,
      experienceMax,
      salaryMin,
      salaryMax,
      skills,
      numberOfPositions = 1,
      status = "draft",
    } = body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !location ||
      experienceMin === undefined ||
      experienceMax === undefined
    ) {
      const missingFields = [];
      if (!title) missingFields.push("title");
      if (!description) missingFields.push("job description");
      if (!location) missingFields.push("location");
      if (experienceMin === undefined) missingFields.push("minimum experience");
      if (experienceMax === undefined) missingFields.push("maximum experience");

      return NextResponse.json(
        {
          error: `Please fill in all required fields: ${missingFields.join(
            ", "
          )}`,
          missingFields,
        },
        { status: 400 }
      );
    }

    // Validate experience range
    if (experienceMin < 0 || experienceMax < experienceMin) {
      return NextResponse.json(
        {
          error:
            experienceMin < 0
              ? "Experience cannot be negative"
              : "Maximum experience must be greater than or equal to minimum experience",
          field: "experience",
        },
        { status: 400 }
      );
    }

    // Validate salary range if provided
    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      salaryMax < salaryMin
    ) {
      return NextResponse.json(
        {
          error:
            "Maximum salary must be greater than or equal to minimum salary",
          field: "salary",
        },
        { status: 400 }
      );
    }

    // Generate embedding for the job description
    const jd_embedding = await generateEmbedding(description);

    // Format salary range
    const salary_range =
      salaryMin && salaryMax
        ? `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`
        : salaryMin
        ? `From $${salaryMin.toLocaleString()}`
        : salaryMax
        ? `Up to $${salaryMax.toLocaleString()}`
        : null;

    // Insert the job into the database
    const { data: job, error } = await supabaseAdmin
      .from("jobs")
      .insert({
        title,
        jd_text: description,
        location,
        experience_min: experienceMin,
        experience_max: experienceMax,
        salary_range,
        skills: skills || [],
        number_of_positions: numberOfPositions,
        status,
        jd_embedding,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating job:", error);

      // Check for specific database errors
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "A job with this title already exists. Please use a different title.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to create job. Please try again.",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/jobs:", error);

    // Handle specific errors
    if (error.message?.includes("API key")) {
      return NextResponse.json(
        { error: "AI service is unavailable. Please contact support." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while creating the job. Please try again.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
