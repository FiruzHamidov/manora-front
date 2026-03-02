import {NextResponse} from 'next/server';

const BOT_TOKEN = process.env.TG_BOT_TOKEN!;
const CHAT_ID = process.env.TG_CHAT_ID!;
const THREAD_ID = process.env.TG_THREAD_ID ? Number(process.env.TG_THREAD_ID) : undefined;

// Эскейп для MarkdownV2
function esc(v: string) {
    return (v ?? '').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&').trim();
}

type Payload = {
    // базовые поля
    name?: string;
    phone?: string;
    requestType?: string;
    message?: string;
    title?: string;
    sourceId?: string;
    pageUrl?: string;

    // поля калькулятора
    bank?: string;                 // из модалки ты отправляешь "bank"
    propertyPrice?: string;        // строкой ок
    interestRate?: string;         // строкой ок
    loanTermYears?: string;        // строкой ок
    paymentType?: 'annuity' | 'differentiated';
    paymentFrequency?: 'monthly' | 'weekly';
    startDate?: string;
};

export async function POST(req: Request) {
    if (!BOT_TOKEN || !CHAT_ID) {
        return NextResponse.json({ok: false, error: 'Bot env not set'}, {status: 500});
    }

    let data: Payload;
    try {
        data = await req.json();
    } catch {
        return NextResponse.json({ok: false, error: 'Invalid JSON'}, {status: 400});
    }

    if (!data.phone) {
        return NextResponse.json({ok: false, error: 'phone is required'}, {status: 422});
    }

    const paymentTypeLabel =
        data.paymentType === 'differentiated' ? 'Дифференцированный' :
            data.paymentType === 'annuity' ? 'Аннуитетный' : undefined;

    const paymentFreqLabel =
        data.paymentFrequency === 'weekly' ? 'Еженедельно' :
            data.paymentFrequency === 'monthly' ? 'Ежемесячно' : undefined;

    const lines = [
        data.name && `*Имя:* ${esc(data.name)}`,
        data.phone && `*Телефон:* ${esc(data.phone)}`,
        data.requestType && `*Тип обращения:* ${esc(data.requestType)}`,
        data.bank && `*Банк:* ${esc(data.bank)}`,
        data.propertyPrice && `*Стоимость:* ${esc(`${data.propertyPrice} с`)}`, // без точки ИЛИ с точкой внутри esc()
        data.interestRate && `*Ставка:* ${esc(`${data.interestRate}%`)}`,
        data.loanTermYears && `*Срок:* ${esc(`${data.loanTermYears} г`)}`,       // без точки ИЛИ с точкой внутри esc()
        paymentTypeLabel && `*Погашение:* ${esc(paymentTypeLabel)}`,
        paymentFreqLabel && `*Периодичность:* ${esc(paymentFreqLabel)}`,
        data.startDate && `*Дата выдачи:* ${esc(data.startDate)}`,
        data.message && `*Комментарий:*\n${esc(data.message)}`,
        data.sourceId && `*Источник:* ${esc(data.sourceId)}`,
        data.pageUrl && `*Ссылка:* ${esc(data.pageUrl)}`,
        `*Дата:* ${esc(new Date().toLocaleString('ru-RU'))}`,
    ].filter(Boolean).join('\n');

    const text = `${data.title ? `*${esc(data.title)}*` : '*Новая заявка*'}\n\n${lines}`;

    const body: {
        chat_id: string;
        text: string;
        parse_mode: 'MarkdownV2';
        disable_web_page_preview: boolean;
        message_thread_id?: number;
    } = {
        chat_id: CHAT_ID,
        text,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
    };
    if (THREAD_ID) body.message_thread_id = THREAD_ID;

    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
            return NextResponse.json({ok: false, error: json?.description ?? 'TG error'}, {status: 502});
        }
        return NextResponse.json({ok: true});
    } catch (e: unknown) {
        let message = 'Network error';
        if (e instanceof Error) {
            message = e.message;
        }
        return NextResponse.json({ok: false, error: message}, {status: 500});
    }
}