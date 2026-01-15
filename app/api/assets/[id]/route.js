import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/assets/[id] - Get a single asset
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Asset ID required" }, { status: 400 });
    }

    const { data: asset, error } = await supabaseAdmin
      .from("assets")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Error in GET /api/assets/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
