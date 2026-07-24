import { NextResponse } from 'next/server';

const CHAT_API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? 'https://back.manora.tj/api'
).replace(/\/$/, '');

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Некорректный запрос' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${CHAT_API_BASE}/chat`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            payload?.message ||
            payload?.error?.message ||
            payload?.answer ||
            'Сервис временно недоступен',
        },
        { status: response.status >= 500 ? 502 : response.status }
      );
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: 'Не удалось связаться с сервисом подбора' },
      { status: 502 }
    );
  }
}
