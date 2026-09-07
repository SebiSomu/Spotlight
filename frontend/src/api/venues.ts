import { apiFetch } from "./client";

export interface VenueItem {
    id: number;
    name: string;
    address: string | null;
    city: string;
    state: string | null;
    location: string;
    capacity: number | null;
    image_url: string | null;
    latitude?: number | null;
    longitude?: number | null;
    events_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface VenuesResponse {
    venues: VenueItem[];
    total_count: number;
}

export async function fetchVenuesApi(search?: string): Promise<VenuesResponse> {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<VenuesResponse>(`/venues${queryString}`, {
        method: "GET",
    });
}

export async function fetchVenueByIdApi(id: number): Promise<{ venue: VenueItem }> {
    return apiFetch<{ venue: VenueItem }>(`/venues/${id}`, {
        method: "GET",
    });
}
