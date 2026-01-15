import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/assets/download/[id] - Proxy download for assets
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Asset ID required" }, { status: 400 });
    }

    // Check if id is a short_code or uuid
    const isUuid = id.includes("-") && id.length > 20;

    const { data: asset, error } = await supabaseAdmin
      .from("assets")
      .select("*")
      .eq(isUuid ? "id" : "short_code", id)
      .single();

    if (error || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Fetch the file from Cloudinary
    const response = await fetch(asset.url);

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
    }

    const buffer = await response.arrayBuffer();

    // Return the file with proper headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": asset.mime_type || "application/octet-stream",
        "Content-Disposition": `inline; filename="${asset.name}"`,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Error in download proxy:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
