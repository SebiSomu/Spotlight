import { apiFetch } from "./client";

export interface Venue {
    id: number;
    name: string;
    address: string | null;
    city: string;
    state: string | null;
    location: string;
    capacity: number | null;
    image_url: string | null;
}

export interface EventItem {
    id: number;
    title: string;
    artist: string;
    description: string | null;
    starts_at: string;
    formatted_date: string;
    formatted_time: string;
    genre: string;
    status: string;
    min_price: number;
    min_price_cents: number;
    image_url: string | null;
    venue: Venue;
}

export interface EventsResponse {
    events: EventItem[];
    total_count: number;
}

export interface FetchEventsParams {
    search?: string;
    date?: string;
    genre?: string;
}

export async function fetchEventsApi(params: FetchEventsParams = {}): Promise<EventsResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.date) query.set("date", params.date);
    if (params.genre) query.set("genre", params.genre);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<EventsResponse>(`/events${queryString}`, {
        method: "GET",
    });
}

export async function fetchEventByIdApi(id: number): Promise<{ event: EventItem }> {
    return apiFetch<{ event: EventItem }>(`/events/${id}`, {
        method: "GET",
    });
}
