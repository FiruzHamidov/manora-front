import { NextRequest, NextResponse } from 'next/server';

const CHAT_API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? 'https://back.manora.tj/api'
).replace(/\/$/, '');

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'session_id is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${CHAT_API_BASE}/chat/history?session_id=${encodeURIComponent(sessionId)}`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      }
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            payload?.message ||
            payload?.error ||
            'История чата временно недоступна',
        },
        { status: response.status >= 500 ? 502 : response.status }
      );
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: 'Не удалось загрузить историю чата' },
      { status: 502 }
    );
  }
}
