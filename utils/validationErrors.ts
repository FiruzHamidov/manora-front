import { AxiosError } from "axios";

type BackendErrors = Record<string, string[]>;

const fieldLabels: Record<string, string> = {
    youtube_link: "Ссылка на YouTube",
    year: "Год выпуска",
    year_built: "Год постройки",
    title: "Заголовок",
    price: "Цена",
    // добавляй свои поля тут…
};

function humanizeField(enField: string) {
    return fieldLabels[enField] ?? enField;
}

// очень простые шаблоны перевода типовых сообщений Laravel
function translateMessage(en: string) {
    // Примеры:
    // "The youtube link field must be a valid URL."
    // "The year field must be a valid year."
    // "The title field is required."
    const url = en.match(/^The (.+) field must be a valid URL\.$/i);
    if (url) return `Поле «${humanizeField(url[1])}» должно быть корректным URL.`;

    const year = en.match(/^The (.+) field must be a valid year\.$/i);
    if (year) return `Поле «${humanizeField(year[1])}» должно содержать корректный год.`;

    const required = en.match(/^The (.+) field is required\.$/i);
    if (required) return `Поле «${humanizeField(required[1])}» обязательно для заполнения.`;

    const stringRule = en.match(/^The (.+) field must be a string\.$/i);
    if (stringRule) return `Поле «${humanizeField(stringRule[1])}» должно быть строкой.`;

    const numericRule = en.match(/^The (.+) field must be a number\.$/i);
    if (numericRule) return `Поле «${humanizeField(numericRule[1])}» должно быть числом.`;

    // fallback — просто замена англ. названия поля на русское
    let out = en;
    Object.entries(fieldLabels).forEach(([key, ru]) => {
        out = out.replaceAll(new RegExp(`\\b${key.replace('_', ' ')}\\b`, "gi"), ru);
    });
    return out;
}

export function extractValidationMessages(err: unknown): string[] | null {
    const ax = err as AxiosError<any>;
    const status = ax?.response?.status;
    const data = ax?.response?.data;

    if (status !== 422 || !data) return null;

    const list: string[] = [];

    // data.errors: { field: ["msg1","msg2"] }
    const errors: BackendErrors | undefined = data.errors;
    if (errors && typeof errors === "object") {
        Object.entries(errors).forEach(([field, msgs]) => {
            (msgs ?? []).forEach((m) => list.push(translateMessage(String(m))));
        });
    }

    // иногда у Laravel ещё есть верхнеуровневое "message"
    if (data.message && (!errors || list.length === 0)) {
        list.push(translateMessage(String(data.message)));
    }

    return list.length ? list : null;
}