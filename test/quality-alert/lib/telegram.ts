/**
 * 텔레그램 봇 API로 알림 발송
 * 환경 변수: NEXT_PUBLIC_TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_TELEGRAM_CHAT_ID
 */

const getTelegramConfig = () => ({
  botToken: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? '',
  chatId: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID ?? '',
});

export async function sendTelegramAlert(message: string): Promise<{ ok: boolean; error?: string }> {
  const { botToken, chatId } = getTelegramConfig();
  if (!botToken || !chatId) {
    console.warn('Telegram: BOT_TOKEN 또는 CHAT_ID가 설정되지 않았습니다.');
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set' };
  }
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.description ?? 'Unknown error' };
    }
    return { ok: true };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { ok: false, error: err };
  }
}

/** 설비 제어 승인 시 호출하는 메시지 */
export function getApprovalTelegramMessage(lineLabel: string = '라인 A'): string {
  return `${lineLabel} 습도 제어 승인됨 - 정상화 진행 중`;
}
