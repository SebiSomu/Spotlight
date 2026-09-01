import { apiFetch } from "./client";

export interface Ticket {
    id: number;
    ticket_code: string;
    status: string;
    ticket_type_name: string;
    event_title: string;
    artist: string;
    genre?: string;
    event_image_url?: string;
    venue_name: string;
    formatted_date: string;
    formatted_time: string;
    price_dollars: number;
}

export interface Order {
    id: number;
    status: string;
    total_price: number;
    total_cents: number;
    payment_reference: string;
    payment_method: string;
    created_at: string;
    formatted_date: string;
    tickets: Ticket[];
}

export interface CreateOrderParams {
    hold_id: number;
    payment_method?: string;
    payment_token?: string;
}

export async function createOrderFromHoldApi(
    params: CreateOrderParams,
): Promise<{ order: Order }> {
    return apiFetch<{ order: Order }>("/orders", {
        method: "POST",
        body: JSON.stringify(params),
    });
}

export async function fetchOrdersApi(): Promise<{ orders: Order[] }> {
    return apiFetch<{ orders: Order[] }>("/orders", {
        method: "GET",
    });
}

export async function fetchOrderByIdApi(
    id: number,
): Promise<{ order: Order }> {
    return apiFetch<{ order: Order }>(`/orders/${id}`, {
        method: "GET",
    });
}
