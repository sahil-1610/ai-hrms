import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { getTokensFromCode } from "@/lib/google";
import { google } from "googleapis";

// GET /api/auth/google/callback - Handle Google OAuth callback
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.redirect(
        new URL("/auth/signin?error=unauthorized", request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL("/admin/settings?error=google_denied", request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/admin/settings?error=no_code", request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Get user's email from Google
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: googleUser } = await oauth2.userinfo.get();

    // Store tokens in database
    const { error: updateError } = await supabaseAdmin
      .from("hr_users")
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        google_email: googleUser.email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    if (updateError) {
      console.error("Error storing Google tokens:", updateError);
      return NextResponse.redirect(
        new URL("/admin/settings?error=storage_failed", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/admin/settings?success=google_connected", request.url)
    );
  } catch (error) {
    console.error("Error in Google OAuth callback:", error);
    return NextResponse.redirect(
      new URL("/admin/settings?error=callback_failed", request.url)
    );
  }
}
