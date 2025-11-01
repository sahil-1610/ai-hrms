/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} a - First vector
 * @param {number[]} b - Second vector
 * @returns {number} - Cosine similarity (-1 to 1)
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) {
    throw new Error("Invalid vectors for similarity calculation");
  }

  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (normA * normB);
}

/**
 * Calculate match score percentage from embeddings
 * @param {number[]} resumeEmbedding - Resume embedding vector
 * @param {number[]} jdEmbedding - Job description embedding vector
 * @returns {number} - Match score (0-100)
 */
export function calculateMatchScore(resumeEmbedding, jdEmbedding) {
  try {
    const similarity = cosineSimilarity(resumeEmbedding, jdEmbedding);
    // Convert from -1..1 to 0..100 scale
    // Since embeddings are typically positive similarity, we map 0..1 to 0..100
    const score = Math.max(0, Math.min(100, Math.round(similarity * 100)));
    return score;
  } catch (error) {
    console.error("Error calculating match score:", error);
    return 0;
  }
}

/**
 * Calculate overall candidate score
 * @param {number} matchScore - Resume match score (0-100)
 * @param {number} testScore - Test score (0-100)
 * @param {number} communicationScore - Communication score (0-100)
 * @returns {number} - Overall score (0-100)
 */
export function calculateOverallScore(
  matchScore = 0,
  testScore = 0,
  communicationScore = 0
) {
  const weights = {
    resume: 0.5, // 50%
    test: 0.3, // 30%
    communication: 0.2, // 20%
  };

  const overall =
    weights.resume * matchScore +
    weights.test * testScore +
    weights.communication * communicationScore;

  return Math.round(overall);
}

/**
 * Get score category based on score
 * @param {number} score - Score (0-100)
 * @returns {string} - Category
 */
export function getScoreCategory(score) {
  if (score >= 80) return "strong-fit";
  if (score >= 60) return "consider";
  if (score >= 40) return "low-fit";
  return "not-recommended";
}

/**
 * Get score color for UI
 * @param {number} score - Score (0-100)
 * @returns {string} - Tailwind color class
 */
export function getScoreColor(score) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

/**
 * Grade test by comparing answers
 * @param {Array} questions - Array of questions with correctIndex
 * @param {Array} answers - Array of selected answer indices
 * @returns {number} - Test score (0-100)
 */
export function gradeTest(questions, answers) {
  if (!questions || !answers || questions.length === 0) {
    return 0;
  }

  let correct = 0;

  questions.forEach((q, index) => {
    if (answers[index] === q.correctIndex) {
      correct++;
    }
  });

  return Math.round((correct / questions.length) * 100);
}
