import { useState } from "react";
import heroBg from "../assets/hero-bg.jpg";

export default function Hero() {
    const [query, setQuery] = useState("");

    return (
        <section
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
            id="hero-section"
        >
            {/* Background & Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src={heroBg}
                    alt="Massive concert crowd with dramatic stage lighting"
                    className="w-full h-full object-cover object-[center_30%]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#08080e]/60 via-[#08080e]/35 via-70% to-[#08080e]/95" />
            </div>

            {/* Hero Content */}
            <div className="relative z-10 text-center pt-32 pb-20 px-5 sm:px-10 lg:px-16 max-w-4xl w-full mx-auto">
                {/* Badge */}
                <div
                    className="inline-flex items-center gap-2 font-body text-xs sm:text-sm font-semibold tracking-widest uppercase text-gold mb-7 animate-fade-in-down"
                    id="hero-badge"
                >
                    <span className="w-2 h-2 bg-crimson rounded-full animate-pulse-dot" />
                    Live events near you
                </div>

                {/* Headline */}
                <h1
                    className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-text-primary mb-6 animate-fade-in-up [animation-delay:150ms]"
                    id="hero-headline"
                >
                    Every Great Night
                    <br />
                    <span className="bg-gradient-to-r from-gold via-[#f0c66e] to-gold bg-clip-text text-transparent">
                        Starts With a Ticket
                    </span>
                </h1>

                {/* Subheadline */}
                <p
                    className="font-body text-base sm:text-lg lg:text-xl leading-relaxed text-text-primary mb-10 max-w-lg mx-auto animate-fade-in-up [animation-delay:300ms]"
                    id="hero-subheadline"
                >
                    Discover live shows, lock in your seats, feel the bass.
                </p>

                {/* Search Form */}
                <form
                    className="mb-12 animate-fade-in-up [animation-delay:450ms]"
                    id="hero-search-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                    }}
                >
                    <div className="flex flex-col sm:flex-row items-center bg-[#12121a]/80 border border-white/10 focus-within:border-gold/40 focus-within:ring-4 focus-within:ring-gold/10 rounded-xl p-1.5 sm:pl-5 max-w-xl mx-auto transition-all duration-250">
                        <svg
                            className="w-4.5 h-4.5 text-text-muted shrink-0 max-sm:hidden"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <circle
                                cx="9"
                                cy="9"
                                r="6.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <path
                                d="M13.5 13.5L17.5 17.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none font-body text-sm sm:text-base text-text-primary placeholder:text-text-muted/60 px-3 py-3 w-full max-sm:text-center"
                            placeholder="Search artists, venues, or events…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            id="hero-search-input"
                            aria-label="Search artists, venues, or events"
                        />
                        <button
                            type="submit"
                            className="w-full sm:w-auto font-body text-xs sm:text-sm font-bold tracking-wider uppercase text-bg-primary bg-gold hover:bg-gold-hover border-none rounded-lg px-7 py-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shadow-md hover:shadow-gold/20"
                            id="find-shows-btn"
                        >
                            Find Shows
                        </button>
                    </div>
                </form>

                {/* Stats */}
                <div
                    className="flex items-center justify-center gap-5 sm:gap-8 animate-fade-in-up [animation-delay:600ms]"
                    id="hero-stats"
                >
                    <div className="flex flex-col gap-1">
                        <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                            2,400+
                        </span>
                        <span className="font-body text-[11px] sm:text-xs font-medium tracking-wider uppercase text-text-muted">
                            Live Events
                        </span>
                    </div>
                    <div className="w-px h-9 bg-white/10" />
                    <div className="flex flex-col gap-1">
                        <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                            850+
                        </span>
                        <span className="font-body text-[11px] sm:text-xs font-medium tracking-wider uppercase text-text-muted">
                            Venues
                        </span>
                    </div>
                    <div className="w-px h-9 bg-white/10" />
                    <div className="flex flex-col gap-1">
                        <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                            1.2M
                        </span>
                        <span className="font-body text-[11px] sm:text-xs font-medium tracking-wider uppercase text-text-muted">
                            Tickets Sold
                        </span>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div
                className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 z-10 animate-fade-in-up [animation-delay:900ms]"
                id="scroll-indicator"
            >
                <span className="font-body text-[11px] font-semibold tracking-widest uppercase text-text-muted">
                    Explore
                </span>
                <div className="w-px h-10 bg-gradient-to-b from-gold to-transparent animate-scroll-pulse" />
            </div>
        </section>
    );
}
