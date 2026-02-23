import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramAlert } from '../../../lib/telegram';

/**
 * POST /api/telegram-notify
 * body: { message: string }
 * 서버에서만 TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID 사용 (보안)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message : '';
    if (!message) {
      return NextResponse.json({ ok: false, error: 'message required' }, { status: 400 });
    }
    const result = await sendTelegramAlert(message);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
