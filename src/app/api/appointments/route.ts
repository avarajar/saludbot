import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TZDate } from '@date-fns/tz';
import { format, addMinutes } from 'date-fns';
import { supabaseAdmin as getSupabase } from '@/lib/db/supabase';
import { createEvent } from '@/lib/calendar/google';
import type { Clinic, Patient } from '@/types';

const TIMEZONE = 'America/Bogota';

// ── GET /api/appointments ──────────────────────────────────────────────────

/**
 * Lists appointments for a clinic, optionally filtered by date and status.
 *
 * Query params:
 *  - clinic_id (required)
 *  - date      (optional, YYYY-MM-DD)
 *  - status    (optional, appointment status)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const clinicId = searchParams.get('clinic_id');
  const date = searchParams.get('date');
  const status = searchParams.get('status');

  if (!clinicId) {
    return NextResponse.json(
      { error: 'clinic_id is required' },
      { status: 400 },
    );
  }

  const supabase = getSupabase();

  let query = supabase
    .from('appointments')
    .select('*, patients(name, phone)')
    .eq('clinic_id', clinicId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (date) {
    query = query.eq('date', date);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ appointments: data });
}

// ── POST /api/appointments ─────────────────────────────────────────────────

const createAppointmentSchema = z.object({
  clinic_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'start_time must be HH:MM'),
  duration_minutes: z.number().int().min(10).max(480),
  service: z.string().min(1),
  notes: z.string().optional(),
});

/**
 * Creates a new appointment.
 *
 * 1. Validates the request body
 * 2. Fetches the clinic and patient records
 * 3. Creates a Google Calendar event
 * 4. Persists the appointment in Supabase
 * 5. Sends a WhatsApp confirmation to the patient
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    clinic_id,
    patient_id,
    date,
    start_time,
    duration_minutes,
    service,
    notes,
  } = parsed.data;

  const supabase = getSupabase();

  // Fetch clinic and patient in parallel
  const [{ data: clinic, error: clinicError }, { data: patient, error: patientError }] =
    await Promise.all([
      supabase.from('clinics').select('*').eq('id', clinic_id).single(),
      supabase.from('patients').select('*').eq('id', patient_id).single(),
    ]);

  if (clinicError || !clinic) {
    return NextResponse.json(
      { error: 'Clinic not found' },
      { status: 404 },
    );
  }

  if (patientError || !patient) {
    return NextResponse.json(
      { error: 'Patient not found' },
      { status: 404 },
    );
  }

  const typedClinic = clinic as Clinic;
  const typedPatient = patient as Patient;

  // Calculate start and end ISO strings in Bogota timezone
  const [hours, minutes] = start_time.split(':').map(Number);
  const [year, month, day] = date.split('-').map(Number);

  const startDate = TZDate.tz(TIMEZONE, year, month - 1, day, hours, minutes, 0);
  const endDate = addMinutes(startDate, duration_minutes);
  const endTime = format(new TZDate(endDate, TIMEZONE), 'HH:mm');

  // Create Google Calendar event
  let googleEventId: string | null = null;
  try {
    googleEventId = await createEvent(typedClinic.google_calendar_id, {
      summary: `${service} - ${typedPatient.name}`,
      description: [
        `Paciente: ${typedPatient.name}`,
        `Teléfono: ${typedPatient.phone}`,
        `Servicio: ${service}`,
        notes ? `Notas: ${notes}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      start: startDate.toISOString(),
      end: new TZDate(endDate, TIMEZONE).toISOString(),
      attendeeEmail: typedPatient.email ?? undefined,
    });
  } catch (err) {
    console.error('Google Calendar event creation failed:', err);
    // Continue without the calendar event — we still save the appointment
  }

  // Save appointment in Supabase
  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      clinic_id,
      patient_id,
      google_event_id: googleEventId,
      date,
      start_time,
      end_time: endTime,
      service,
      status: 'scheduled',
      reminder_48h_sent: false,
      reminder_24h_sent: false,
      reminder_2h_sent: false,
      patient_confirmed: false,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: `Failed to create appointment: ${insertError.message}` },
      { status: 500 },
    );
  }

  // Send WhatsApp confirmation message
  try {
    const twilio = await import('twilio');
    const twilioClient = twilio.default(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
    );

    const formattedDate = format(startDate, "EEEE d 'de' MMMM", {
      locale: (await import('date-fns/locale')).es,
    });
    const formattedTime = format(startDate, 'h:mm a', {
      locale: (await import('date-fns/locale')).es,
    });

    const confirmationMessage =
      `¡Hola ${typedPatient.name}! Su cita ha sido agendada en ${typedClinic.name} ` +
      `para el ${formattedDate} a las ${formattedTime}. ` +
      `Servicio: ${service}. ` +
      `Le enviaremos un recordatorio antes de su cita.`;

    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER!}`,
      to: `whatsapp:${typedPatient.phone}`,
      body: confirmationMessage,
    });
  } catch (err) {
    console.error('WhatsApp confirmation message failed:', err);
    // Non-critical: the appointment is already saved
  }

  return NextResponse.json({ appointment }, { status: 201 });
}
