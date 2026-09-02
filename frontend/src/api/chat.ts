import { apiFetch } from "./client";

export interface ChatMessageItem {
    role: "user" | "assistant";
    content: string;
}

export interface ChatResponse {
    reply: string;
    sources?: string[];
    error?: string;
}

export async function sendChatMessage(
    message: string,
    history: ChatMessageItem[] = []
): Promise<ChatResponse> {
    return apiFetch<ChatResponse>("/chat", {
        method: "POST",
        body: JSON.stringify({ message, history }),
    });
}
