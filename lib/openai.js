import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embeddings for text using OpenAI's text-embedding-3-large model
 * @param {string} text - The text to generate embeddings for
 * @returns {Promise<number[]>} - The embedding vector
 */
export async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

/**
 * Generate a job description using OpenAI
 * @param {Object} jobDetails - Job details
 * @returns {Promise<string>} - Generated job description
 */
export async function generateJobDescription({
  title,
  skills = [],
  minExp = 0,
  maxExp = 5,
  companyType = "growing tech company",
}) {
  try {
    const prompt = `You are an HR copywriter. Generate a professional job description for:

Title: ${title}
Seniority: ${minExp}-${maxExp} years
Key skills: ${skills.join(", ")}
Company type: ${companyType}

Return a well-structured job description with:
- Short role summary (2–3 sentences)
- Responsibilities (bullet list)
- Required qualifications (bullet list)
- Nice to have qualifications (bullet list)

Format it in clean, professional language.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert HR copywriter who creates compelling job descriptions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating job description:", error);
    throw new Error("Failed to generate job description");
  }
}

/**
 * Parse resume text into structured JSON
 * @param {string} resumeText - The extracted resume text
 * @returns {Promise<Object>} - Parsed resume data
 */
export async function parseResume(resumeText) {
  try {
    const prompt = `Extract structured JSON from the resume text below. Return only valid JSON with these keys:
- name (string)
- email (string)
- phone (string)
- skills (array of strings)
- education (array of {institution, degree, startYear, endYear})
- experience (array of {company, title, startYear, endYear, bullets: array of strings})

Resume text:
${resumeText}

Return strictly valid JSON. No markdown, no extra text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a resume parsing assistant. Extract information accurately and return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed;
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw new Error("Failed to parse resume");
  }
}

/**
 * Generate MCQ questions for a job
 * @param {Object} params - Job parameters
 * @returns {Promise<Array>} - Array of MCQ questions
 */
export async function generateMCQ({
  jobTitle,
  skills = [],
  experienceYears = 2,
}) {
  try {
    const prompt = `Generate 7 multiple-choice technical questions (JSON array). Each item should have: {q: string, options: array of 4 strings, correctIndex: number (0-3)}. 
    
Topic: ${jobTitle} requiring ${skills.join(", ")}. 
Keep medium difficulty for a candidate with ${experienceYears} years of experience.

Return only valid JSON array. No markdown, no extra text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a technical interview question generator. Create relevant, fair questions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.questions || result;
  } catch (error) {
    console.error("Error generating MCQ:", error);
    throw new Error("Failed to generate MCQ questions");
  }
}

/**
 * Transcribe audio using OpenAI Whisper
 * @param {File|Blob} audioFile - Audio file
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeAudio(audioFile) {
  try {
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    return response.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio");
  }
}

/**
 * Evaluate interview transcript
 * @param {string} transcript - Interview transcript
 * @param {string} question - Interview question
 * @returns {Promise<Object>} - Evaluation results
 */
export async function evaluateTranscript(
  transcript,
  question = "Tell me about yourself"
) {
  try {
    const prompt = `You are an interviewer. Evaluate the candidate's answer below for correctness, structure, and communication. 

Question: ${question}
Answer: ${transcript}

Return JSON with: {score: number (0-100), strengths: array of strings, weaknesses: array of strings, feedback: string}

Return only valid JSON. No markdown, no extra text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert interviewer evaluating candidate responses.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error evaluating transcript:", error);
    throw new Error("Failed to evaluate transcript");
  }
}

/**
 * Intelligently match resume against job description using AI
 * Analyzes skills, experience, qualifications and provides detailed scoring
 * @param {string} resumeText - Extracted text from candidate's resume
 * @param {string} jobDescription - Job description text
 * @param {Object} jobDetails - Additional job details (title, required skills, experience range)
 * @returns {Promise<Object>} - Match analysis with score and detailed breakdown
 */
export async function matchResumeToJob(resumeText, jobDescription, jobDetails) {
  try {
    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze how well this candidate's resume matches the job requirements.

JOB DETAILS:
Title: ${jobDetails.title || "Not specified"}
Required Experience: ${jobDetails.minExp || 0}-${jobDetails.maxExp || 5} years
Key Skills Required: ${jobDetails.skills?.join(", ") || "Not specified"}
Location: ${jobDetails.location || "Not specified"}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME:
${resumeText}

Analyze the match and return JSON with:
{
  "matchScore": number (0-100, where 100 is perfect match),
  "skillsMatch": {
    "matched": array of skills from resume that match job requirements,
    "missing": array of required skills not found in resume,
    "additional": array of relevant skills candidate has beyond requirements
  },
  "experienceMatch": {
    "candidateYears": number or null,
    "meetsRequirement": boolean,
    "analysis": string
  },
  "strengths": array of strings (top 3-5 reasons this is a good match),
  "concerns": array of strings (top 3-5 potential gaps or concerns),
  "recommendation": string ("Strong Match" | "Good Match" | "Moderate Match" | "Weak Match" | "Poor Match"),
  "summary": string (2-3 sentence overall assessment)
}

Be thorough but fair. Consider:
- Technical skills alignment
- Years of experience
- Education background
- Industry experience
- Project relevance
- Cultural fit indicators

Return only valid JSON. No markdown, no extra text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert ATS analyzer and HR professional. Provide accurate, fair, and detailed candidate-job matching analysis.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent scoring
      max_tokens: 2500,
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    // Ensure matchScore is within valid range
    if (analysis.matchScore < 0) analysis.matchScore = 0;
    if (analysis.matchScore > 100) analysis.matchScore = 100;

    return analysis;
  } catch (error) {
    console.error("Error matching resume to job:", error);
    throw new Error("Failed to analyze resume-job match");
  }
}

export default openai;
