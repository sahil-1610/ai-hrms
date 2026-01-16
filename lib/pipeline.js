import { supabaseAdmin } from "@/lib/supabase";

// Stage order definition
export const STAGE_ORDER = [
  "resume_screening",
  "mcq_test",
  "async_interview",
  "live_interview",
  "offer",
  "hired",
  "rejected",
];

// Map stage to application status
export const STAGE_STATUS_MAP = {
  resume_screening: "screening",
  mcq_test: "testing",
  async_interview: "interviewing",
  live_interview: "interviewing",
  offer: "offered",
  hired: "hired",
  rejected: "rejected",
};

// Default pipeline configuration
export const DEFAULT_PIPELINE_CONFIG = {
  stages: {
    resume_screening: { enabled: true, auto_advance_threshold: 60 },
    mcq_test: { enabled: true, auto_advance_threshold: 60 },
    async_interview: { enabled: true, auto_advance_threshold: 50 },
    live_interview: { enabled: true },
    offer: { enabled: true },
  },
  scoring_weights: {
    resume: 0.4,
    mcq: 0.3,
    async_interview: 0.2,
    live_interview: 0.1,
  },
};

/**
 * Check if a candidate should auto-advance based on their score
 * @param {string} applicationId - The application ID
 * @param {string} currentStage - The current stage being completed
 * @param {number} score - The score achieved in the current stage (0-100)
 * @returns {Promise<{advanced: boolean, newStage: string | null, message: string}>}
 */
export async function checkAndAutoAdvance(applicationId, currentStage, score) {
  try {
    // Fetch application with job's pipeline configuration
    const { data: application, error } = await supabaseAdmin
      .from("applications")
      .select("*, jobs(pipeline_config)")
      .eq("id", applicationId)
      .single();

    if (error || !application) {
      console.error("Error fetching application:", error);
      return { advanced: false, newStage: null, message: "Application not found" };
    }

    const pipelineConfig = application.jobs?.pipeline_config || DEFAULT_PIPELINE_CONFIG;
    const stageConfig = pipelineConfig.stages?.[currentStage];

    // Check if auto-advance threshold is set and score meets it
    if (!stageConfig?.auto_advance_threshold) {
      return {
        advanced: false,
        newStage: null,
        message: "Auto-advance not configured for this stage",
      };
    }

    if (score < stageConfig.auto_advance_threshold) {
      return {
        advanced: false,
        newStage: null,
        message: `Score ${score}% below threshold ${stageConfig.auto_advance_threshold}%`,
      };
    }

    // Find next enabled stage
    const currentIndex = STAGE_ORDER.indexOf(currentStage);
    let nextStage = null;

    for (let i = currentIndex + 1; i < STAGE_ORDER.length; i++) {
      const stage = STAGE_ORDER[i];
      if (stage === "hired" || stage === "rejected") {
        break; // Don't auto-advance to terminal states
      }
      if (pipelineConfig.stages?.[stage]?.enabled !== false) {
        nextStage = stage;
        break;
      }
    }

    if (!nextStage) {
      return {
        advanced: false,
        newStage: null,
        message: "No next stage available",
      };
    }

    // Update stage history
    const stageHistory = application.stage_history || [];
    stageHistory.push({
      from: currentStage,
      to: nextStage,
      score,
      auto_advanced: true,
      timestamp: new Date().toISOString(),
    });

    // Advance the candidate
    const { error: updateError } = await supabaseAdmin
      .from("applications")
      .update({
        current_stage: nextStage,
        stage_history: stageHistory,
        status: STAGE_STATUS_MAP[nextStage] || "screening",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateError) {
      console.error("Error auto-advancing application:", updateError);
      return {
        advanced: false,
        newStage: null,
        message: "Failed to update application",
      };
    }

    console.log(
      `Auto-advanced application ${applicationId} from ${currentStage} to ${nextStage} (score: ${score}%)`
    );

    return {
      advanced: true,
      newStage: nextStage,
      message: `Auto-advanced to ${nextStage} based on score ${score}%`,
    };
  } catch (error) {
    console.error("Error in checkAndAutoAdvance:", error);
    return {
      advanced: false,
      newStage: null,
      message: "Error checking auto-advance",
    };
  }
}

/**
 * Calculate overall candidate score based on pipeline weights
 * @param {Object} application - The application with scores
 * @param {Object} pipelineConfig - The pipeline configuration
 * @returns {number} The weighted overall score (0-100)
 */
export function calculateOverallScore(application, pipelineConfig) {
  const weights = pipelineConfig?.scoring_weights || DEFAULT_PIPELINE_CONFIG.scoring_weights;

  let totalScore = 0;
  let totalWeight = 0;

  // Resume score
  if (application.resume_match_score !== null && weights.resume) {
    totalScore += (application.resume_match_score || 0) * weights.resume;
    totalWeight += weights.resume;
  }

  // MCQ score
  if (application.mcq_score !== null && weights.mcq) {
    totalScore += (application.mcq_score || 0) * weights.mcq;
    totalWeight += weights.mcq;
  }

  // Async interview score
  if (application.interview_score !== null && weights.async_interview) {
    totalScore += (application.interview_score || 0) * weights.async_interview;
    totalWeight += weights.async_interview;
  }

  // Live interview score
  if (application.live_interview_score !== null && weights.live_interview) {
    totalScore += (application.live_interview_score || 0) * weights.live_interview;
    totalWeight += weights.live_interview;
  }

  // Normalize if not all weights are used
  if (totalWeight > 0) {
    return Math.round(totalScore / totalWeight);
  }

  return 0;
}

/**
 * Get the next available stage in the pipeline
 * @param {string} currentStage - The current stage
 * @param {Object} pipelineConfig - The pipeline configuration
 * @returns {string | null} The next stage or null
 */
export function getNextStage(currentStage, pipelineConfig) {
  const config = pipelineConfig || DEFAULT_PIPELINE_CONFIG;
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  for (let i = currentIndex + 1; i < STAGE_ORDER.length; i++) {
    const stage = STAGE_ORDER[i];
    if (stage === "hired" || stage === "rejected") {
      return stage;
    }
    if (config.stages?.[stage]?.enabled !== false) {
      return stage;
    }
  }

  return null;
}

/**
 * Get a human-readable stage label
 * @param {string} stage - The stage key
 * @returns {string} Human-readable stage name
 */
export function getStageLabel(stage) {
  const labels = {
    resume_screening: "Resume Screening",
    mcq_test: "MCQ Test",
    async_interview: "Async Interview",
    live_interview: "Live Interview",
    offer: "Offer",
    hired: "Hired",
    rejected: "Rejected",
  };
  return labels[stage] || stage;
}
