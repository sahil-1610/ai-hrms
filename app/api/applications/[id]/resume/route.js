import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/applications/[id]/resume - Proxy download for resume (serves actual PDF)
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has HR or Admin role
    if (!session || !["hr", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the application with resume URL (name is directly in applications table)
    const { data: application, error } = await supabaseAdmin
      .from("applications")
      .select("name, resume_url")
      .eq("id", id)
      .single();

    if (error || !application) {
      console.error("Error fetching application:", error);
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (!application.resume_url) {
      return NextResponse.json({ error: "No resume found for this application" }, { status: 404 });
    }

    // Fetch the PDF from Cloudinary
    const response = await fetch(application.resume_url);

    if (!response.ok) {
      console.error("Failed to fetch from Cloudinary:", response.status, response.statusText);
      return NextResponse.json({ error: "Failed to fetch resume" }, { status: 500 });
    }

    const buffer = await response.arrayBuffer();
    const fileName = application.name
      ? `${application.name.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`
      : "Resume.pdf";

    // Return the PDF with proper headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/applications/[id]/resume:", error);
    return NextResponse.json(
      { error: "Failed to get resume" },
      { status: 500 }
    );
  }
}
