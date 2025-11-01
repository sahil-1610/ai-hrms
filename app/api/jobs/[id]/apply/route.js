import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding, matchResumeToJob } from "@/lib/openai";
import { calculateMatchScore } from "@/utils/scoring";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { extractResumeText } from "@/lib/resumeParser";
import { sendEmail } from "@/lib/email";
import { applicationSubmittedTemplate } from "@/lib/emailTemplates";

// POST /api/jobs/[id]/apply - Submit job application (NO AUTH REQUIRED)
// Candidates don't need accounts - they submit with their info
export async function POST(request, { params }) {
  try {
    const { id: jobId } = await params;

    // Check if job exists and is active
    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("*")
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

    // Extract resume text for embedding and AI analysis
    const bytes = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload resume to Cloudinary
    let resumeUrl;
    try {
      const uploadResult = await uploadToCloudinary(
        buffer,
        resumeFile.name,
        "hrms/resumes"
      );
      resumeUrl = uploadResult.url;
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

    // Extract text from PDF/DOCX
    let resumeText;
    try {
      resumeText = await extractResumeText(buffer, resumeFile.type);
    } catch (extractError) {
      console.error("Error extracting text from resume:", extractError);
      // Fall back to basic info if text extraction fails
      resumeText = `
        Candidate: ${name}
        Email: ${email}
        Phone: ${phone}
        Current Company: ${currentCompany || "N/A"}
        Experience: ${experience || "N/A"} years
        Skills: ${skills || "N/A"}
        Education: ${education || "N/A"}
        Cover Letter: ${coverLetter || "N/A"}
      `.trim();
    }

    // Generate resume embedding for vector search
    const resumeEmbedding = await generateEmbedding(resumeText);

    // Calculate cosine similarity match score (0-100)
    const cosineSimilarityScore = job.jd_embedding
      ? calculateMatchScore(resumeEmbedding, job.jd_embedding)
      : 0;

    // Use AI to intelligently match resume against job description
    let aiMatchAnalysis;
    let finalMatchScore = cosineSimilarityScore; // Default to cosine similarity

    try {
      aiMatchAnalysis = await matchResumeToJob(resumeText, job.description, {
        title: job.title,
        skills: job.required_skills || [],
        minExp: job.min_experience || 0,
        maxExp: job.max_experience || 5,
        location: job.location,
      });

      // Use AI match score as primary score (more intelligent than just embeddings)
      finalMatchScore = aiMatchAnalysis.matchScore;

      console.log("AI Match Analysis:", {
        aiScore: aiMatchAnalysis.matchScore,
        cosineScore: cosineSimilarityScore,
        recommendation: aiMatchAnalysis.recommendation,
      });
    } catch (aiError) {
      console.error(
        "AI matching failed, falling back to embedding score:",
        aiError
      );
      // If AI matching fails, use cosine similarity score
      aiMatchAnalysis = null;
    }

    // Parse skills array
    const skillsArray = skills
      ? skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    // Create application with auto-generated application_token
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
        resume_text: resumeText,
        resume_embedding: resumeEmbedding,
        resume_match_score: finalMatchScore, // AI-enhanced match score
        overall_score: finalMatchScore, // Initial score is just resume match
        status: "submitted",
        // Store AI analysis if available
        ai_match_data: aiMatchAnalysis
          ? JSON.stringify({
              recommendation: aiMatchAnalysis.recommendation,
              strengths: aiMatchAnalysis.strengths,
              concerns: aiMatchAnalysis.concerns,
              skillsMatch: aiMatchAnalysis.skillsMatch,
              experienceMatch: aiMatchAnalysis.experienceMatch,
              summary: aiMatchAnalysis.summary,
              aiScore: aiMatchAnalysis.matchScore,
              cosineScore: cosineSimilarityScore,
            })
          : null,
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

    return NextResponse.json(
      {
        success: true,
        message:
          "Application submitted successfully! We'll contact you via email.",
        application: {
          id: application.id,
          matchScore: finalMatchScore,
          aiAnalysis: aiMatchAnalysis
            ? {
                recommendation: aiMatchAnalysis.recommendation,
                strengths: aiMatchAnalysis.strengths.slice(0, 3), // Top 3 strengths
                concerns: aiMatchAnalysis.concerns.slice(0, 2), // Top 2 concerns
              }
            : null,
          email: application.email,
          token: application.application_token,
          jobTitle: job.title,
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
