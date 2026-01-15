import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/company/settings - Get company settings
export async function GET() {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from("company_settings")
      .select("*")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching company settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    return NextResponse.json(settings || {});
  } catch (error) {
    console.error("Error in GET /api/company/settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/company/settings - Update company settings
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["hr", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Check if settings exist
    const { data: existing } = await supabaseAdmin
      .from("company_settings")
      .select("id")
      .single();

    let result;

    if (existing) {
      // Update existing settings
      const { data, error } = await supabaseAdmin
        .from("company_settings")
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new settings
      const { data, error } = await supabaseAdmin
        .from("company_settings")
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PUT /api/company/settings:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
