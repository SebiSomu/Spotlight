import { useEffect, useRef } from "react";
import event1 from "../assets/crowd-1.jpg";
import event2 from "../assets/crowd-2.jpg";
import event3 from "../assets/crowd-3.jpg";
import event4 from "../assets/crowd-4.jpg";

interface EventData {
    id: number;
    image: string;
    artist: string;
    venue: string;
    date: string;
    price: number;
    tag?: string;
}

const events: EventData[] = [
    {
        id: 1,
        image: event1,
        artist: "Marcus Vane",
        venue: "The Roxy, Los Angeles",
        date: "Sep 14, 2026",
        price: 75,
        tag: "Selling Fast",
    },
    {
        id: 2,
        image: event2,
        artist: "Neon Drift",
        venue: "Echostage, Washington DC",
        date: "Sep 21, 2026",
        price: 120,
    },
    {
        id: 3,
        image: event3,
        artist: "The Rust & Ruin",
        venue: "Bowery Ballroom, NYC",
        date: "Oct 3, 2026",
        price: 45,
        tag: "Intimate Show",
    },
    {
        id: 4,
        image: event4,
        artist: "Aria Blaze",
        venue: "Madison Square Garden, NYC",
        date: "Oct 18, 2026",
        price: 185,
        tag: "Almost Sold Out",
    },
];

function EventCard({ event, index }: { event: EventData; index: number }) {
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
                    src={event.image}
                    alt={`${event.artist} live concert`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-106"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080e]/80 via-transparent to-transparent" />
                {event.tag && (
                    <span className="absolute top-3 left-3 font-body text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-bg-primary bg-crimson px-2.5 py-1 rounded shadow-md">
                        {event.tag}
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="p-5">
                <h3 className="font-display text-lg font-bold tracking-tight text-text-primary mb-1 group-hover:text-gold transition-colors duration-200">
                    {event.artist}
                </h3>
                <p className="font-body text-xs sm:text-sm text-text-muted mb-4 truncate">
                    {event.venue}
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
                        {event.date}
                    </span>
                    <span className="font-display text-sm font-bold text-gold">
                        From ${event.price}
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

export default function TrendingEvents() {
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
                    <a
                        href="#events"
                        className="font-body text-xs sm:text-sm font-semibold tracking-wider uppercase text-gold hover:text-gold-hover no-underline inline-flex items-center gap-2 hover:gap-3 transition-all duration-250 shrink-0"
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
                    </a>
                </div>

                {/* Grid */}
                <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    id="trending-grid"
                >
                    {events.map((event, i) => (
                        <EventCard key={event.id} event={event} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
