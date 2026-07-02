import { NextRequest, NextResponse } from 'next/server';
import { processFollowups } from '@/lib/reminders/followups';

/**
 * GET /api/cron/followups
 *
 * Cron endpoint that sends post-visit thank-you messages for appointments
 * completed the previous day, and periodic recall reminders for services
 * configured with `follow_up_days`. Protected by CRON_SECRET, same auth
 * pattern as /api/cron/reminders.
 *
 * This route is intended to be triggered once a day by Vercel Cron or an
 * external cron service.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }

  const providedSecret =
    authHeader?.replace('Bearer ', '') ??
    request.nextUrl.searchParams.get('secret');

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await processFollowups();
    return NextResponse.json({
      ok: true,
      summary: {
        post_visit_sent: summary.postVisitSent,
        recall_sent: summary.recallSent,
        errors: summary.errors,
      },
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron followups error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
