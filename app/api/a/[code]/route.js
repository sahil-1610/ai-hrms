import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/a/[code] - Get asset by short code (public endpoint)
export async function GET(request, { params }) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json({ error: "Asset code required" }, { status: 400 });
    }

    const { data: asset, error } = await supabaseAdmin
      .from("assets")
      .select("*")
      .eq("short_code", code)
      .single();

    if (error || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Error in GET /api/a/[code]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
