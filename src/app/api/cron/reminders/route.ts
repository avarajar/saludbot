import { NextRequest, NextResponse } from 'next/server';
import { processReminders } from '@/lib/reminders/engine';

/**
 * GET /api/cron/reminders
 *
 * Cron endpoint that processes all pending appointment reminders.
 * Protected by CRON_SECRET to prevent unauthorized invocations.
 *
 * This route is intended to be triggered by Vercel Cron or an external
 * cron service (e.g., every 15 minutes).
 */
export async function GET(request: NextRequest) {
  // Authenticate the request using the CRON_SECRET header or query param
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 500 },
    );
  }

  const providedSecret =
    authHeader?.replace('Bearer ', '') ??
    request.nextUrl.searchParams.get('secret');

  if (providedSecret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  try {
    const summary = await processReminders();

    return NextResponse.json({
      ok: true,
      summary: {
        reminders_48h_sent: summary.sent48h,
        reminders_24h_sent: summary.sent24h,
        reminders_2h_sent: summary.sent2h,
        errors: summary.errors,
        total_sent: summary.sent48h + summary.sent24h + summary.sent2h,
      },
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron reminders error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
