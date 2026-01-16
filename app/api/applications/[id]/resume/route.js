import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import cloudinary from "@/lib/cloudinary";

// GET /api/applications/[id]/resume - Proxy download for resume (serves actual PDF)
// Uses Cloudinary Admin API to download files with proper authentication
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and has HR or Admin role
    if (!session || !["hr", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the application with resume URL
    const { data: application, error } = await supabaseAdmin
      .from("applications")
      .select("name, resume_url, resume_public_id")
      .eq("id", id)
      .single();

    if (error || !application) {
      console.error("Error fetching application:", error);
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (!application.resume_url && !application.resume_public_id) {
      return NextResponse.json({ error: "No resume found for this application" }, { status: 404 });
    }

    let buffer;

    // Method 1: Use Cloudinary's download_url helper (authenticated download)
    if (application.resume_public_id) {
      try {
        console.log("Generating authenticated download URL for:", application.resume_public_id);

        // Generate a time-limited authenticated download URL
        const timestamp = Math.floor(Date.now() / 1000);
        const expiresAt = timestamp + 3600; // 1 hour

        // Create signature for authenticated URL
        const signaturePayload = {
          public_id: application.resume_public_id,
          timestamp: timestamp,
        };

        const signature = cloudinary.utils.api_sign_request(
          signaturePayload,
          process.env.CLOUDINARY_API_SECRET
        );

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;

        // Build authenticated download URL
        const authUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/s--${signature.substring(0, 8)}--/${application.resume_public_id}`;

        console.log("Trying authenticated URL");
        const response = await fetch(authUrl);

        if (response.ok) {
          buffer = Buffer.from(await response.arrayBuffer());
          console.log("Successfully fetched via authenticated URL");
        } else {
          console.log("Authenticated URL failed:", response.status);
        }
      } catch (authError) {
        console.error("Authenticated download failed:", authError.message);
      }
    }

    // Method 2: Use private_download_url for authenticated access
    if (!buffer && application.resume_public_id) {
      try {
        console.log("Trying private download URL");

        const downloadUrl = cloudinary.utils.private_download_url(
          application.resume_public_id,
          "pdf",  // format
          {
            resource_type: "raw",
            type: "upload",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          }
        );

        console.log("Private download URL:", downloadUrl);
        const response = await fetch(downloadUrl);

        if (response.ok) {
          buffer = Buffer.from(await response.arrayBuffer());
          console.log("Successfully fetched via private download URL");
        } else {
          console.log("Private download failed:", response.status);
        }
      } catch (privateError) {
        console.error("Private download failed:", privateError.message);
      }
    }

    // Method 3: Try API resource fetch with URL
    if (!buffer && application.resume_public_id) {
      try {
        console.log("Getting resource from Cloudinary API");

        const resource = await cloudinary.api.resource(application.resume_public_id, {
          resource_type: "raw",
          type: "upload",
        });

        if (resource && resource.secure_url) {
          // Try fetching with Basic Auth header
          const apiKey = process.env.CLOUDINARY_API_KEY;
          const apiSecret = process.env.CLOUDINARY_API_SECRET;
          const authHeader = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

          const response = await fetch(resource.secure_url, {
            headers: {
              'Authorization': `Basic ${authHeader}`,
            },
          });

          if (response.ok) {
            buffer = Buffer.from(await response.arrayBuffer());
            console.log("Successfully fetched via API resource URL with auth");
          } else {
            // Try without auth (in case file is public)
            const plainResponse = await fetch(resource.secure_url);
            if (plainResponse.ok) {
              buffer = Buffer.from(await plainResponse.arrayBuffer());
              console.log("Successfully fetched via API resource URL");
            } else {
              console.log("API resource fetch failed:", plainResponse.status);
            }
          }
        }
      } catch (apiError) {
        console.error("API resource failed:", apiError.message);
      }
    }

    // Method 4: Try signed URL approach
    if (!buffer && application.resume_public_id) {
      try {
        console.log("Generating signed URL");

        const signedUrl = cloudinary.url(application.resume_public_id, {
          resource_type: "raw",
          type: "upload",
          sign_url: true,
          secure: true,
        });

        console.log("Signed URL:", signedUrl);
        const response = await fetch(signedUrl);

        if (response.ok) {
          buffer = Buffer.from(await response.arrayBuffer());
          console.log("Successfully fetched via signed URL");
        } else {
          console.log("Signed URL failed:", response.status);
        }
      } catch (signedError) {
        console.error("Signed URL failed:", signedError.message);
      }
    }

    // Method 5: Direct URL as last resort
    if (!buffer && application.resume_url) {
      try {
        console.log("Trying direct URL:", application.resume_url);
        const response = await fetch(application.resume_url);

        if (response.ok) {
          buffer = Buffer.from(await response.arrayBuffer());
          console.log("Successfully fetched via direct URL");
        } else {
          console.log("Direct URL failed:", response.status);
        }
      } catch (fetchError) {
        console.error("Direct fetch error:", fetchError.message);
      }
    }

    if (!buffer) {
      console.error("All fetch methods failed for resume");
      return NextResponse.json(
        {
          error: "Failed to fetch resume from storage. Please check Cloudinary security settings.",
          hint: "Go to Cloudinary Dashboard > Settings > Security and disable 'Strict transformations' for raw files, or enable 'Allow fetching of authenticated images'."
        },
        { status: 500 }
      );
    }

    // Determine filename and content type
    const fileName = application.name
      ? `${application.name.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`
      : "Resume.pdf";

    // Check if it's actually a PDF or Word doc based on public_id
    const publicId = application.resume_public_id || "";
    const isPdf = publicId.toLowerCase().endsWith('.pdf') || application.resume_url?.toLowerCase().includes('.pdf');
    const isDocx = publicId.toLowerCase().endsWith('.docx') || application.resume_url?.toLowerCase().includes('.docx');

    const contentType = isPdf
      ? "application/pdf"
      : isDocx
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/octet-stream";

    // Return the file with proper headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
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
