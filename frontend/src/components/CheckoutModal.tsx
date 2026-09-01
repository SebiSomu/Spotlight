import { useState } from "react";
import type { Hold } from "../api/holds";
import type { EventItem } from "../api/events";
import { type Order, createOrderFromHoldApi } from "../api/orders";

interface CheckoutModalProps {
    hold: Hold;
    event: EventItem;
    secondsRemaining: number;
    onClose: () => void;
    onSuccess: (order: Order) => void;
}

export default function CheckoutModal({
    hold,
    event,
    secondsRemaining,
    onClose,
    onSuccess,
}: CheckoutModalProps) {
    const [name, setName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [paymentToken, setPaymentToken] = useState<string>("tok_success");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formatCountdown = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const handleFillDemoCard = () => {
        setName("Alex Morgan");
        setCardNumber("4242 •••• •••• 4242");
        setExpiry("12/28");
        setCvc("888");
        setPaymentToken("tok_visa_demo");
        setError(null);
    };

    const handleSimulateDecline = () => {
        setName("Alex Morgan");
        setCardNumber("4000 •••• •••• 0002");
        setExpiry("05/27");
        setCvc("999");
        setPaymentToken("tok_fail");
        setError(null);
    };

    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await createOrderFromHoldApi({
                hold_id: hold.id,
                payment_method: "card",
                payment_token: paymentToken,
            });
            onSuccess(res.order);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Payment failed. Please try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" id="checkout-modal-overlay">
            <div className="bg-surface border border-white/10 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                        <span className="font-body text-[10px] font-bold uppercase tracking-widest text-gold block">
                            Secure Checkout
                        </span>
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary">
                            Complete Order
                        </h2>
                    </div>

                    {/* Countdown Badge */}
                    <div className="flex items-center gap-2 bg-bg-primary border border-white/10 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
                        <span className="font-body text-xs text-text-muted">Hold Expires:</span>
                        <span className="font-display text-sm font-bold text-gold tabular-nums">
                            {formatCountdown(secondsRemaining)}
                        </span>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="bg-bg-primary/70 border border-white/8 rounded-2xl p-5 space-y-3">
                    <h3 className="font-display text-sm font-bold text-text-primary uppercase tracking-wider">
                        Order Details
                    </h3>

                    <div className="space-y-2 text-xs font-body">
                        <div className="flex justify-between">
                            <span className="text-text-muted">Concert</span>
                            <span className="font-semibold text-text-primary text-right">{event.artist} — {event.title}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-muted">Date & Time</span>
                            <span className="text-text-secondary">{event.formatted_date} at {event.formatted_time}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-muted">Venue</span>
                            <span className="text-text-secondary">{event.venue.name}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-white/6">
                            <span className="text-text-muted">Seating Tier</span>
                            <span className="font-bold text-gold">{hold.ticket_type_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-muted">Quantity</span>
                            <span className="font-bold text-text-primary">{hold.quantity}x Tickets</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                        <span className="font-display text-sm font-bold text-text-primary">Total Amount Due</span>
                        <span className="font-display text-2xl font-bold text-gold">${hold.total_price.toFixed(2)}</span>
                    </div>
                </div>

                {/* Quick Test Card Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white/3 border border-white/8 rounded-xl">
                    <span className="font-body text-[11px] text-text-muted">Demo Test Cards:</span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleFillDemoCard}
                            className="font-body text-[10px] font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover px-2.5 py-1 rounded cursor-pointer border-none transition-colors"
                            id="fill-demo-card-btn"
                        >
                            Auto-Fill Card
                        </button>
                        <button
                            type="button"
                            onClick={handleSimulateDecline}
                            className="font-body text-[10px] font-bold uppercase tracking-wider text-crimson bg-crimson/10 hover:bg-crimson/20 border border-crimson/30 px-2.5 py-1 rounded cursor-pointer transition-colors"
                            id="simulate-decline-btn"
                        >
                            Test Decline
                        </button>
                    </div>
                </div>

                {/* Payment Form */}
                <form onSubmit={handleSubmitPayment} className="space-y-4" id="payment-form">
                    {error && (
                        <div className="p-3 bg-crimson/10 border border-crimson/30 rounded-xl text-xs font-body text-crimson flex items-center gap-2" id="payment-error-alert">
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="font-body text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                            Cardholder Name
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full name as shown on card"
                            className="w-full bg-bg-primary border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted/50"
                            id="cardholder-name-input"
                        />
                    </div>

                    <div>
                        <label className="font-body text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                            Card Number
                        </label>
                        <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4242 4242 4242 4242"
                            className="w-full bg-bg-primary border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted/50"
                            id="card-number-input"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-body text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                                Expiration Date
                            </label>
                            <input
                                type="text"
                                required
                                value={expiry}
                                onChange={(e) => setExpiry(e.target.value)}
                                placeholder="MM/YY"
                                className="w-full bg-bg-primary border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted/50"
                                id="card-expiry-input"
                            />
                        </div>
                        <div>
                            <label className="font-body text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                                Security Code (CVC)
                            </label>
                            <input
                                type="text"
                                required
                                value={cvc}
                                onChange={(e) => setCvc(e.target.value)}
                                placeholder="123"
                                className="w-full bg-bg-primary border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted/50"
                                id="card-cvc-input"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 font-body text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-primary bg-transparent border border-white/10 hover:border-white/20 py-3.5 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
                            id="cancel-payment-btn"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover py-3.5 rounded-xl border-none cursor-pointer transition-all shadow-lg hover:shadow-gold/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            id="confirm-payment-btn"
                        >
                            {loading ? "Processing Payment..." : `Pay $${hold.total_price.toFixed(2)}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
