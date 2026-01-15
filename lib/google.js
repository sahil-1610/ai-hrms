import { google } from "googleapis";

// Google OAuth2 client configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
);

// Scopes required for calendar and meet
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

/**
 * Generate Google OAuth URL for calendar access
 */
export function getGoogleAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Set credentials on the OAuth2 client
 */
export function setCredentials(tokens) {
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

/**
 * Create a Google Calendar event with Google Meet link
 */
export async function createCalendarEventWithMeet({
  accessToken,
  refreshToken,
  summary,
  description,
  startTime,
  endTime,
  attendees,
  timeZone = "America/New_York",
}) {
  // Set credentials
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = {
    summary,
    description,
    start: {
      dateTime: startTime,
      timeZone,
    },
    end: {
      dateTime: endTime,
      timeZone,
    },
    attendees: attendees.map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: `interview-${Date.now()}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 }, // 1 day before
        { method: "popup", minutes: 30 }, // 30 minutes before
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: "all",
  });

  return {
    eventId: response.data.id,
    htmlLink: response.data.htmlLink,
    meetLink: response.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    )?.uri,
    hangoutLink: response.data.hangoutLink,
    startTime: response.data.start.dateTime,
    endTime: response.data.end.dateTime,
  };
}

/**
 * Update a Google Calendar event
 */
export async function updateCalendarEvent({
  accessToken,
  refreshToken,
  eventId,
  updates,
}) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId,
    resource: updates,
    sendUpdates: "all",
  });

  return response.data;
}

/**
 * Delete a Google Calendar event
 */
export async function deleteCalendarEvent({
  accessToken,
  refreshToken,
  eventId,
}) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
  });

  return { success: true };
}

/**
 * List upcoming calendar events
 */
export async function listUpcomingEvents({
  accessToken,
  refreshToken,
  maxResults = 10,
}) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}

/**
 * Get available time slots for scheduling
 */
export async function getAvailableSlots({
  accessToken,
  refreshToken,
  startDate,
  endDate,
  durationMinutes = 60,
  workingHoursStart = 9,
  workingHoursEnd = 17,
  timeZone = "America/New_York",
}) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Get busy times
  const freeBusyResponse = await calendar.freebusy.query({
    resource: {
      timeMin: startDate,
      timeMax: endDate,
      timeZone,
      items: [{ id: "primary" }],
    },
  });

  const busySlots = freeBusyResponse.data.calendars.primary.busy || [];

  // Generate available slots
  const availableSlots = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (let hour = workingHoursStart; hour < workingHoursEnd; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      // Check if slot overlaps with any busy time
      const isAvailable = !busySlots.some((busy) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      if (isAvailable && slotStart > new Date()) {
        availableSlots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    }
  }

  return availableSlots;
}

export { oauth2Client };
