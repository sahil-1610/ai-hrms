/**
 * Fathom AI Integration
 *
 * Fathom is an AI meeting assistant that records, transcribes, and summarizes meetings.
 * This integration allows HRMS to receive interview recordings and transcripts from Fathom.
 *
 * How it works:
 * 1. HR connects their Fathom account in settings
 * 2. When interviews are conducted via Google Meet with Fathom bot, recordings are captured
 * 3. Fathom sends webhook notifications when recordings are ready
 * 4. HRMS fetches the transcript and summary from Fathom API
 * 5. AI analyzes the interview and updates candidate scores
 */

const FATHOM_API_BASE = "https://api.fathom.video/v1";

/**
 * Get recordings from Fathom API
 */
export async function getFathomRecordings(apiKey, options = {}) {
  const { limit = 50, cursor, meetingUrl } = options;

  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) params.append("cursor", cursor);
  if (meetingUrl) params.append("meeting_url", meetingUrl);

  const response = await fetch(`${FATHOM_API_BASE}/recordings?${params}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fathom API error: ${error}`);
  }

  return response.json();
}

/**
 * Get a specific recording from Fathom
 */
export async function getFathomRecording(apiKey, recordingId) {
  const response = await fetch(
    `${FATHOM_API_BASE}/recordings/${recordingId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fathom API error: ${error}`);
  }

  return response.json();
}

/**
 * Get transcript for a recording
 */
export async function getFathomTranscript(apiKey, recordingId) {
  const response = await fetch(
    `${FATHOM_API_BASE}/recordings/${recordingId}/transcript`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fathom API error: ${error}`);
  }

  return response.json();
}

/**
 * Get summary for a recording
 */
export async function getFathomSummary(apiKey, recordingId) {
  const response = await fetch(
    `${FATHOM_API_BASE}/recordings/${recordingId}/summary`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fathom API error: ${error}`);
  }

  return response.json();
}

/**
 * Match a Fathom recording to a scheduled interview
 * by comparing meeting URLs or calendar event IDs
 */
export function matchRecordingToInterview(recording, interviews) {
  // Try to match by meeting URL
  const meetingUrl = recording.meeting_url || recording.meetingUrl;
  if (meetingUrl) {
    const match = interviews.find(
      (interview) =>
        interview.google_meet_link &&
        (meetingUrl.includes(interview.google_meet_link) ||
          interview.google_meet_link.includes(meetingUrl))
    );
    if (match) return match;
  }

  // Try to match by calendar event ID
  const calendarEventId =
    recording.calendar_event_id || recording.calendarEventId;
  if (calendarEventId) {
    const match = interviews.find(
      (interview) => interview.google_event_id === calendarEventId
    );
    if (match) return match;
  }

  // Try to match by time (within 30 minutes of scheduled time)
  const recordingTime = new Date(
    recording.created_at || recording.started_at
  ).getTime();
  const thirtyMinutes = 30 * 60 * 1000;

  const match = interviews.find((interview) => {
    const scheduledTime = new Date(interview.scheduled_at).getTime();
    return Math.abs(recordingTime - scheduledTime) < thirtyMinutes;
  });

  return match || null;
}

/**
 * Format Fathom transcript for display
 */
export function formatTranscript(transcript) {
  if (!transcript || !transcript.segments) {
    return transcript?.text || transcript || "";
  }

  return transcript.segments
    .map((segment) => {
      const speaker = segment.speaker || "Speaker";
      const text = segment.text || segment.content || "";
      const timestamp = segment.start_time
        ? formatTime(segment.start_time)
        : "";
      return `[${timestamp}] ${speaker}: ${text}`;
    })
    .join("\n\n");
}

/**
 * Format time in seconds to MM:SS
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Validate Fathom webhook signature
 */
export function validateFathomWebhook(payload, signature, secret) {
  if (!signature || !secret) return false;

  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export default {
  getFathomRecordings,
  getFathomRecording,
  getFathomTranscript,
  getFathomSummary,
  matchRecordingToInterview,
  formatTranscript,
  validateFathomWebhook,
};
