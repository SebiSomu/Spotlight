import { useState, useEffect, useId } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
    type AdminStats,
    type AdminEventItem,
    type AdminTicketTypePayload,
    type CreateAdminEventPayload,
    type AdminVenuePayload,
    fetchAdminStatsApi,
    fetchAdminEventsApi,
    createAdminEventApi,
    updateAdminEventApi,
    deleteAdminEventApi,
    fetchAdminVenuesApi,
    createAdminVenueApi,
    updateAdminVenueApi,
    deleteAdminVenueApi,
} from "../api/admin";
import { type VenueItem } from "../api/venues";

interface AdminDashboardPageProps {
    onNavigateHome: () => void;
    onSelectEvent?: (id: number) => void;
}

const DEFAULT_GENRES = [
    "Reggaeton & Latin",
    "Hip-Hop & Rap",
    "Pop",
    "R&B",
    "Alternative & Rock",
    "Electronic",
];

const PRESET_EVENT_IMAGES = [
    { label: "Festival Stage", url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80" },
    { label: "Arena Crowd", url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80" },
    { label: "Club DJ Light", url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80" },
    { label: "Acoustic / Indie", url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80" },
];

export default function AdminDashboardPage({ onNavigateHome }: AdminDashboardPageProps) {
    const { user, openModal } = useAuth();
    const { toast } = useToast();

    // IDs for accessible form controls
    const searchId = useId();
    const statusFilterId = useId();
    const genreFilterId = useId();
    const venueFilterId = useId();
    const venueSearchId = useId();

    const isAdmin =
        user?.role === "admin" ||
        user?.email?.toLowerCase() === "sebisomu@spotlight.com" ||
        user?.is_admin === true;

    const [activeTab, setActiveTab] = useState<"events" | "venues" | "overview">("events");

    // Loading & state
    const [loadingStats, setLoadingStats] = useState(false);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [loadingVenues, setLoadingVenues] = useState(false);

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [events, setEvents] = useState<AdminEventItem[]>([]);
    const [venues, setVenues] = useState<VenueItem[]>([]);

    // Filters for Events
    const [eventSearch, setEventSearch] = useState("");
    const [eventStatusFilter, setEventStatusFilter] = useState("All");
    const [eventGenreFilter, setEventGenreFilter] = useState("All");
    const [eventVenueFilter, setEventVenueFilter] = useState("All");

    // Filters for Venues
    const [venueSearch, setVenueSearch] = useState("");

    // Modal States: Event Create/Edit
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [eventFormSubmitting, setEventFormSubmitting] = useState(false);
    const [eventFormData, setEventFormData] = useState<{
        title: string;
        artist: string;
        genre: string;
        description: string;
        starts_at: string;
        status: "published" | "draft" | "cancelled" | "sold_out";
        venue_id: number | "";
        image_url: string;
        ticket_types: AdminTicketTypePayload[];
    }>({
        title: "",
        artist: "",
        genre: DEFAULT_GENRES[0],
        description: "",
        starts_at: "",
        status: "published",
        venue_id: "",
        image_url: "",
        ticket_types: [
            { name: "General Admission", price: 45, quantity_available: 150 },
            { name: "VIP Floor", price: 120, quantity_available: 50 },
        ],
    });

    // Modal States: Venue Create/Edit
    const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
    const [editingVenueId, setEditingVenueId] = useState<number | null>(null);
    const [venueFormSubmitting, setVenueFormSubmitting] = useState(false);
    const [venueFormData, setVenueFormData] = useState<{
        name: string;
        address: string;
        city: string;
        state: string;
        capacity: number | "";
        image_url: string;
        latitude: number | "";
        longitude: number | "";
    }>({
        name: "",
        address: "",
        city: "",
        state: "",
        capacity: "",
        image_url: "",
        latitude: "",
        longitude: "",
    });

    // Delete confirmation modals
    const [eventToDelete, setEventToDelete] = useState<AdminEventItem | null>(null);
    const [venueToDelete, setVenueToDelete] = useState<VenueItem | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Initial Data Fetching
    const loadStats = async () => {
        setLoadingStats(true);
        try {
            const res = await fetchAdminStatsApi();
            setStats(res.stats);
        } catch (err) {
            console.error("Failed to load admin stats:", err);
        } finally {
            setLoadingStats(false);
        }
    };

    const loadEvents = async () => {
        setLoadingEvents(true);
        try {
            const res = await fetchAdminEventsApi({
                search: eventSearch,
                status: eventStatusFilter,
                genre: eventGenreFilter,
                venue_id: eventVenueFilter,
            });
            setEvents(res.events);
        } catch (err) {
            console.error("Failed to load admin events:", err);
            toast.error("Error Loading Events", "Failed to retrieve concerts list.");
        } finally {
            setLoadingEvents(false);
        }
    };

    const loadVenues = async () => {
        setLoadingVenues(true);
        try {
            const res = await fetchAdminVenuesApi(venueSearch);
            setVenues(res.venues);
        } catch (err) {
            console.error("Failed to load admin venues:", err);
            toast.error("Error Loading Venues", "Failed to retrieve venues list.");
        } finally {
            setLoadingVenues(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            loadStats();
            loadEvents();
            loadVenues();
        }
    }, [isAdmin]);

    useEffect(() => {
        if (isAdmin) {
            const timer = setTimeout(() => {
                loadEvents();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [eventSearch, eventStatusFilter, eventGenreFilter, eventVenueFilter]);

    useEffect(() => {
        if (isAdmin) {
            const timer = setTimeout(() => {
                loadVenues();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [venueSearch]);

    // Handle Open Event Create Modal
    const handleOpenCreateEvent = () => {
        setEditingEventId(null);
        const defaultVenueId = venues.length > 0 ? venues[0].id : "";
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 14);
        defaultDate.setHours(20, 0, 0, 0);

        setEventFormData({
            title: "",
            artist: "",
            genre: DEFAULT_GENRES[0],
            description: "",
            starts_at: defaultDate.toISOString().slice(0, 16),
            status: "published",
            venue_id: defaultVenueId,
            image_url: PRESET_EVENT_IMAGES[0].url,
            ticket_types: [
                { name: "General Admission", price: 55, quantity_available: 200 },
                { name: "VIP Lounge", price: 140, quantity_available: 50 },
            ],
        });
        setIsEventModalOpen(true);
    };

    // Handle Open Event Edit Modal
    const handleOpenEditEvent = (event: AdminEventItem) => {
        setEditingEventId(event.id);
        const dateStr = event.starts_at ? new Date(event.starts_at).toISOString().slice(0, 16) : "";

        const ticketTypes: AdminTicketTypePayload[] = event.ticket_types && event.ticket_types.length > 0
            ? event.ticket_types.map((tt) => ({
                id: tt.id,
                name: tt.name,
                price: tt.price || tt.price_cents / 100,
                quantity_available: tt.quantity_available,
                quantity_remaining: tt.quantity_remaining,
            }))
            : [{ name: "General Admission", price: event.min_price || 50, quantity_available: 100 }];

        setEventFormData({
            title: event.title,
            artist: event.artist,
            genre: event.genre,
            description: event.description || "",
            starts_at: dateStr,
            status: (event.status as "published" | "draft" | "cancelled" | "sold_out") || "published",
            venue_id: event.venue?.id || (venues[0]?.id ?? ""),
            image_url: event.image_url || "",
            ticket_types: ticketTypes,
        });
        setIsEventModalOpen(true);
    };

    // Ticket Type Row Manager
    const handleAddTicketType = () => {
        setEventFormData((prev) => ({
            ...prev,
            ticket_types: [
                ...prev.ticket_types,
                { name: "Tier " + (prev.ticket_types.length + 1), price: 75, quantity_available: 100 },
            ],
        }));
    };

    const handleRemoveTicketType = (index: number) => {
        if (eventFormData.ticket_types.length <= 1) {
            toast.info("Validation", "At least one ticket tier is required.");
            return;
        }
        setEventFormData((prev) => ({
            ...prev,
            ticket_types: prev.ticket_types.filter((_, i) => i !== index),
        }));
    };

    const handleTicketTypeChange = (index: number, field: keyof AdminTicketTypePayload, value: string | number) => {
        setEventFormData((prev) => {
            const updated = [...prev.ticket_types];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, ticket_types: updated };
        });
    };

    // Save Event (Create or Update)
    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventFormData.title.trim() || !eventFormData.artist.trim()) {
            toast.error("Validation Error", "Concert title and artist name are required.");
            return;
        }
        if (!eventFormData.venue_id) {
            toast.error("Validation Error", "Please select a venue for this concert.");
            return;
        }
        if (!eventFormData.starts_at) {
            toast.error("Validation Error", "Please specify concert date and time.");
            return;
        }

        setEventFormSubmitting(true);
        try {
            const payload: CreateAdminEventPayload = {
                title: eventFormData.title.trim(),
                artist: eventFormData.artist.trim(),
                genre: eventFormData.genre,
                description: eventFormData.description.trim(),
                starts_at: new Date(eventFormData.starts_at).toISOString(),
                status: eventFormData.status,
                venue_id: Number(eventFormData.venue_id),
                image_url: eventFormData.image_url.trim(),
                ticket_types: eventFormData.ticket_types.map((tt) => ({
                    id: tt.id,
                    name: tt.name,
                    price_cents: Math.round(Number(tt.price || 0) * 100),
                    quantity_available: Number(tt.quantity_available || 0),
                    quantity_remaining: Number(tt.quantity_available || 0),
                })),
            };

            if (editingEventId) {
                await updateAdminEventApi(editingEventId, payload);
                toast.success("Concert Updated", `"${payload.title}" details saved.`);
            } else {
                await createAdminEventApi(payload);
                toast.success("Concert Created", `"${payload.title}" is now available.`);
            }

            setIsEventModalOpen(false);
            loadEvents();
            loadStats();
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : "Failed to save concert.";
            toast.error("Save Failed", errMsg);
        } finally {
            setEventFormSubmitting(false);
        }
    };

    // Quick Status Toggle for Concert
    const handleToggleEventStatus = async (event: AdminEventItem) => {
        const nextStatus = event.status === "published" ? "draft" : "published";
        try {
            await updateAdminEventApi(event.id, { status: nextStatus });
            toast.info("Status Changed", `Set to ${nextStatus.toUpperCase()}`);
            setEvents((prev) =>
                prev.map((e) => (e.id === event.id ? { ...e, status: nextStatus } : e)),
            );
            loadStats();
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : "Failed to toggle status.";
            toast.error("Error", errMsg);
        }
    };

    // Confirm Delete Event
    const handleConfirmDeleteEvent = async () => {
        if (!eventToDelete) return;
        setDeleteLoading(true);
        try {
            await deleteAdminEventApi(eventToDelete.id);
            toast.success("Concert Deleted", `"${eventToDelete.title}" removed.`);
            setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
            setEventToDelete(null);
            loadStats();
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : "Failed to delete concert.";
            toast.error("Deletion Failed", errMsg);
        } finally {
            setDeleteLoading(false);
        }
    };

    // Handle Open Venue Create Modal
    const handleOpenCreateVenue = () => {
        setEditingVenueId(null);
        setVenueFormData({
            name: "",
            address: "",
            city: "",
            state: "",
            capacity: 5000,
            image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
            latitude: "",
            longitude: "",
        });
        setIsVenueModalOpen(true);
    };

    // Handle Open Venue Edit Modal
    const handleOpenEditVenue = (venue: VenueItem) => {
        setEditingVenueId(venue.id);
        setVenueFormData({
            name: venue.name,
            address: venue.address || "",
            city: venue.city || "",
            state: venue.state || "",
            capacity: venue.capacity || "",
            image_url: venue.image_url || "",
            latitude: venue.latitude ?? "",
            longitude: venue.longitude ?? "",
        });
        setIsVenueModalOpen(true);
    };

    // Save Venue (Create or Update)
    const handleSaveVenue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!venueFormData.name.trim() || !venueFormData.city.trim()) {
            toast.error("Validation Error", "Venue name and city are required.");
            return;
        }

        setVenueFormSubmitting(true);
        try {
            const payload: AdminVenuePayload = {
                name: venueFormData.name.trim(),
                address: venueFormData.address.trim(),
                city: venueFormData.city.trim(),
                state: venueFormData.state.trim(),
                capacity: venueFormData.capacity ? Number(venueFormData.capacity) : null,
                image_url: venueFormData.image_url.trim(),
                latitude: venueFormData.latitude !== "" ? Number(venueFormData.latitude) : null,
                longitude: venueFormData.longitude !== "" ? Number(venueFormData.longitude) : null,
            };

            if (editingVenueId) {
                await updateAdminVenueApi(editingVenueId, payload);
                toast.success("Venue Updated", `"${payload.name}" updated successfully.`);
            } else {
                await createAdminVenueApi(payload);
                toast.success("Venue Created", `"${payload.name}" added to venues list.`);
            }

            setIsVenueModalOpen(false);
            loadVenues();
            loadStats();
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : "Failed to save venue.";
            toast.error("Save Failed", errMsg);
        } finally {
            setVenueFormSubmitting(false);
        }
    };

    // Confirm Delete Venue
    const handleConfirmDeleteVenue = async () => {
        if (!venueToDelete) return;
        setDeleteLoading(true);
        try {
            await deleteAdminVenueApi(venueToDelete.id);
            toast.success("Venue Deleted", `"${venueToDelete.name}" removed.`);
            setVenues((prev) => prev.filter((v) => v.id !== venueToDelete.id));
            setVenueToDelete(null);
            loadStats();
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : "Failed to delete venue.";
            toast.error("Deletion Failed", errMsg);
        } finally {
            setDeleteLoading(false);
        }
    };

    // Guard: Unauthorized screen if not admin
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-bg-primary pt-32 pb-24 px-5 text-center flex items-center justify-center">
                <div className="max-w-md mx-auto bg-surface/50 border border-crimson/30 rounded-3xl p-8 space-y-5 shadow-2xl backdrop-blur-md">
                    <div className="w-16 h-16 rounded-full bg-crimson/10 border border-crimson/30 text-crimson flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h1 className="font-display text-2xl font-bold text-text-primary">
                        Admin Access Required
                    </h1>

                    <p className="font-body text-xs text-text-muted leading-relaxed">
                        This administrative console is restricted to authorized operators with administrator credentials.
                        Please sign in with <span className="text-gold font-semibold font-mono">sebisomu@spotlight.com</span> to continue.
                    </p>

                    <div className="pt-2 flex flex-col gap-3">
                        <button
                            onClick={() => openModal("login")}
                            className="w-full font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover py-3 rounded-xl border-none cursor-pointer transition-all shadow-md hover:shadow-gold/20"
                        >
                            Sign In with Admin Account
                        </button>

                        <button
                            onClick={onNavigateHome}
                            className="w-full font-body text-xs font-semibold text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 py-3 rounded-xl border border-white/10 cursor-pointer transition-all"
                        >
                            Return to Homepage
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary pt-24 pb-28 px-4 sm:px-8 lg:px-12" id="admin-dashboard-page">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Top Control Bar & Admin Header */}
                <div className="bg-surface border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="font-body text-[10px] font-extrabold uppercase tracking-widest text-gold bg-gold/15 border border-gold/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
                                    COMMAND CONSOLE
                                </span>
                                <span className="font-mono text-xs text-text-muted">
                                    Operator: <strong className="text-text-primary">{user?.email}</strong>
                                </span>
                            </div>
                            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary tracking-tight">
                                Concert & Venue Management
                            </h1>
                            <p className="font-body text-xs sm:text-sm text-text-muted mt-1">
                                Complete administrative control over live events, seating inventory, ticket tiers, and stadium venues.
                            </p>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={handleOpenCreateEvent}
                                className="flex-1 sm:flex-none font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover px-5 py-3 rounded-xl border-none cursor-pointer transition-all shadow-lg hover:shadow-gold/20 flex items-center justify-center gap-2"
                                id="admin-create-event-btn"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                New Concert
                            </button>

                            <button
                                onClick={handleOpenCreateVenue}
                                className="flex-1 sm:flex-none font-body text-xs font-bold uppercase tracking-wider text-text-primary bg-white/8 hover:bg-white/14 border border-white/15 px-5 py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                                id="admin-create-venue-btn"
                            >
                                <svg className="w-4 h-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                New Venue
                            </button>
                        </div>
                    </div>
                </div>

                {/* Key Performance Indicators (Stats Ribbon) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" id="admin-stats-cards">
                    {/* Revenue Card */}
                    <div className="bg-surface/80 border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-gold/30 transition-all">
                        <div className="flex items-center justify-between text-text-muted mb-2 font-body text-xs font-semibold uppercase tracking-wider">
                            <span>Total Revenue</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
                            {loadingStats ? "..." : `$${(stats?.total_revenue_dollars || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </div>
                        <span className="font-body text-[11px] text-text-muted mt-1 block">
                            Across {stats?.total_orders || 0} customer orders
                        </span>
                    </div>

                    {/* Tickets Sold Card */}
                    <div className="bg-surface/80 border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-gold/30 transition-all">
                        <div className="flex items-center justify-between text-text-muted mb-2 font-body text-xs font-semibold uppercase tracking-wider">
                            <span>Tickets Issued</span>
                            <div className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                            </div>
                        </div>
                        <div className="font-display text-2xl sm:text-3xl font-bold text-gold">
                            {loadingStats ? "..." : (stats?.total_tickets_sold || 0).toLocaleString()}
                        </div>
                        <span className="font-body text-[11px] text-text-muted mt-1 block">
                            Valid digital passes generated
                        </span>
                    </div>

                    {/* Concerts Card */}
                    <div className="bg-surface/80 border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-gold/30 transition-all">
                        <div className="flex items-center justify-between text-text-muted mb-2 font-body text-xs font-semibold uppercase tracking-wider">
                            <span>Total Concerts</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                            </div>
                        </div>
                        <div className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
                            {loadingStats ? "..." : stats?.total_events || 0}
                        </div>
                        <span className="font-body text-[11px] text-emerald-400 mt-1 block">
                            {stats?.published_events || 0} Live / {stats?.draft_events || 0} Draft
                        </span>
                    </div>

                    {/* Venues Card */}
                    <div className="bg-surface/80 border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-gold/30 transition-all">
                        <div className="flex items-center justify-between text-text-muted mb-2 font-body text-xs font-semibold uppercase tracking-wider">
                            <span>Active Venues</span>
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
                            {loadingStats ? "..." : stats?.total_venues || 0}
                        </div>
                        <span className="font-body text-[11px] text-text-muted mt-1 block">
                            Stadiums, arenas & clubs
                        </span>
                    </div>
                </div>

                {/* Main Navigation Tabs */}
                <div className="flex border-b border-white/10 gap-2 overflow-x-auto" id="admin-tabs">
                    <button
                        onClick={() => setActiveTab("events")}
                        className={`font-body text-xs font-bold uppercase tracking-wider px-6 py-3.5 border-b-2 cursor-pointer transition-all bg-transparent whitespace-nowrap flex items-center gap-2 ${
                            activeTab === "events"
                                ? "border-gold text-gold bg-gold/5"
                                : "border-transparent text-text-muted hover:text-text-primary"
                        }`}
                        id="tab-manage-events"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        Concerts Catalog ({events.length})
                    </button>

                    <button
                        onClick={() => setActiveTab("venues")}
                        className={`font-body text-xs font-bold uppercase tracking-wider px-6 py-3.5 border-b-2 cursor-pointer transition-all bg-transparent whitespace-nowrap flex items-center gap-2 ${
                            activeTab === "venues"
                                ? "border-gold text-gold bg-gold/5"
                                : "border-transparent text-text-muted hover:text-text-primary"
                        }`}
                        id="tab-manage-venues"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Venues & Locations ({venues.length})
                    </button>
                </div>

                {/* TAB 1: CONCERTS MANAGEMENT */}
                {activeTab === "events" && (
                    <div className="space-y-6" id="admin-events-view">
                        {/* Search & Filter Toolbar */}
                        <div className="bg-surface border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                            {/* Search */}
                            <div className="relative flex-1">
                                <label htmlFor={searchId} className="sr-only">Search Concerts</label>
                                <svg
                                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                                <input
                                    id={searchId}
                                    type="text"
                                    placeholder="Search concerts by artist, title, or venue..."
                                    value={eventSearch}
                                    onChange={(e) => setEventSearch(e.target.value)}
                                    className="w-full bg-bg-primary/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 font-body text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold transition-colors"
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-2.5 items-center">
                                {/* Status Filter */}
                                <div className="flex items-center gap-1.5">
                                    <label htmlFor={statusFilterId} className="font-body text-[11px] text-text-muted">Status:</label>
                                    <select
                                        id={statusFilterId}
                                        value={eventStatusFilter}
                                        onChange={(e) => setEventStatusFilter(e.target.value)}
                                        className="bg-bg-primary/80 border border-white/10 rounded-xl px-3 py-2 font-body text-xs text-text-primary focus:outline-none focus:border-gold cursor-pointer"
                                    >
                                        <option value="All">All Statuses</option>
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                        <option value="sold_out">Sold Out</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                {/* Genre Filter */}
                                <div className="flex items-center gap-1.5">
                                    <label htmlFor={genreFilterId} className="font-body text-[11px] text-text-muted">Genre:</label>
                                    <select
                                        id={genreFilterId}
                                        value={eventGenreFilter}
                                        onChange={(e) => setEventGenreFilter(e.target.value)}
                                        className="bg-bg-primary/80 border border-white/10 rounded-xl px-3 py-2 font-body text-xs text-text-primary focus:outline-none focus:border-gold cursor-pointer"
                                    >
                                        <option value="All">All Genres</option>
                                        {DEFAULT_GENRES.map((g) => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Venue Filter */}
                                <div className="flex items-center gap-1.5">
                                    <label htmlFor={venueFilterId} className="font-body text-[11px] text-text-muted">Venue:</label>
                                    <select
                                        id={venueFilterId}
                                        value={eventVenueFilter}
                                        onChange={(e) => setEventVenueFilter(e.target.value)}
                                        className="bg-bg-primary/80 border border-white/10 rounded-xl px-3 py-2 font-body text-xs text-text-primary focus:outline-none focus:border-gold cursor-pointer max-w-[150px] truncate"
                                    >
                                        <option value="All">All Venues</option>
                                        {venues.map((v) => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Events Table / Card List */}
                        {loadingEvents ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-28 bg-surface/50 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : events.length === 0 ? (
                            <div className="text-center py-20 bg-surface/30 border border-white/10 rounded-2xl space-y-4">
                                <div className="w-16 h-16 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto">
                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                    </svg>
                                </div>
                                <h2 className="font-display text-lg font-bold text-text-primary">
                                    No Concerts Found
                                </h2>
                                <p className="font-body text-xs text-text-muted max-w-md mx-auto">
                                    No events match the current search or filters. Try adjusting your query or create a new concert show.
                                </p>
                                <button
                                    onClick={handleOpenCreateEvent}
                                    className="font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover px-6 py-2.5 rounded-lg border-none cursor-pointer transition-all"
                                >
                                    + Add New Concert
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {events.map((event) => {
                                    const isPublished = event.status === "published";
                                    const isSoldOut = event.status === "sold_out";
                                    const isDraft = event.status === "draft";

                                    return (
                                        <div
                                            key={event.id}
                                            className="bg-surface border border-white/10 hover:border-gold/30 rounded-2xl p-5 shadow-xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                                            id={`admin-event-row-${event.id}`}
                                        >
                                            {/* Event Info Left */}
                                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-bg-primary shrink-0 relative border border-white/10">
                                                    <img
                                                        src={event.image_url || PRESET_EVENT_IMAGES[0].url}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="min-w-0 space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span
                                                            className={`font-body text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                                                isPublished
                                                                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                                                                    : isDraft
                                                                    ? "text-amber-400 bg-amber-500/10 border-amber-500/25"
                                                                    : isSoldOut
                                                                    ? "text-purple-400 bg-purple-500/10 border-purple-500/25"
                                                                    : "text-crimson bg-crimson/10 border-crimson/25"
                                                            }`}
                                                        >
                                                            {event.status}
                                                        </span>
                                                        <span className="font-body text-[10px] font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded">
                                                            {event.genre}
                                                        </span>
                                                    </div>

                                                    <h3 className="font-display text-lg font-bold text-text-primary truncate">
                                                        {event.artist}
                                                    </h3>
                                                    <p className="font-display text-xs font-semibold text-text-secondary truncate">
                                                        {event.title}
                                                    </p>

                                                    <div className="font-body text-xs text-text-muted flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-3.5 h-3.5 text-gold shrink-0" viewBox="0 0 16 16" fill="none">
                                                                <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
                                                                <path d="M2 7h12" stroke="currentColor" strokeWidth="1.2" />
                                                            </svg>
                                                            {event.formatted_date} • {event.formatted_time}
                                                        </span>

                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-3.5 h-3.5 text-gold shrink-0" viewBox="0 0 16 16" fill="none">
                                                                <path d="M8 1.5C5.2 1.5 3 3.7 3 6.5C3 10.2 8 14.5 8 14.5C8 14.5 13 10.2 13 6.5C13 3.7 10.8 1.5 8 1.5ZM8 8C7.2 8 6.5 7.3 6.5 6.5C6.5 5.7 7.2 5 8 5C8.8 5 9.5 5.7 9.5 6.5C9.5 7.3 8.8 8 8 8Z" fill="currentColor" />
                                                            </svg>
                                                            {event.venue?.name || "Unassigned Venue"} ({event.venue?.city})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Inventory & Pricing Center */}
                                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-bg-primary/60 border border-white/5 p-3 rounded-xl shrink-0 w-full md:w-auto justify-between md:justify-start">
                                                <div>
                                                    <span className="font-body text-[10px] text-text-muted uppercase tracking-wider block">
                                                        Tiers
                                                    </span>
                                                    <span className="font-body text-xs font-bold text-text-primary">
                                                        {event.ticket_types?.length || 0} Pricing Tiers
                                                    </span>
                                                </div>

                                                <div className="h-6 w-px bg-white/10" />

                                                <div>
                                                    <span className="font-body text-[10px] text-text-muted uppercase tracking-wider block">
                                                        Min Price
                                                    </span>
                                                    <span className="font-display text-sm font-bold text-gold">
                                                        ${(event.min_price || 0).toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="h-6 w-px bg-white/10" />

                                                <div>
                                                    <span className="font-body text-[10px] text-text-muted uppercase tracking-wider block">
                                                        Sold / Cap
                                                    </span>
                                                    <span className="font-body text-xs font-bold text-emerald-400">
                                                        {event.tickets_sold_count || 0} / {event.total_capacity || 0}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons Right */}
                                            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                                <button
                                                    onClick={() => handleToggleEventStatus(event)}
                                                    className={`font-body text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                                                        isPublished
                                                            ? "text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                                                            : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
                                                    }`}
                                                    title="Toggle Publish/Draft"
                                                >
                                                    {isPublished ? "Unpublish" : "Publish"}
                                                </button>

                                                <button
                                                    onClick={() => handleOpenEditEvent(event)}
                                                    className="font-body text-[11px] font-bold uppercase tracking-wider text-text-primary bg-white/6 hover:bg-white/12 border border-white/10 px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                                                    id={`edit-event-btn-${event.id}`}
                                                >
                                                    <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() => setEventToDelete(event)}
                                                    className="font-body text-[11px] font-bold uppercase tracking-wider text-crimson bg-crimson/10 hover:bg-crimson/20 border border-crimson/30 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                                                    id={`delete-event-btn-${event.id}`}
                                                    title="Delete Concert"
                                                >
                                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: VENUES MANAGEMENT */}
                {activeTab === "venues" && (
                    <div className="space-y-6" id="admin-venues-view">
                        {/* Venue Search & Action */}
                        <div className="bg-surface border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="relative flex-1 w-full">
                                <label htmlFor={venueSearchId} className="sr-only">Search Venues</label>
                                <svg
                                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                                <input
                                    id={venueSearchId}
                                    type="text"
                                    placeholder="Search venues by name, city, state, or address..."
                                    value={venueSearch}
                                    onChange={(e) => setVenueSearch(e.target.value)}
                                    className="w-full bg-bg-primary/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 font-body text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold transition-colors"
                                />
                            </div>

                            <button
                                onClick={handleOpenCreateVenue}
                                className="w-full sm:w-auto font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover px-5 py-2.5 rounded-xl border-none cursor-pointer transition-all flex items-center justify-center gap-2 shrink-0"
                            >
                                + Add Venue
                            </button>
                        </div>

                        {/* Venues Grid */}
                        {loadingVenues ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-64 bg-surface/50 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : venues.length === 0 ? (
                            <div className="text-center py-20 bg-surface/30 border border-white/10 rounded-2xl space-y-4">
                                <h2 className="font-display text-lg font-bold text-text-primary">
                                    No Venues Found
                                </h2>
                                <p className="font-body text-xs text-text-muted max-w-md mx-auto">
                                    No venues match your current search query.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {venues.map((venue) => (
                                    <div
                                        key={venue.id}
                                        className="bg-surface border border-white/10 hover:border-gold/30 rounded-2xl overflow-hidden shadow-xl transition-all flex flex-col justify-between group"
                                        id={`admin-venue-card-${venue.id}`}
                                    >
                                        <div>
                                            {/* Venue Image Banner */}
                                            <div className="h-36 bg-bg-primary relative overflow-hidden">
                                                <img
                                                    src={venue.image_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80"}
                                                    alt={venue.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />

                                                {venue.capacity && (
                                                    <span className="absolute top-3 right-3 font-body text-[10px] font-bold text-text-primary bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full">
                                                        Cap: {venue.capacity.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="p-5 space-y-3">
                                                <div>
                                                    <h3 className="font-display text-lg font-bold text-text-primary mb-1">
                                                        {venue.name}
                                                    </h3>
                                                    <p className="font-body text-xs text-gold flex items-center gap-1.5">
                                                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                                                            <path d="M8 1.5C5.2 1.5 3 3.7 3 6.5C3 10.2 8 14.5 8 14.5C8 14.5 13 10.2 13 6.5C13 3.7 10.8 1.5 8 1.5ZM8 8C7.2 8 6.5 7.3 6.5 6.5C6.5 5.7 7.2 5 8 5C8.8 5 9.5 5.7 9.5 6.5C9.5 7.3 8.8 8 8 8Z" fill="currentColor" />
                                                        </svg>
                                                        {venue.city}{venue.state ? `, ${venue.state}` : ""}
                                                    </p>
                                                </div>

                                                <div className="font-body text-xs text-text-muted space-y-1 pt-2 border-t border-white/6">
                                                    {venue.address && (
                                                        <p className="truncate">
                                                            Address: <span className="text-text-secondary">{venue.address}</span>
                                                        </p>
                                                    )}
                                                    {venue.latitude && venue.longitude && (
                                                        <p className="font-mono text-[11px] text-text-muted">
                                                            GPS: {Number(venue.latitude).toFixed(4)}, {Number(venue.longitude).toFixed(4)}
                                                        </p>
                                                    )}
                                                    <p className="text-[11px] text-emerald-400 font-semibold">
                                                        Scheduled Shows: {venue.events_count || 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions footer */}
                                        <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-3 border-t border-white/6">
                                            <button
                                                onClick={() => handleOpenEditVenue(venue)}
                                                className="flex-1 font-body text-xs font-bold uppercase tracking-wider text-text-primary bg-white/6 hover:bg-white/12 border border-white/10 py-2 rounded-xl transition-colors cursor-pointer text-center"
                                            >
                                                Edit Venue
                                            </button>

                                            <button
                                                onClick={() => setVenueToDelete(venue)}
                                                className="font-body text-xs font-bold text-crimson bg-crimson/10 hover:bg-crimson/20 border border-crimson/30 p-2 rounded-xl transition-colors cursor-pointer"
                                                title="Delete Venue"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* MODAL: CREATE / EDIT CONCERT EVENT */}
            {/* ========================================================================= */}
            {isEventModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-surface border border-white/15 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <h2 className="font-display text-2xl font-bold text-text-primary">
                                    {editingEventId ? "Edit Concert Show" : "Create New Concert Show"}
                                </h2>
                                <p className="font-body text-xs text-text-muted mt-0.5">
                                    Set artist, date, venue location, status, and ticket pricing tiers.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsEventModalOpen(false)}
                                className="w-9 h-9 rounded-full bg-white/6 hover:bg-white/12 text-text-muted hover:text-text-primary flex items-center justify-center border border-white/10 cursor-pointer transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveEvent} className="space-y-6 font-body text-xs">
                            {/* Basic Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                        Headliner / Artist Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Bad Bunny, Kendrick Lamar, Dua Lipa"
                                        value={eventFormData.artist}
                                        onChange={(e) => setEventFormData({ ...eventFormData, artist: e.target.value })}
                                        className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                        Concert / Tour Title *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Most Wanted Tour 2026, Radical Optimism"
                                        value={eventFormData.title}
                                        onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                                        className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Genre, Venue & Status Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                        Music Genre *
                                    </label>
                                    <select
                                        value={eventFormData.genre}
                                        onChange={(e) => setEventFormData({ ...eventFormData, genre: e.target.value })}
                                        className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold cursor-pointer"
                                    >
                                        {DEFAULT_GENRES.map((g) => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                        Host Venue *
                                    </label>
                                    <select
                                        value={eventFormData.venue_id}
                                        onChange={(e) => setEventFormData({ ...eventFormData, venue_id: Number(e.target.value) })}
                                        className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold cursor-pointer"
                                        required
                                    >
                                        <option value="">Select a Venue</option>
                                        {venues.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name} ({v.city}, {v.state})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                        Publish Status
                                    </label>
                                    <select
                                        value={eventFormData.status}
                                        onChange={(e) =>
                                            setEventFormData({
                                                ...eventFormData,
                                                status: e.target.value as "published" | "draft" | "cancelled" | "sold_out",
                                            })
                                        }
                                        className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold cursor-pointer"
                                    >
                                        <option value="published">Published (Live to users)</option>
                                        <option value="draft">Draft (Hidden)</option>
                                        <option value="sold_out">Sold Out</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date & Time Picker */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                        Concert Date & Time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={eventFormData.starts_at}
                                        onChange={(e) => setEventFormData({ ...eventFormData, starts_at: e.target.value })}
                                        className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                        Image URL / Poster Banner
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://images.unsplash.com/..."
                                        value={eventFormData.image_url}
                                        onChange={(e) => setEventFormData({ ...eventFormData, image_url: e.target.value })}
                                        className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Preset Quick Images */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] text-text-muted">Or pick a preset stage background:</span>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_EVENT_IMAGES.map((preset) => (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => setEventFormData({ ...eventFormData, image_url: preset.url })}
                                            className={`px-3 py-1 rounded-lg border text-[10px] font-semibold transition-colors cursor-pointer ${
                                                eventFormData.image_url === preset.url
                                                    ? "bg-gold/20 text-gold border-gold"
                                                    : "bg-white/5 text-text-secondary border-white/10 hover:border-white/20"
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                    Concert Bio & Details
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Write details about the concert tour, supporting acts, door opening times..."
                                    value={eventFormData.description}
                                    onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                                    className="w-full bg-bg-primary border border-white/10 rounded-xl p-4 text-text-primary focus:outline-none focus:border-gold transition-colors resize-none"
                                />
                            </div>

                            {/* Ticket Tiers Builder */}
                            <div className="space-y-3 pt-3 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-display text-base font-bold text-text-primary">
                                            Ticket Tiers & Inventory Pricing
                                        </h3>
                                        <p className="text-[11px] text-text-muted">
                                            Define the ticket tiers (e.g. General Admission, VIP, Balcony) available for this concert.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAddTicketType}
                                        className="font-body text-[11px] font-bold uppercase tracking-wider text-gold bg-gold/10 hover:bg-gold/20 border border-gold/30 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                                    >
                                        + Add Tier
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {eventFormData.ticket_types.map((tier, idx) => (
                                        <div
                                            key={idx}
                                            className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-bg-primary/70 border border-white/8 p-3.5 rounded-2xl"
                                        >
                                            <div className="sm:col-span-5 space-y-1">
                                                <label className="text-[10px] font-semibold text-text-muted uppercase">
                                                    Tier Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={tier.name}
                                                    onChange={(e) => handleTicketTypeChange(idx, "name", e.target.value)}
                                                    placeholder="e.g. General Admission"
                                                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-gold"
                                                    required
                                                />
                                            </div>

                                            <div className="sm:col-span-3 space-y-1">
                                                <label className="text-[10px] font-semibold text-text-muted uppercase">
                                                    Price ($ USD)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={tier.price}
                                                    onChange={(e) => handleTicketTypeChange(idx, "price", parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-gold font-semibold focus:outline-none focus:border-gold"
                                                    required
                                                />
                                            </div>

                                            <div className="sm:col-span-3 space-y-1">
                                                <label className="text-[10px] font-semibold text-text-muted uppercase">
                                                    Quantity Available
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={tier.quantity_available}
                                                    onChange={(e) => handleTicketTypeChange(idx, "quantity_available", parseInt(e.target.value, 10) || 0)}
                                                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-gold"
                                                    required
                                                />
                                            </div>

                                            <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTicketType(idx)}
                                                    className="w-8 h-8 rounded-lg bg-crimson/10 text-crimson hover:bg-crimson/20 border border-crimson/20 flex items-center justify-center cursor-pointer transition-colors"
                                                    title="Remove tier"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Footer Controls */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsEventModalOpen(false)}
                                    className="font-body text-xs font-semibold text-text-secondary hover:text-text-primary px-5 py-3 rounded-xl border border-white/10 cursor-pointer transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={eventFormSubmitting}
                                    className="font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover px-7 py-3 rounded-xl border-none cursor-pointer transition-all disabled:opacity-50 shadow-md hover:shadow-gold/20"
                                >
                                    {eventFormSubmitting ? "Saving Concert..." : editingEventId ? "Save Changes" : "Create Concert"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: CREATE / EDIT VENUE */}
            {/* ========================================================================= */}
            {isVenueModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-surface border border-white/15 rounded-3xl w-full max-w-xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <h2 className="font-display text-2xl font-bold text-text-primary">
                                    {editingVenueId ? "Edit Venue" : "Create New Venue"}
                                </h2>
                                <p className="font-body text-xs text-text-muted mt-0.5">
                                    Enter arena name, capacity, street address, and map coordinates.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsVenueModalOpen(false)}
                                className="w-9 h-9 rounded-full bg-white/6 hover:bg-white/12 text-text-muted hover:text-text-primary flex items-center justify-center border border-white/10 cursor-pointer transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveVenue} className="space-y-4 font-body text-xs">
                            <div className="space-y-1.5">
                                <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                    Venue / Stadium Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Madison Square Garden, The Forum"
                                    value={venueFormData.name}
                                    onChange={(e) => setVenueFormData({ ...venueFormData, name: e.target.value })}
                                    className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                    Street Address
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 4 Pennsylvania Plaza"
                                    value={venueFormData.address}
                                    onChange={(e) => setVenueFormData({ ...venueFormData, address: e.target.value })}
                                    className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. New York"
                                        value={venueFormData.city}
                                        onChange={(e) => setVenueFormData({ ...venueFormData, city: e.target.value })}
                                        className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. NY, CA"
                                        value={venueFormData.state}
                                        onChange={(e) => setVenueFormData({ ...venueFormData, state: e.target.value })}
                                        className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                        Capacity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 20000"
                                        value={venueFormData.capacity}
                                        onChange={(e) => setVenueFormData({ ...venueFormData, capacity: e.target.value ? parseInt(e.target.value, 10) : "" })}
                                        className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                        Latitude Coordinate
                                    </label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        placeholder="e.g. 40.7505"
                                        value={venueFormData.latitude}
                                        onChange={(e) => setVenueFormData({ ...venueFormData, latitude: e.target.value ? parseFloat(e.target.value) : "" })}
                                        className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                        Longitude Coordinate
                                    </label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        placeholder="e.g. -73.9934"
                                        value={venueFormData.longitude}
                                        onChange={(e) => setVenueFormData({ ...venueFormData, longitude: e.target.value ? parseFloat(e.target.value) : "" })}
                                        className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-semibold text-text-secondary uppercase tracking-wider text-[11px]">
                                    Venue Photo URL
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://images.unsplash.com/..."
                                    value={venueFormData.image_url}
                                    onChange={(e) => setVenueFormData({ ...venueFormData, image_url: e.target.value })}
                                    className="w-full bg-bg-primary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsVenueModalOpen(false)}
                                    className="font-body text-xs font-semibold text-text-secondary hover:text-text-primary px-5 py-3 rounded-xl border border-white/10 cursor-pointer transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={venueFormSubmitting}
                                    className="font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover px-7 py-3 rounded-xl border-none cursor-pointer transition-all disabled:opacity-50 shadow-md hover:shadow-gold/20"
                                >
                                    {venueFormSubmitting ? "Saving Venue..." : editingVenueId ? "Save Changes" : "Create Venue"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: DELETE EVENT CONFIRMATION */}
            {/* ========================================================================= */}
            {eventToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-surface border border-crimson/40 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 rounded-full bg-crimson/15 border border-crimson/30 text-crimson flex items-center justify-center mx-auto">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="font-display text-xl font-bold text-text-primary">
                                Delete Concert?
                            </h2>
                            <p className="font-body text-xs text-text-muted leading-relaxed">
                                Are you sure you want to permanently delete <strong className="text-text-primary">"{eventToDelete.artist} — {eventToDelete.title}"</strong>?
                                All linked ticket tiers and holds will be removed.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => setEventToDelete(null)}
                                className="flex-1 font-body text-xs font-semibold text-text-secondary hover:text-text-primary bg-white/6 hover:bg-white/12 py-3 rounded-xl border border-white/10 cursor-pointer transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleConfirmDeleteEvent}
                                disabled={deleteLoading}
                                className="flex-1 font-body text-xs font-bold uppercase tracking-wider text-white bg-crimson hover:bg-crimson/80 py-3 rounded-xl border-none cursor-pointer transition-all disabled:opacity-50 shadow-md shadow-crimson/20"
                            >
                                {deleteLoading ? "Deleting..." : "Confirm Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: DELETE VENUE CONFIRMATION */}
            {/* ========================================================================= */}
            {venueToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-surface border border-crimson/40 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 rounded-full bg-crimson/15 border border-crimson/30 text-crimson flex items-center justify-center mx-auto">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="font-display text-xl font-bold text-text-primary">
                                Delete Venue?
                            </h2>
                            <p className="font-body text-xs text-text-muted leading-relaxed">
                                Are you sure you want to remove <strong className="text-text-primary">"{venueToDelete.name}"</strong>?
                                Any events hosted at this venue will also be affected.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => setVenueToDelete(null)}
                                className="flex-1 font-body text-xs font-semibold text-text-secondary hover:text-text-primary bg-white/6 hover:bg-white/12 py-3 rounded-xl border border-white/10 cursor-pointer transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleConfirmDeleteVenue}
                                disabled={deleteLoading}
                                className="flex-1 font-body text-xs font-bold uppercase tracking-wider text-white bg-crimson hover:bg-crimson/80 py-3 rounded-xl border-none cursor-pointer transition-all disabled:opacity-50 shadow-md shadow-crimson/20"
                            >
                                {deleteLoading ? "Deleting..." : "Confirm Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
