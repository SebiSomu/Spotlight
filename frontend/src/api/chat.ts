import { apiFetch } from "./client";

export interface ChatMessageItem {
    role: "user" | "assistant";
    content: string;
}

export interface ChatResponse {
    reply: string;
    sources?: string[];
    error?: string;
    needs_browser_geolocation?: boolean;
    resolved_location?: string | null;
}

export async function sendChatMessage(
    message: string,
    history: ChatMessageItem[] = [],
    opts?: { user_latitude?: number | null; user_longitude?: number | null }
): Promise<ChatResponse> {
    const body: Record<string, unknown> = { message, history };
    if (opts && typeof opts.user_latitude === "number" && typeof opts.user_longitude === "number") {
        body.user_latitude = opts.user_latitude;
        body.user_longitude = opts.user_longitude;
    }
    return apiFetch<ChatResponse>("/chat", {
        method: "POST",
        body: JSON.stringify(body),
    });
}
