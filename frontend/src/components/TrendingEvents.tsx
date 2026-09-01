import { useState, useEffect, useRef } from "react";
import { type EventItem, fetchEventsApi } from "../api/events";

function EventCard({ event, index }: { event: EventItem; index: number }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add("opacity-100", "translate-y-0");
                    el.classList.remove("opacity-0", "translate-y-8");
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className="group bg-surface border border-white/6 hover:border-gold/20 rounded-xl overflow-hidden cursor-pointer transition-all duration-350 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)] opacity-0 translate-y-8"
            style={{ transitionDelay: `${index * 120}ms` }}
            id={`event-card-${event.id}`}
        >
            {/* Image Wrap */}
            <div className="relative aspect-[16/9] sm:aspect-[3/3.5] overflow-hidden">
                <img
                    src={
                        event.image_url ||
                        "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80"
                    }
                    alt={`${event.artist} live concert`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-106"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080e]/80 via-transparent to-transparent" />
            </div>

            {/* Body */}
            <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display text-lg font-bold tracking-tight text-text-primary group-hover:text-gold transition-colors duration-200 truncate">
                        {event.artist}
                    </h3>
                </div>
                <span className="inline-block font-body text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-full mb-2">
                    {event.genre}
                </span>
                <p className="font-body text-xs sm:text-sm text-text-muted mb-1 truncate">
                    {event.title}
                </p>
                <p className="font-body text-xs text-text-muted/80 mb-4 truncate">
                    {event.venue.name}, {event.venue.city}
                </p>

                <div className="flex items-center justify-between mb-4">
                    <span className="font-body text-xs text-text-secondary flex items-center gap-1.5">
                        <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            className="w-3.5 h-3.5 text-text-muted"
                            aria-hidden="true"
                        >
                            <rect
                                x="2"
                                y="3"
                                width="12"
                                height="11"
                                rx="2"
                                stroke="currentColor"
                                strokeWidth="1.2"
                            />
                            <path
                                d="M2 7h12"
                                stroke="currentColor"
                                strokeWidth="1.2"
                            />
                            <path
                                d="M5.5 1.5v3M10.5 1.5v3"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                            />
                        </svg>
                        {event.formatted_date}
                    </span>
                    <span className="font-display text-sm font-bold text-gold">
                        From ${event.min_price}
                    </span>
                </div>

                <button
                    className="w-full flex items-center justify-center gap-2 font-body text-xs font-bold tracking-wider uppercase text-text-primary group-hover:text-bg-primary bg-white/4 hover:bg-gold group-hover:bg-gold border border-white/8 hover:border-gold group-hover:border-gold rounded-lg p-3 cursor-pointer transition-all duration-200"
                    id={`get-tickets-${event.id}`}
                >
                    Get Tickets
                    <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden="true"
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
}

export default function TrendingEvents({
    onViewAllClick,
}: {
    onViewAllClick?: () => void;
}) {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadEvents() {
            try {
                const res = await fetchEventsApi();
                setEvents(res.events.slice(0, 4));
            } catch (err) {
                console.error("Failed to load trending events:", err);
                setError("Unable to connect to live events service.");
            } finally {
                setLoading(false);
            }
        }

        loadEvents();
    }, []);

    return (
        <section
            className="bg-bg-primary py-16 sm:py-24 lg:py-28 px-5 md:px-10 lg:px-12"
            id="trending-section"
        >
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
                    <div>
                        <h2
                            className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-text-primary mb-2"
                            id="trending-title"
                        >
                            Trending This Week
                        </h2>
                        <p className="font-body text-sm sm:text-base text-text-muted">
                            The hottest shows people are booking right now
                        </p>
                    </div>
                    <button
                        onClick={onViewAllClick}
                        className="font-body text-xs sm:text-sm font-semibold tracking-wider uppercase text-gold hover:text-gold-hover bg-transparent border-none cursor-pointer inline-flex items-center gap-2 hover:gap-3 transition-all duration-250 shrink-0"
                        id="see-all-link"
                    >
                        See All Events
                        <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            className="w-4 h-4"
                            aria-hidden="true"
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

                {/* Grid or Skeleton */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((n) => (
                            <div
                                key={n}
                                className="bg-surface/50 border border-white/5 rounded-xl overflow-hidden p-4 animate-pulse h-96"
                            />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-12 bg-surface/30 rounded-xl border border-white/5">
                        <p className="font-body text-sm text-text-muted">
                            {error}
                        </p>
                    </div>
                ) : (
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        id="trending-grid"
                    >
                        {events.map((event, i) => (
                            <EventCard key={event.id} event={event} index={i} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
