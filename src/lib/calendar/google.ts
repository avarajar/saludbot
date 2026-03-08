import { google, calendar_v3 } from 'googleapis';
import { TZDate } from '@date-fns/tz';
import { addMinutes, setHours, setMinutes, isBefore, isAfter, isEqual } from 'date-fns';

const TIMEZONE = 'America/Bogota';
const BUSINESS_HOUR_START = 8;
const BUSINESS_HOUR_END = 18;

function getCalendarClient(): calendar_v3.Calendar {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // The private key comes from env as a string with escaped newlines
    key: (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

export interface EventData {
  summary: string;
  description: string;
  start: string; // ISO 8601
  end: string;   // ISO 8601
  attendeeEmail?: string;
}

/**
 * Returns available time slots for a given calendar, date, and appointment
 * duration. Slots are computed within business hours (08:00-18:00
 * America/Bogota) and exclude any busy periods already on the calendar.
 */
export async function getAvailableSlots(
  calendarId: string,
  date: string,
  durationMinutes: number,
): Promise<{ start: string; end: string }[]> {
  const calendar = getCalendarClient();

  // Build day boundaries in Bogota timezone
  const [year, month, day] = date.split('-').map(Number);
  const dayStart = TZDate.tz(TIMEZONE, year, month - 1, day, BUSINESS_HOUR_START, 0, 0);
  const dayEnd = TZDate.tz(TIMEZONE, year, month - 1, day, BUSINESS_HOUR_END, 0, 0);

  // Query Google Calendar for busy intervals
  const freeBusyResponse = await calendar.freebusy.query({
    requestBody: {
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      timeZone: TIMEZONE,
      items: [{ id: calendarId }],
    },
  });

  const busySlots =
    freeBusyResponse.data.calendars?.[calendarId]?.busy ?? [];

  // Convert busy slots to Date objects for comparison
  const busyIntervals = busySlots.map((slot) => ({
    start: new Date(slot.start!),
    end: new Date(slot.end!),
  }));

  // Generate available slots by walking through business hours
  const availableSlots: { start: string; end: string }[] = [];
  let cursor = new Date(dayStart.getTime());
  const endBoundary = new Date(dayEnd.getTime());

  while (true) {
    const slotEnd = addMinutes(cursor, durationMinutes);

    // Stop if the slot would exceed business hours
    if (isAfter(slotEnd, endBoundary)) {
      break;
    }

    // Check whether this slot overlaps any busy interval
    const overlaps = busyIntervals.some(
      (busy) => isBefore(cursor, busy.end) && isAfter(slotEnd, busy.start),
    );

    if (!overlaps) {
      availableSlots.push({
        start: new TZDate(cursor, TIMEZONE).toISOString(),
        end: new TZDate(slotEnd, TIMEZONE).toISOString(),
      });
    }

    // Advance cursor by the slot duration
    cursor = addMinutes(cursor, durationMinutes);
  }

  return availableSlots;
}

/**
 * Creates a calendar event and returns the Google event ID.
 */
export async function createEvent(
  calendarId: string,
  data: EventData,
): Promise<string> {
  const calendar = getCalendarClient();

  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: data.summary,
      description: data.description,
      start: {
        dateTime: data.start,
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: data.end,
        timeZone: TIMEZONE,
      },
      attendees: data.attendeeEmail
        ? [{ email: data.attendeeEmail }]
        : undefined,
    },
  });

  return response.data.id!;
}

/**
 * Updates an existing calendar event.
 */
export async function updateEvent(
  calendarId: string,
  eventId: string,
  data: Partial<EventData>,
): Promise<void> {
  const calendar = getCalendarClient();

  const requestBody: calendar_v3.Schema$Event = {};

  if (data.summary !== undefined) {
    requestBody.summary = data.summary;
  }
  if (data.description !== undefined) {
    requestBody.description = data.description;
  }
  if (data.start !== undefined) {
    requestBody.start = { dateTime: data.start, timeZone: TIMEZONE };
  }
  if (data.end !== undefined) {
    requestBody.end = { dateTime: data.end, timeZone: TIMEZONE };
  }
  if (data.attendeeEmail !== undefined) {
    requestBody.attendees = [{ email: data.attendeeEmail }];
  }

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody,
  });
}

/**
 * Deletes a calendar event.
 */
export async function deleteEvent(
  calendarId: string,
  eventId: string,
): Promise<void> {
  const calendar = getCalendarClient();

  await calendar.events.delete({
    calendarId,
    eventId,
  });
}

/**
 * Retrieves a calendar event by ID.
 */
export async function getEvent(
  calendarId: string,
  eventId: string,
): Promise<calendar_v3.Schema$Event> {
  const calendar = getCalendarClient();

  const response = await calendar.events.get({
    calendarId,
    eventId,
  });

  return response.data;
}
