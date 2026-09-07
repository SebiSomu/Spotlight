import { apiFetch } from "./client";
import { type EventItem } from "./events";
import { type VenueItem } from "./venues";

export interface AdminStats {
    total_events: number;
    published_events: number;
    draft_events: number;
    sold_out_events: number;
    cancelled_events: number;
    total_venues: number;
    total_orders: number;
    total_tickets_sold: number;
    total_revenue_cents: number;
    total_revenue_dollars: number;
}

export interface AdminStatsResponse {
    stats: AdminStats;
    recent_events: EventItem[];
}

export interface AdminEventItem extends EventItem {
    total_capacity?: number;
    total_remaining?: number;
    tickets_sold_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface AdminEventsResponse {
    events: AdminEventItem[];
    total_count: number;
}

export interface AdminTicketTypePayload {
    id?: number;
    name: string;
    price?: number;
    price_cents?: number;
    quantity_available: number;
    quantity_remaining?: number;
}

export interface CreateAdminEventPayload {
    title: string;
    artist: string;
    genre: string;
    description?: string;
    starts_at: string;
    status: "published" | "draft" | "cancelled" | "sold_out";
    venue_id: number;
    image_url?: string;
    min_price_cents?: number;
    ticket_types?: AdminTicketTypePayload[];
}

export type UpdateAdminEventPayload = Partial<CreateAdminEventPayload>;

export interface AdminVenuePayload {
    name: string;
    address?: string;
    city: string;
    state?: string;
    capacity?: number | null;
    image_url?: string;
    latitude?: number | null;
    longitude?: number | null;
}

export interface AdminVenuesResponse {
    venues: VenueItem[];
    total_count: number;
}

export async function fetchAdminStatsApi(): Promise<AdminStatsResponse> {
    return apiFetch<AdminStatsResponse>("/admin/stats", {
        method: "GET",
    });
}

export async function fetchAdminEventsApi(params: {
    search?: string;
    status?: string;
    genre?: string;
    venue_id?: number | string;
    sort_by?: string;
} = {}): Promise<AdminEventsResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status && params.status !== "All") query.set("status", params.status);
    if (params.genre && params.genre !== "All") query.set("genre", params.genre);
    if (params.venue_id && params.venue_id !== "All") query.set("venue_id", String(params.venue_id));
    if (params.sort_by) query.set("sort_by", params.sort_by);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<AdminEventsResponse>(`/admin/events${queryString}`, {
        method: "GET",
    });
}

export async function fetchAdminEventByIdApi(id: number): Promise<{ event: AdminEventItem }> {
    return apiFetch<{ event: AdminEventItem }>(`/admin/events/${id}`, {
        method: "GET",
    });
}

export async function createAdminEventApi(payload: CreateAdminEventPayload): Promise<{ event: AdminEventItem }> {
    return apiFetch<{ event: AdminEventItem }>("/admin/events", {
        method: "POST",
        body: JSON.stringify({
            event: {
                title: payload.title,
                artist: payload.artist,
                genre: payload.genre,
                description: payload.description,
                starts_at: payload.starts_at,
                status: payload.status,
                venue_id: payload.venue_id,
                image_url: payload.image_url,
                min_price_cents: payload.min_price_cents,
            },
            ticket_types: payload.ticket_types,
        }),
    });
}

export async function updateAdminEventApi(
    id: number,
    payload: UpdateAdminEventPayload,
): Promise<{ event: AdminEventItem }> {
    return apiFetch<{ event: AdminEventItem }>(`/admin/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
            event: {
                title: payload.title,
                artist: payload.artist,
                genre: payload.genre,
                description: payload.description,
                starts_at: payload.starts_at,
                status: payload.status,
                venue_id: payload.venue_id,
                image_url: payload.image_url,
                min_price_cents: payload.min_price_cents,
            },
            ticket_types: payload.ticket_types,
        }),
    });
}

export async function deleteAdminEventApi(id: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/admin/events/${id}`, {
        method: "DELETE",
    });
}

export async function fetchAdminVenuesApi(search?: string): Promise<AdminVenuesResponse> {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    return apiFetch<AdminVenuesResponse>(`/admin/venues${queryString}`, {
        method: "GET",
    });
}

export async function createAdminVenueApi(payload: AdminVenuePayload): Promise<{ venue: VenueItem }> {
    return apiFetch<{ venue: VenueItem }>("/admin/venues", {
        method: "POST",
        body: JSON.stringify({ venue: payload }),
    });
}

export async function updateAdminVenueApi(
    id: number,
    payload: Partial<AdminVenuePayload>,
): Promise<{ venue: VenueItem }> {
    return apiFetch<{ venue: VenueItem }>(`/admin/venues/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ venue: payload }),
    });
}

export async function deleteAdminVenueApi(id: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/admin/venues/${id}`, {
        method: "DELETE",
    });
}
