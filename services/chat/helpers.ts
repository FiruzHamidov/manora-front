import { v4 as uuidv4 } from "uuid";

const LS_KEY = "aura_chat_session_id";

export function getOrCreateSessionId(): string {
    if (typeof window === "undefined") return uuidv4();
    let sid = localStorage.getItem(LS_KEY);
    if (!sid) {
        sid = uuidv4();
        localStorage.setItem(LS_KEY, sid);
    }
    return sid;
}

export function persistSessionId(sessionId: string): void {
    if (typeof window === "undefined") return;
    if (!sessionId) return;
    localStorage.setItem(LS_KEY, sessionId);
}

export function createNewSessionId(): string {
    const sid = uuidv4();
    if (typeof window !== "undefined") {
        localStorage.setItem(LS_KEY, sid);
    }
    return sid;
}

export function fmtPrice(n?: number, currency?: string): string {
    if (n == null) return "";
    try {
        return (
            new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n) +
            (currency ? ` ${currency}` : "")
        );
    } catch {
        return `${n}${currency ? ` ${currency}` : ""}`;
    }
}
