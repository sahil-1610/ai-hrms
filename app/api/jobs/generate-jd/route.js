import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateJobDescription } from "@/lib/openai";

// POST /api/jobs/generate-jd - Generate job description using AI
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    // Only hr and admin can generate job descriptions
    if (
      !session ||
      (session.user.role !== "hr" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      location,
      experienceMin,
      experienceMax,
      skills,
      salaryMin,
      salaryMax,
    } = body;

    // Validate required fields
    if (
      !title ||
      !location ||
      experienceMin === undefined ||
      experienceMax === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, location, experienceMin, experienceMax",
        },
        { status: 400 }
      );
    }

    // Prepare job details for AI
    const jobDetails = {
      title,
      location,
      experienceMin,
      experienceMax,
      skills: skills || [],
    };

    // Add salary if provided
    if (salaryMin !== undefined && salaryMax !== undefined) {
      jobDetails.salaryMin = salaryMin;
      jobDetails.salaryMax = salaryMax;
    }

    // Generate job description using OpenAI
    const description = await generateJobDescription(jobDetails);

    return NextResponse.json({ description });
  } catch (error) {
    console.error("Error in POST /api/jobs/generate-jd:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate job description" },
      { status: 500 }
    );
  }
}
