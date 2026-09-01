import { useState, useEffect, useCallback } from "react";
import { type EventItem, type TicketType, fetchEventByIdApi } from "../api/events";
import { type Hold, createHoldApi, releaseHoldApi } from "../api/holds";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import StadiumSeatMap from "../components/StadiumSeatMap";

interface EventDetailPageProps {
    eventId: number;
    onBack: () => void;
}

function formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function EventDetailPage({ eventId, onBack }: EventDetailPageProps) {
    const [event, setEvent] = useState<EventItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Hold state
    const [activeHold, setActiveHold] = useState<Hold | null>(null);
    const [holdLoading, setHoldLoading] = useState(false);
    const [holdError, setHoldError] = useState<string | null>(null);
    const [secondsRemaining, setSecondsRemaining] = useState(0);

    const { toast } = useToast();
    const { user, openModal } = useAuth();

    useEffect(() => {
        async function loadEvent() {
            setLoading(true);
            try {
                const res = await fetchEventByIdApi(eventId);
                setEvent(res.event);
                if (res.event.ticket_types && res.event.ticket_types.length > 0) {
                    setSelectedTicketTypeId(res.event.ticket_types[0].id);
                }
            } catch (err) {
                console.error("Failed to load event details:", err);
                setError("Unable to load details for this concert event.");
            } finally {
                setLoading(false);
            }
        }
        loadEvent();
    }, [eventId]);

    // Countdown timer for active hold
    useEffect(() => {
        if (!activeHold) return;

        setSecondsRemaining(activeHold.seconds_remaining);

        const interval = setInterval(() => {
            setSecondsRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setActiveHold(null);
                    setHoldError(null);
                    toast.error(
                        "Hold Expired",
                        "Your ticket reservation has expired. Please select tickets again."
                    );
                    // Re-fetch event to get updated quantities
                    fetchEventByIdApi(eventId).then((res) => setEvent(res.event)).catch(() => {});
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [activeHold, eventId, toast]);

    const selectedTicketType: TicketType | undefined = event?.ticket_types?.find(
        (tt) => tt.id === selectedTicketTypeId
    );

    const handleQuantityChange = (delta: number) => {
        if (!selectedTicketType) return;
        const newQty = quantity + delta;
        if (newQty >= 1 && newQty <= Math.min(8, selectedTicketType.quantity_remaining)) {
            setQuantity(newQty);
        }
    };

    const handleSelectSection = useCallback((ticketTypeId: number) => {
        setSelectedTicketTypeId(ticketTypeId);
        setQuantity(1);
        setHoldError(null);
    }, []);

    const handleReserveTickets = async () => {
        if (!selectedTicketType || !event) return;

        if (!user) {
            openModal("login");
            toast.info("Sign In Required", "Please sign in to reserve tickets.");
            return;
        }

        setHoldLoading(true);
        setHoldError(null);

        try {
            const res = await createHoldApi({
                ticket_type_id: selectedTicketType.id,
                quantity,
            });
            setActiveHold(res.hold);
            toast.success(
                "Tickets Reserved!",
                `${quantity}x ${selectedTicketType.name} held for 10 minutes.`
            );
            // Update local quantity_remaining to reflect the hold
            setEvent((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    ticket_types: prev.ticket_types.map((tt) =>
                        tt.id === selectedTicketType.id
                            ? { ...tt, quantity_remaining: tt.quantity_remaining - quantity }
                            : tt
                    ),
                };
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Could not reserve tickets.";
            setHoldError(message);
            toast.error("Hold Failed", message);
        } finally {
            setHoldLoading(false);
        }
    };

    const handleReleaseHold = async () => {
        if (!activeHold) return;
        setHoldLoading(true);
        try {
            await releaseHoldApi(activeHold.id);
            setActiveHold(null);
            setHoldError(null);
            toast.info("Hold Released", "Your reservation has been cancelled and tickets returned.");
            // Re-fetch event to restore quantities
            const res = await fetchEventByIdApi(eventId);
            setEvent(res.event);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Could not release hold.";
            toast.error("Error", message);
        } finally {
            setHoldLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary pt-28 pb-24 px-5 md:px-10 lg:px-12">
                <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
                    <div className="h-80 bg-surface/50 rounded-2xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="h-8 bg-surface/50 rounded w-1/3" />
                            <div className="h-32 bg-surface/50 rounded" />
                        </div>
                        <div className="h-64 bg-surface/50 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-bg-primary pt-28 pb-24 px-5 text-center">
                <div className="max-w-md mx-auto bg-surface/40 border border-white/10 rounded-2xl p-8">
                    <h2 className="font-display text-xl font-bold text-text-primary mb-2">
                        Event Not Found
                    </h2>
                    <p className="font-body text-sm text-text-muted mb-6">
                        {error || "The requested show details could not be retrieved."}
                    </p>
                    <button
                        onClick={onBack}
                        className="font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover px-6 py-2.5 rounded-lg border-none cursor-pointer transition-all"
                    >
                        Back To Events
                    </button>
                </div>
            </div>
        );
    }

    const totalPrice = selectedTicketType ? (selectedTicketType.price * quantity).toFixed(2) : "0.00";

    return (
        <div className="min-h-screen bg-bg-primary pt-24 pb-24 px-5 md:px-10 lg:px-12" id="event-detail-page">
            <div className="max-w-6xl mx-auto">
                {/* Back button */}
                <button
                    onClick={onBack}
                    className="font-body text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-gold bg-transparent border-none cursor-pointer inline-flex items-center gap-2 mb-6 transition-colors"
                    id="back-to-events-btn"
                >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back to All Events
                </button>

                {/* Hero Header */}
                <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-10 bg-surface">
                    <div className="relative aspect-[21/9] sm:aspect-[24/9] md:aspect-[30/9] overflow-hidden bg-black/40">
                        <img
                            src={event.image_url || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80"}
                            alt={event.artist}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#08080e] via-[#08080e]/60 to-transparent" />
                    </div>

                    <div className="p-6 sm:p-10 -mt-20 relative z-10">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className="font-body text-xs font-bold uppercase tracking-wider text-gold bg-gold/10 border border-gold/25 px-3 py-1 rounded-full backdrop-blur-md">
                                {event.genre}
                            </span>
                            <span className="font-body text-xs font-semibold text-text-secondary bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                                {event.status.toUpperCase()}
                            </span>
                        </div>

                        <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary mb-2">
                            {event.artist}
                        </h1>
                        <p className="font-display text-lg sm:text-2xl font-semibold text-gold mb-6">
                            {event.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 font-body text-xs sm:text-sm text-text-secondary pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gold shrink-0" viewBox="0 0 16 16" fill="none">
                                    <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
                                    <path d="M2 7h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                                <span>{event.formatted_date} at {event.formatted_time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gold shrink-0" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 1.5C5.2 1.5 3 3.7 3 6.5C3 10.2 8 14.5 8 14.5C8 14.5 13 10.2 13 6.5C13 3.7 10.8 1.5 8 1.5ZM8 8C7.2 8 6.5 7.3 6.5 6.5C6.5 5.7 7.2 5 8 5C8.8 5 9.5 5.7 9.5 6.5C9.5 7.3 8.8 8 8 8Z" fill="currentColor" />
                                </svg>
                                <span><strong>{event.venue.name}</strong> — {event.venue.city}, {event.venue.state}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Description, Venue, Stadium Map */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Description */}
                        <div className="bg-surface/80 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
                            <h2 className="font-display text-xl font-bold text-text-primary mb-4">
                                About The Event
                            </h2>
                            <p className="font-body text-sm sm:text-base text-text-muted leading-relaxed">
                                {event.description}
                            </p>
                        </div>

                        {/* Stadium Seat Map */}
                        <div className="bg-surface/80 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
                            <StadiumSeatMap
                                ticketTypes={event.ticket_types}
                                selectedTicketTypeId={selectedTicketTypeId}
                                onSelectSection={handleSelectSection}
                            />
                        </div>

                        {/* Venue Info */}
                        <div className="bg-surface/80 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
                            <h2 className="font-display text-xl font-bold text-text-primary mb-4">
                                Venue Information
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-body text-xs sm:text-sm">
                                <div className="p-4 bg-bg-primary/60 rounded-xl border border-white/5">
                                    <span className="text-text-muted text-xs block mb-1">Venue Name</span>
                                    <span className="font-bold text-text-primary">{event.venue.name}</span>
                                </div>
                                <div className="p-4 bg-bg-primary/60 rounded-xl border border-white/5">
                                    <span className="text-text-muted text-xs block mb-1">Location</span>
                                    <span className="font-bold text-text-primary">{event.venue.location}</span>
                                </div>
                                {event.venue.address && (
                                    <div className="p-4 bg-bg-primary/60 rounded-xl border border-white/5">
                                        <span className="text-text-muted text-xs block mb-1">Street Address</span>
                                        <span className="font-bold text-text-primary">{event.venue.address}</span>
                                    </div>
                                )}
                                {event.venue.capacity && (
                                    <div className="p-4 bg-bg-primary/60 rounded-xl border border-white/5">
                                        <span className="text-text-muted text-xs block mb-1">Total Capacity</span>
                                        <span className="font-bold text-gold">{event.venue.capacity.toLocaleString()} seats</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Ticket Selector or Active Hold */}
                    <div className="lg:col-span-5 sticky top-24">

                        {/* ACTIVE HOLD PANEL */}
                        {activeHold ? (
                            <div className="bg-surface border border-gold/30 rounded-2xl p-6 shadow-2xl space-y-5" id="active-hold-panel">
                                {/* Hold header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-display text-lg font-bold text-gold mb-0.5">
                                            Tickets Reserved
                                        </h3>
                                        <p className="font-body text-xs text-text-muted">
                                            Complete checkout before time runs out
                                        </p>
                                    </div>
                                    {/* Countdown */}
                                    <div className={`font-display text-2xl font-bold tabular-nums ${secondsRemaining <= 60 ? "text-crimson" : "text-gold"}`} id="hold-countdown">
                                        {formatCountdown(secondsRemaining)}
                                    </div>
                                </div>

                                {/* Countdown bar */}
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${secondsRemaining <= 60 ? "bg-crimson" : "bg-gold"}`}
                                        style={{ width: `${(secondsRemaining / 600) * 100}%` }}
                                    />
                                </div>

                                {/* Hold summary */}
                                <div className="bg-bg-primary/60 rounded-xl border border-white/8 p-4 space-y-3">
                                    <div className="flex justify-between font-body text-sm">
                                        <span className="text-text-muted">Tier</span>
                                        <span className="font-semibold text-text-primary text-right max-w-[55%] truncate">{activeHold.ticket_type_name}</span>
                                    </div>
                                    <div className="flex justify-between font-body text-sm">
                                        <span className="text-text-muted">Quantity</span>
                                        <span className="font-semibold text-text-primary">{activeHold.quantity} tickets</span>
                                    </div>
                                    <div className="flex justify-between font-body text-sm pt-2 border-t border-white/8">
                                        <span className="font-bold text-text-primary">Total</span>
                                        <span className="font-display text-xl font-bold text-gold">${activeHold.total_price.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Checkout CTA */}
                                <button
                                    className="w-full font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover py-4 rounded-xl border-none cursor-pointer transition-all shadow-lg hover:shadow-gold/20 flex items-center justify-center gap-2"
                                    id="proceed-to-checkout-btn"
                                >
                                    Proceed to Checkout
                                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>

                                {/* Release hold */}
                                <button
                                    onClick={handleReleaseHold}
                                    disabled={holdLoading}
                                    className="w-full font-body text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-crimson bg-transparent border border-white/10 hover:border-crimson/30 py-2.5 rounded-xl cursor-pointer transition-all disabled:opacity-50"
                                    id="release-hold-btn"
                                >
                                    {holdLoading ? "Releasing..." : "Cancel & Release Hold"}
                                </button>
                            </div>

                        ) : (
                            /* TICKET SELECTION PANEL */
                            <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
                                <div>
                                    <h3 className="font-display text-xl font-bold text-text-primary mb-1">
                                        Select Ticket Tier
                                    </h3>
                                    <p className="font-body text-xs text-text-muted">
                                        Choose your preferred seating area and ticket quantity.
                                    </p>
                                </div>

                                {/* Ticket Types List */}
                                <div className="space-y-3" id="ticket-types-list">
                                    {event.ticket_types && event.ticket_types.length > 0 ? (
                                        event.ticket_types.map((tt) => {
                                            const isSelected = selectedTicketTypeId === tt.id;
                                            const isLowStock = tt.quantity_remaining > 0 && tt.quantity_remaining < 100;

                                            return (
                                                <div
                                                    key={tt.id}
                                                    onClick={() => {
                                                        if (!tt.is_sold_out) {
                                                            setSelectedTicketTypeId(tt.id);
                                                            setQuantity(1);
                                                            setHoldError(null);
                                                        }
                                                    }}
                                                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                                        tt.is_sold_out
                                                            ? "opacity-50 border-white/5 bg-white/2 cursor-not-allowed"
                                                            : isSelected
                                                            ? "border-gold bg-gold/10 shadow-[0_0_16px_rgba(232,168,56,0.15)]"
                                                            : "border-white/10 bg-bg-primary/40 hover:border-gold/40"
                                                    }`}
                                                    id={`ticket-tier-${tt.id}`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-display font-bold text-sm text-text-primary">
                                                            {tt.name}
                                                        </span>
                                                        <span className="font-display font-bold text-base text-gold">
                                                            ${tt.price}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs font-body">
                                                        <span className="text-text-muted">
                                                            {tt.is_sold_out
                                                                ? "Sold Out"
                                                                : `${tt.quantity_remaining.toLocaleString()} remaining`}
                                                        </span>
                                                        {isLowStock && !tt.is_sold_out && (
                                                            <span className="text-crimson font-semibold text-[10px] uppercase tracking-wider bg-crimson/10 px-2 py-0.5 rounded">
                                                                Low Stock
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-6 text-text-muted font-body text-xs">
                                            No ticket tiers currently available for this show.
                                        </div>
                                    )}
                                </div>

                                {/* Quantity + Total + CTA */}
                                {selectedTicketType && !selectedTicketType.is_sold_out && (
                                    <div className="pt-4 border-t border-white/10 space-y-4">
                                        {/* Quantity adjuster */}
                                        <div className="flex items-center justify-between">
                                            <span className="font-body text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                                Quantity
                                            </span>
                                            <div className="flex items-center gap-3 bg-bg-primary border border-white/10 rounded-lg p-1">
                                                <button
                                                    onClick={() => handleQuantityChange(-1)}
                                                    disabled={quantity <= 1}
                                                    className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-text-primary font-bold border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    id="qty-minus-btn"
                                                >
                                                    -
                                                </button>
                                                <span className="font-display font-bold text-sm text-text-primary w-6 text-center">
                                                    {quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleQuantityChange(1)}
                                                    disabled={quantity >= Math.min(8, selectedTicketType.quantity_remaining)}
                                                    className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-text-primary font-bold border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    id="qty-plus-btn"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {/* Total */}
                                        <div className="flex items-center justify-between py-3 px-4 bg-bg-primary/80 rounded-xl border border-white/5">
                                            <span className="font-body text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                Total Amount
                                            </span>
                                            <span className="font-display text-2xl font-bold text-gold">
                                                ${totalPrice}
                                            </span>
                                        </div>

                                        {/* Hold error */}
                                        {holdError && (
                                            <div className="text-xs font-body text-crimson bg-crimson/10 border border-crimson/20 rounded-lg px-4 py-2.5">
                                                {holdError}
                                            </div>
                                        )}

                                        {/* Reserve CTA */}
                                        <button
                                            onClick={handleReserveTickets}
                                            disabled={holdLoading}
                                            className="w-full font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover disabled:opacity-60 py-4 rounded-xl border-none cursor-pointer disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-gold/20 flex items-center justify-center gap-2"
                                            id="checkout-tickets-btn"
                                        >
                                            {holdLoading ? (
                                                "Reserving..."
                                            ) : user ? (
                                                <>
                                                    Reserve {quantity} Ticket{quantity > 1 ? "s" : ""} — 10 Min Hold
                                                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                                                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </>
                                            ) : (
                                                "Sign In to Reserve Tickets"
                                            )}
                                        </button>

                                        {!user && (
                                            <p className="font-body text-xs text-center text-text-muted">
                                                A Spotlight account is required to hold tickets.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
