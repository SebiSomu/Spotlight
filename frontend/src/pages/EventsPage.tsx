import { useState, useEffect } from "react";
import { type EventItem, fetchEventsApi } from "../api/events";

const GENRES = [
    "All Genres",
    "Reggaeton & Latin",
    "Hip-Hop & Rap",
    "Pop",
    "R&B",
    "Alternative & Rock",
    "Electronic",
];

const GENRE_COLORS: Record<string, string> = {
    "All Genres":          "text-text-primary border-white/15 bg-white/5 hover:border-gold/40 hover:text-gold",
    "Reggaeton & Latin":   "text-[#f97316] border-[#f97316]/25 bg-[#f97316]/8 hover:bg-[#f97316]/15",
    "Hip-Hop & Rap":       "text-[#a78bfa] border-[#a78bfa]/25 bg-[#a78bfa]/8 hover:bg-[#a78bfa]/15",
    "Pop":                 "text-[#ec4899] border-[#ec4899]/25 bg-[#ec4899]/8 hover:bg-[#ec4899]/15",
    "R&B":                 "text-[#22d3ee] border-[#22d3ee]/25 bg-[#22d3ee]/8 hover:bg-[#22d3ee]/15",
    "Alternative & Rock":  "text-[#86efac] border-[#86efac]/25 bg-[#86efac]/8 hover:bg-[#86efac]/15",
    "Electronic":          "text-[#38bdf8] border-[#38bdf8]/25 bg-[#38bdf8]/8 hover:bg-[#38bdf8]/15",
};

const GENRE_ACTIVE: Record<string, string> = {
    "All Genres":          "!text-bg-primary !bg-gold !border-gold shadow-[0_0_14px_rgba(232,168,56,0.35)]",
    "Reggaeton & Latin":   "!text-bg-primary !bg-[#f97316] !border-[#f97316] shadow-[0_0_14px_rgba(249,115,22,0.35)]",
    "Hip-Hop & Rap":       "!text-bg-primary !bg-[#a78bfa] !border-[#a78bfa] shadow-[0_0_14px_rgba(167,139,250,0.35)]",
    "Pop":                 "!text-bg-primary !bg-[#ec4899] !border-[#ec4899] shadow-[0_0_14px_rgba(236,72,153,0.35)]",
    "R&B":                 "!text-bg-primary !bg-[#22d3ee] !border-[#22d3ee] shadow-[0_0_14px_rgba(34,211,238,0.35)]",
    "Alternative & Rock":  "!text-bg-primary !bg-[#86efac] !border-[#86efac] shadow-[0_0_14px_rgba(134,239,172,0.35)]",
    "Electronic":          "!text-bg-primary !bg-[#38bdf8] !border-[#38bdf8] shadow-[0_0_14px_rgba(56,189,248,0.35)]",
};

const GENRE_BADGE: Record<string, string> = {
    "Reggaeton & Latin":   "text-[#f97316] bg-[#f97316]/10 border-[#f97316]/25",
    "Hip-Hop & Rap":       "text-[#a78bfa] bg-[#a78bfa]/10 border-[#a78bfa]/25",
    "Pop":                 "text-[#ec4899] bg-[#ec4899]/10 border-[#ec4899]/25",
    "R&B":                 "text-[#22d3ee] bg-[#22d3ee]/10 border-[#22d3ee]/25",
    "Alternative & Rock":  "text-[#86efac] bg-[#86efac]/10 border-[#86efac]/25",
    "Electronic":          "text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/25",
};

export default function EventsPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [date, setDate] = useState("");
    const [genre, setGenre] = useState("All Genres");
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            async function load() {
                setLoading(true);
                try {
                    const apiGenre = genre === "All Genres" ? undefined : genre;
                    const res = await fetchEventsApi({ search, date, genre: apiGenre });
                    setEvents(res.events);
                    setTotalCount(res.total_count);
                } catch (err) {
                    console.error("Failed to fetch events:", err);
                } finally {
                    setLoading(false);
                }
            }

            load();
        }, 200);

        return () => clearTimeout(timer);
    }, [search, date, genre]);

    const clearFilters = () => {
        setSearch("");
        setDate("");
        setGenre("All Genres");
    };

    const hasActiveFilter = search || date || genre !== "All Genres";

    return (
        <section
            className="min-h-screen bg-bg-primary pt-28 pb-24 px-5 md:px-10 lg:px-12"
            id="events-page"
        >
            <div className="max-w-7xl mx-auto">

                {/* Page Header */}
                <div className="mb-10">
                    <span className="font-body text-xs font-bold tracking-widest uppercase text-gold mb-2 block">
                        Live Concert Catalog
                    </span>
                    <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-text-primary mb-3">
                        Discover All Shows
                    </h1>
                    <p className="font-body text-sm sm:text-base text-text-muted max-w-xl">
                        Filter by artist, venue, city, or performance date to find your next night out.
                    </p>
                </div>

                {/* Search + Date row */}
                <div className="bg-surface/80 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6 backdrop-blur-md">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        {/* Search */}
                        <div className="relative col-span-1 md:col-span-2">
                            <svg
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                                viewBox="0 0 20 20"
                                fill="none"
                            >
                                <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M13.5 13.5L17.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search artist, show, venue or city…"
                                className="w-full bg-bg-primary/90 border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl pl-11 pr-10 py-3 font-body text-sm text-text-primary placeholder:text-text-muted/60 transition-colors"
                                id="events-search-input"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 bg-transparent border-none cursor-pointer text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Date + Clear */}
                        <div className="flex items-center gap-3">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="flex-1 bg-bg-primary/90 border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl px-4 py-3 font-body text-sm text-text-primary transition-colors"
                                id="events-date-input"
                            />
                            {hasActiveFilter && (
                                <button
                                    onClick={clearFilters}
                                    className="font-body text-xs font-semibold uppercase tracking-wider text-crimson hover:bg-crimson/10 px-3.5 py-3 rounded-xl border border-crimson/30 cursor-pointer transition-colors whitespace-nowrap"
                                    id="clear-filters-btn"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results count */}
                    <div className="mt-4 pt-4 border-t border-white/6 font-body text-xs text-text-muted flex items-center justify-between">
                        <span>
                            Showing{" "}
                            <strong className="text-gold">{totalCount}</strong> published shows
                        </span>
                        {hasActiveFilter && (
                            <span className="text-text-muted/60 text-[11px]">
                                {[
                                    search && `"${search}"`,
                                    genre !== "All Genres" && genre,
                                    date && `on ${date}`,
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </span>
                        )}
                    </div>
                </div>

                {/* Genre Filter Pills */}
                <div className="flex flex-wrap gap-2 mb-8" id="genre-filter-pills">
                    {GENRES.map((g) => {
                        const isActive = genre === g;
                        return (
                            <button
                                key={g}
                                onClick={() => setGenre(g)}
                                className={`font-body text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border cursor-pointer transition-all duration-200 ${
                                    isActive
                                        ? (GENRE_ACTIVE[g] ?? "!text-bg-primary !bg-gold !border-gold")
                                        : (GENRE_COLORS[g] ?? "text-text-muted border-white/10 bg-white/5")
                                }`}
                                id={`genre-pill-${g.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                            >
                                {g}
                            </button>
                        );
                    })}
                </div>

                {/* Events Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div
                                key={n}
                                className="bg-surface/50 border border-white/5 rounded-xl overflow-hidden h-96 animate-pulse"
                            />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20 bg-surface/30 border border-white/5 rounded-2xl">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-2xl">
                            🔍
                        </div>
                        <h3 className="font-display text-xl font-bold text-text-primary mb-2">
                            No shows match your criteria
                        </h3>
                        <p className="font-body text-sm text-text-muted max-w-sm mx-auto mb-6">
                            Try clearing the filters or picking a different genre.
                        </p>
                        <button
                            onClick={clearFilters}
                            className="font-body text-xs font-bold tracking-wider uppercase text-bg-primary bg-gold hover:bg-gold-hover px-6 py-2.5 rounded-lg border-none cursor-pointer transition-all"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        id="events-grid"
                    >
                        {events.map((event) => {
                            const badgeCls =
                                GENRE_BADGE[event.genre] ??
                                "text-gold bg-gold/10 border-gold/25";

                            return (
                                <div
                                    key={event.id}
                                    className="group bg-surface border border-white/6 hover:border-gold/20 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col"
                                    id={`event-item-${event.id}`}
                                >
                                    {/* Image */}
                                    <div className="relative aspect-[16/9] overflow-hidden shrink-0">
                                        <img
                                            src={
                                                event.image_url ||
                                                "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80"
                                            }
                                            alt={event.artist}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#08080e]/90 via-transparent to-transparent" />

                                        {/* Genre pill on image */}
                                        <span
                                            className={`absolute top-3 left-3 font-body text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-sm ${badgeCls}`}
                                        >
                                            {event.genre}
                                        </span>

                                        {/* Price badge */}
                                        <span className="absolute top-3 right-3 font-display text-xs font-bold text-gold bg-bg-primary/90 backdrop-blur-sm border border-gold/30 px-3 py-1 rounded-full">
                                            From ${event.min_price}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-center gap-2 mb-2 font-body text-xs text-text-secondary">
                                            <span className="font-semibold text-gold">
                                                {event.formatted_date}
                                            </span>
                                            <span className="text-text-muted">·</span>
                                            <span>{event.formatted_time}</span>
                                        </div>

                                        <h3 className="font-display text-xl font-bold tracking-tight text-text-primary mb-1 group-hover:text-gold transition-colors">
                                            {event.artist}
                                        </h3>
                                        <p className="font-body text-sm font-medium text-text-secondary mb-3">
                                            {event.title}
                                        </p>
                                        <p className="font-body text-xs text-text-muted leading-relaxed line-clamp-2 mb-4 flex-1">
                                            {event.description}
                                        </p>

                                        {/* Venue row */}
                                        <div className="flex items-center gap-2 pt-4 border-t border-white/6 font-body text-xs text-text-muted mb-5">
                                            <svg
                                                className="w-4 h-4 text-gold shrink-0"
                                                viewBox="0 0 16 16"
                                                fill="none"
                                            >
                                                <path
                                                    d="M8 1.5C5.2 1.5 3 3.7 3 6.5C3 10.2 8 14.5 8 14.5C8 14.5 13 10.2 13 6.5C13 3.7 10.8 1.5 8 1.5ZM8 8C7.2 8 6.5 7.3 6.5 6.5C6.5 5.7 7.2 5 8 5C8.8 5 9.5 5.7 9.5 6.5C9.5 7.3 8.8 8 8 8Z"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                            <span className="truncate">
                                                <strong className="text-text-secondary">
                                                    {event.venue.name}
                                                </strong>{" "}
                                                — {event.venue.city}, {event.venue.state}
                                            </span>
                                        </div>

                                        {/* CTA Button */}
                                        <button
                                            className="w-full font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover py-3 rounded-lg border-none cursor-pointer transition-all shadow-md hover:shadow-gold/20 flex items-center justify-center gap-2"
                                            id={`buy-tickets-btn-${event.id}`}
                                        >
                                            Select Seats
                                            <svg
                                                className="w-3.5 h-3.5"
                                                viewBox="0 0 16 16"
                                                fill="none"
                                            >
                                                <path
                                                    d="M3 8h10M9 4l4 4-4 4"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
