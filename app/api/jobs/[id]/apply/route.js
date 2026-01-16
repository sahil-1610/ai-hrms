import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { sendEmail } from "@/lib/email";
import { applicationSubmittedTemplate } from "@/lib/emailTemplates";
import { extractResumeText } from "@/lib/resumeParser";
import { matchResumeToJob, generateEmbedding } from "@/lib/openai";
import { calculateMatchScore } from "@/utils/scoring";

// POST /api/jobs/[id]/apply - Submit job application (NO AUTH REQUIRED)
// Candidates don't need accounts - they submit with their info
// Resume is parsed and AI analysis runs automatically during submission
export async function POST(request, { params }) {
  try {
    const { id: jobId } = await params;

    // Check if job exists and is active (including fields needed for AI analysis)
    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("id, title, status, jd_text, jd_embedding, skills, experience_min, experience_max, location")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "active") {
      return NextResponse.json(
        { error: "This job is no longer accepting applications" },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const resumeFile = formData.get("resume");
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const currentCompany = formData.get("currentCompany") || null;
    const experience = formData.get("experience")
      ? parseInt(formData.get("experience"))
      : null;
    const skills = formData.get("skills") || "";
    const education = formData.get("education") || null;
    const coverLetter = formData.get("coverLetter") || null;

    // Validate required fields
    if (!resumeFile || !name || !email || !phone) {
      return NextResponse.json(
        { error: "Missing required fields: resume, name, email, phone" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (resumeFile.size > maxSize) {
      return NextResponse.json(
        { error: "Resume file too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!validTypes.includes(resumeFile.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload PDF or DOCX files only." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone) || phone.length < 10) {
      return NextResponse.json(
        { error: "Please provide a valid phone number." },
        { status: 400 }
      );
    }

    // Check if email has already applied to this job (prevent duplicates)
    const { data: existingApp } = await supabaseAdmin
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("email", email)
      .single();

    if (existingApp) {
      return NextResponse.json(
        { error: "You have already applied to this job with this email" },
        { status: 400 }
      );
    }

    // Convert file to buffer for upload
    const bytes = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload resume to Cloudinary
    let resumeUrl;
    let resumePublicId;
    try {
      const uploadResult = await uploadToCloudinary(
        buffer,
        resumeFile.name,
        "hrms/resumes"
      );
      resumeUrl = uploadResult.url;
      resumePublicId = uploadResult.publicId;
    } catch (uploadError) {
      console.error("Error uploading resume to Cloudinary:", uploadError);
      return NextResponse.json(
        {
          error:
            "Failed to upload resume. Please try again or contact support.",
        },
        { status: 500 }
      );
    }

    // Parse resume text from the buffer
    let resumeText = null;
    try {
      resumeText = await extractResumeText(buffer, resumeFile.type);
      console.log(`Extracted ${resumeText?.length || 0} characters from resume`);
    } catch (parseError) {
      console.error("Error parsing resume text:", parseError);
      // Don't fail the application if parsing fails - admin can analyze later
    }

    // Run AI analysis if we have resume text and job description
    let resumeEmbedding = null;
    let matchScore = null;
    let aiMatchData = null;

    if (resumeText && resumeText.length >= 50 && job.jd_text) {
      try {
        console.log("Running AI resume analysis...");

        // Generate resume embedding for vector search
        resumeEmbedding = await generateEmbedding(resumeText);

        // Calculate cosine similarity score if job has embedding
        let cosineSimilarityScore = 0;
        if (job.jd_embedding) {
          cosineSimilarityScore = calculateMatchScore(resumeEmbedding, job.jd_embedding);
        }

        // Perform AI match analysis
        const aiMatchAnalysis = await matchResumeToJob(resumeText, job.jd_text, {
          title: job.title,
          skills: job.skills || [],
          minExp: job.experience_min || 0,
          maxExp: job.experience_max || 5,
          location: job.location,
        });

        // Use AI score as primary match score
        matchScore = aiMatchAnalysis.matchScore;

        // Store detailed analysis data
        aiMatchData = JSON.stringify({
          recommendation: aiMatchAnalysis.recommendation,
          strengths: aiMatchAnalysis.strengths,
          concerns: aiMatchAnalysis.concerns,
          skillsMatch: aiMatchAnalysis.skillsMatch,
          experienceMatch: aiMatchAnalysis.experienceMatch,
          summary: aiMatchAnalysis.summary,
          aiScore: aiMatchAnalysis.matchScore,
          cosineScore: cosineSimilarityScore,
          analyzedAt: new Date().toISOString(),
          analyzedBy: "auto",
        });

        console.log("AI Analysis complete:", {
          matchScore,
          recommendation: aiMatchAnalysis.recommendation,
          cosineScore: cosineSimilarityScore,
        });
      } catch (aiError) {
        console.error("Error in AI analysis:", aiError);
        // Don't fail the application if AI analysis fails - can be done later by admin
      }
    } else {
      console.log("Skipping AI analysis:", {
        hasResumeText: !!resumeText,
        resumeTextLength: resumeText?.length || 0,
        hasJobDescription: !!job.jd_text,
      });
    }

    // Parse skills array
    const skillsArray = skills
      ? skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    // Create application with AI analysis results
    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .insert({
        job_id: jobId,
        name,
        email,
        phone,
        current_company: currentCompany,
        experience,
        skills: skillsArray,
        education,
        cover_letter: coverLetter,
        resume_url: resumeUrl,
        resume_public_id: resumePublicId,
        resume_text: resumeText,
        resume_embedding: resumeEmbedding,
        resume_match_score: matchScore,
        overall_score: matchScore,
        ai_match_data: aiMatchData,
        status: "submitted",
        current_stage: "resume_screening",
        // application_token is auto-generated by database
      })
      .select()
      .single();

    if (appError) {
      console.error("Error creating application:", appError);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    // Send confirmation email to candidate
    try {
      const emailTemplate = applicationSubmittedTemplate(
        application.name,
        job.title,
        application.application_token
      );
      await sendEmail({
        to: application.email,
        subject: `Application Received - ${job.title}`,
        html: emailTemplate,
      });
      console.log(`Confirmation email sent to ${application.email}`);
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the application if email fails
    }

    // Create notification for HR users
    try {
      await supabaseAdmin.from("notifications").insert({
        hr_user_id: null, // null means broadcast to all HR users
        type: "new_application",
        title: "New Application Received",
        message: `${name} applied for ${job.title}`,
        link: `/admin/candidates/${application.id}`,
        application_id: application.id,
        job_id: jobId,
      });
      console.log("Notification created for new application");
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Don't fail the application if notification fails
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Application submitted successfully! We'll contact you via email.",
        application: {
          id: application.id,
          email: application.email,
          token: application.application_token,
          jobTitle: job.title,
          matchScore: matchScore,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/jobs/[id]/apply:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
