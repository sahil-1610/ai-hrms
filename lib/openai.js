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
 * Generate MCQ questions for a job with configurable difficulty
 * @param {Object} params - Job parameters
 * @returns {Promise<Array>} - Array of MCQ questions
 */
export async function generateMCQ({
  jobTitle,
  skills = [],
  experienceYears = 2,
  questionCount = 10,
  difficulty = "mixed", // easy, medium, hard, mixed
  difficultyDistribution = { easy: 30, medium: 50, hard: 20 },
}) {
  try {
    let difficultyInstructions = "";

    if (difficulty === "mixed") {
      const easyCount = Math.round((questionCount * difficultyDistribution.easy) / 100);
      const mediumCount = Math.round((questionCount * difficultyDistribution.medium) / 100);
      const hardCount = questionCount - easyCount - mediumCount;

      difficultyInstructions = `
Create a mix of difficulties:
- ${easyCount} EASY questions (basic concepts, straightforward)
- ${mediumCount} MEDIUM questions (applied knowledge, some complexity)
- ${hardCount} HARD questions (advanced concepts, problem-solving)

Mark each question with its difficulty level.`;
    } else {
      const difficultyDescriptions = {
        easy: "basic concepts that a beginner should know, straightforward questions",
        medium: "applied knowledge requiring practical experience, moderate complexity",
        hard: "advanced concepts, complex problem-solving, edge cases, and deep understanding"
      };
      difficultyInstructions = `All questions should be ${difficulty.toUpperCase()} difficulty: ${difficultyDescriptions[difficulty]}`;
    }

    const prompt = `Generate ${questionCount} multiple-choice technical questions as a JSON object with a "questions" array.

Each question should have:
{
  "q": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0-3,
  "difficulty": "easy" | "medium" | "hard",
  "category": "category name based on skill"
}

Job: ${jobTitle}
Required Skills: ${skills.join(", ")}
Experience Level: ${experienceYears} years

${difficultyInstructions}

Ensure questions:
- Are relevant to the job and skills
- Have clear, unambiguous correct answers
- Include realistic distractors (wrong options)
- Cover different aspects of the required skills
- Are appropriate for ${experienceYears} years of experience

Return only valid JSON object with "questions" array. No markdown.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a technical interview question generator. Create relevant, fair, and well-structured MCQ questions with varying difficulty levels.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
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
 * @param {Buffer|Blob|File} audioFile - Audio file or buffer
 * @param {string} fileName - Optional filename for the audio
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeAudio(audioFile, fileName = "audio.webm") {
  try {
    let file;

    // Handle different input types
    if (Buffer.isBuffer(audioFile)) {
      // Convert Buffer to File object
      file = new File([audioFile], fileName, { type: "audio/webm" });
    } else if (audioFile instanceof Blob) {
      // Convert Blob to File object
      const arrayBuffer = await audioFile.arrayBuffer();
      file = new File([arrayBuffer], fileName, { type: audioFile.type || "audio/webm" });
    } else {
      // Assume it's already a File
      file = audioFile;
    }

    const response = await openai.audio.transcriptions.create({
      file: file,
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
