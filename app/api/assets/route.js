import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

// Generate a unique short code for assets
function generateShortCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Ensure short code is unique
async function getUniqueShortCode() {
  let attempts = 0;
  while (attempts < 10) {
    const code = generateShortCode();
    const { data } = await supabaseAdmin
      .from("assets")
      .select("id")
      .eq("short_code", code)
      .single();

    if (!data) {
      return code;
    }
    attempts++;
  }
  // Fallback to longer code if collision keeps happening
  return generateShortCode(12);
}

// GET /api/assets - List all assets
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "hr" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "image", "document", or null for all
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabaseAdmin
      .from("assets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching assets:", error);
      return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in GET /api/assets:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/assets - Upload a new asset
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "hr" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const name = formData.get("name") || file.name;
    const description = formData.get("description") || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    // Determine file type
    const mimeType = file.type;
    let assetType = "other";

    if (mimeType.startsWith("image/")) {
      assetType = "image";
    } else if (
      mimeType === "application/pdf" ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      assetType = "document";
    }

    // Validate file types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: Images (JPEG, PNG, GIF, WebP, SVG), PDF, DOCX" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const folder = assetType === "image" ? "hrms/assets/images" : "hrms/assets/documents";
    const { url, publicId } = await uploadToCloudinary(buffer, file.name, folder);

    // Generate unique short code
    const shortCode = await getUniqueShortCode();

    // Save to database
    const { data: asset, error: dbError } = await supabaseAdmin
      .from("assets")
      .insert({
        name,
        description,
        type: assetType,
        mime_type: mimeType,
        url,
        public_id: publicId,
        size: file.size,
        uploaded_by: session.user.id,
        short_code: shortCode,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Try to delete the uploaded file if DB insert fails
      try {
        await deleteFromCloudinary(publicId);
      } catch (e) {
        console.error("Failed to cleanup Cloudinary file:", e);
      }
      return NextResponse.json({ error: "Failed to save asset" }, { status: 500 });
    }

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/assets:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/assets - Delete an asset
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "hr" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Asset ID required" }, { status: 400 });
    }

    // Get asset details first
    const { data: asset, error: fetchError } = await supabaseAdmin
      .from("assets")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Delete from Cloudinary
    if (asset.public_id) {
      try {
        await deleteFromCloudinary(asset.public_id);
      } catch (e) {
        console.error("Failed to delete from Cloudinary:", e);
      }
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from("assets")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Database delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/assets:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
