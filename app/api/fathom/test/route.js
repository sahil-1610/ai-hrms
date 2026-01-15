import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getFathomRecordings } from "@/lib/fathom";

/**
 * POST /api/fathom/test
 * Test Fathom API connection with provided API key
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["hr", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Test the API key by fetching recordings
    const recordings = await getFathomRecordings(apiKey, { limit: 1 });

    return NextResponse.json({
      success: true,
      message: "Fathom connection successful",
      recordingsCount: recordings?.data?.length || 0,
    });
  } catch (error) {
    console.error("Error testing Fathom connection:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect to Fathom" },
      { status: 400 }
    );
  }
}
