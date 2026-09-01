import { apiFetch } from "./client";

export interface Hold {
    id: number;
    ticket_type_id: number;
    ticket_type_name: string;
    quantity: number;
    status: string;
    expires_at: string;
    seconds_remaining: number;
    total_cents: number;
    total_price: number;
}

export async function createHoldApi(params: {
    ticket_type_id: number;
    quantity: number;
}): Promise<{ hold: Hold }> {
    return apiFetch<{ hold: Hold }>("/holds", {
        method: "POST",
        body: JSON.stringify(params),
    });
}

export async function fetchHoldApi(id: number): Promise<{ hold: Hold }> {
    return apiFetch<{ hold: Hold }>(`/holds/${id}`, {
        method: "GET",
    });
}

export async function releaseHoldApi(id: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/holds/${id}`, {
        method: "DELETE",
    });
}
