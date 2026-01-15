import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/openai";

// GET /api/jobs/[id] - Get a single job
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data: job, error } = await supabaseAdmin
      .from("jobs")
      .select("*, applications(count)")
      .eq("id", id)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Format the response
    const formattedJob = {
      ...job,
      description: job.jd_text, // Map jd_text to description for frontend
      applicationCount: job.applications?.[0]?.count || 0,
    };

    return NextResponse.json(formattedJob);
  } catch (error) {
    console.error("Error in GET /api/jobs/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/jobs/[id] - Update a job
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    // Only hr and admin can update jobs
    if (
      !session ||
      (session.user.role !== "hr" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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
      status,
      numberOfPositions,
    } = body;

    // Build update object with only provided fields
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.jd_text = description;
    if (location !== undefined) updates.location = location;
    if (experienceMin !== undefined) updates.experience_min = experienceMin;
    if (experienceMax !== undefined) updates.experience_max = experienceMax;
    if (skills !== undefined) updates.skills = skills;
    if (status !== undefined) updates.status = status;
    if (numberOfPositions !== undefined) updates.number_of_positions = numberOfPositions;

    // Handle salary range
    if (salaryMin !== undefined || salaryMax !== undefined) {
      const min = salaryMin !== undefined ? salaryMin : null;
      const max = salaryMax !== undefined ? salaryMax : null;
      updates.salary_range =
        min && max
          ? `$${min.toLocaleString()} - $${max.toLocaleString()}`
          : min
          ? `From $${min.toLocaleString()}`
          : max
          ? `Up to $${max.toLocaleString()}`
          : null;
    }

    // Validate experience range if both are being updated
    if (
      updates.experience_min !== undefined &&
      updates.experience_max !== undefined
    ) {
      if (
        updates.experience_min < 0 ||
        updates.experience_max < updates.experience_min
      ) {
        return NextResponse.json(
          { error: "Invalid experience range" },
          { status: 400 }
        );
      }
    }

    // Validate salary range if both are being updated
    if (salaryMin !== undefined && salaryMax !== undefined) {
      if (salaryMax < salaryMin) {
        return NextResponse.json(
          { error: "Invalid salary range" },
          { status: 400 }
        );
      }
    }

    // If description is updated, regenerate embedding
    if (description !== undefined) {
      updates.jd_embedding = await generateEmbedding(description);
    }

    // Update the job
    const { data: job, error } = await supabaseAdmin
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !job) {
      console.error("Error updating job:", error);
      return NextResponse.json(
        { error: "Failed to update job" },
        { status: 500 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error in PATCH /api/jobs/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete a job
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    // Only hr and admin can delete jobs
    if (
      !session ||
      (session.user.role !== "hr" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if job has applications
    const { data: applications } = await supabaseAdmin
      .from("applications")
      .select("id")
      .eq("job_id", id)
      .limit(1);

    if (applications && applications.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete job with existing applications. Please close the job instead.",
        },
        { status: 400 }
      );
    }

    // Delete the job
    const { error } = await supabaseAdmin.from("jobs").delete().eq("id", id);

    if (error) {
      console.error("Error deleting job:", error);
      return NextResponse.json(
        { error: "Failed to delete job" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/jobs/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
