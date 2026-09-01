import { useState, useEffect } from "react";
import { type Order, fetchOrdersApi } from "../api/orders";
import TicketQRCode from "../components/TicketQRCode";

interface MyTicketsPageProps {
    onExploreClick: () => void;
}

export default function MyTicketsPage({ onExploreClick }: MyTicketsPageProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadOrders() {
            setLoading(true);
            try {
                const res = await fetchOrdersApi();
                setOrders(res.orders);
            } catch (err) {
                console.error("Failed to load user orders:", err);
                setError("Unable to load your tickets. Please check your connection.");
            } finally {
                setLoading(false);
            }
        }

        loadOrders();
    }, []);

    const handlePrintTicket = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary pt-28 pb-24 px-5 md:px-10 lg:px-12">
                <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
                    <div className="h-10 bg-surface/50 rounded w-1/4" />
                    <div className="h-64 bg-surface/50 rounded-2xl" />
                    <div className="h-64 bg-surface/50 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary pt-28 pb-24 px-5 md:px-10 lg:px-12" id="my-tickets-page">
            <div className="max-w-5xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <span className="font-body text-xs font-bold uppercase tracking-widest text-gold block mb-1">
                            Digital Pass Wallet
                        </span>
                        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-text-primary">
                            My Tickets & Orders
                        </h1>
                    </div>

                    <button
                        onClick={onExploreClick}
                        className="font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover px-5 py-2.5 rounded-lg cursor-pointer border-none transition-colors self-start sm:self-auto"
                        id="browse-more-shows-btn"
                    >
                        Browse Shows
                    </button>
                </div>

                {/* Main Content */}
                {error ? (
                    <div className="text-center py-16 bg-surface/30 border border-white/10 rounded-2xl">
                        <p className="font-body text-sm text-text-muted mb-4">{error}</p>
                        <button
                            onClick={onExploreClick}
                            className="font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold px-5 py-2.5 rounded-lg border-none cursor-pointer"
                        >
                            Explore Concerts
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 bg-surface/30 border border-white/10 rounded-2xl space-y-4" id="empty-tickets-view">
                        <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8" viewBox="0 0 16 16" fill="none">
                                <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
                                <path d="M2 7h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h2 className="font-display text-2xl font-bold text-text-primary">
                            No Purchased Tickets Yet
                        </h2>
                        <p className="font-body text-sm text-text-muted max-w-sm mx-auto">
                            When you reserve and purchase concert tickets, your digital passes with QR codes will appear right here.
                        </p>
                        <button
                            onClick={onExploreClick}
                            className="font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover px-6 py-3 rounded-xl border-none cursor-pointer transition-all shadow-lg hover:shadow-gold/20"
                            id="find-first-show-btn"
                        >
                            Discover Upcoming Shows
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8" id="orders-tickets-list">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-surface/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-md"
                                id={`order-card-${order.id}`}
                            >
                                {/* Order Header */}
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-display text-sm font-bold text-gold">
                                                Order #{order.id}
                                            </span>
                                            <span className="font-body text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                                {order.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="font-body text-xs text-text-muted mt-1 block">
                                            Purchased on {order.formatted_date} · Ref: <strong className="font-mono text-text-secondary">{order.payment_reference}</strong>
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className="font-body text-[11px] text-text-muted block">Total Paid</span>
                                            <span className="font-display text-xl font-bold text-gold">${order.total_price.toFixed(2)}</span>
                                        </div>
                                        <button
                                            onClick={handlePrintTicket}
                                            className="font-body text-xs font-semibold uppercase tracking-wider text-text-primary bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl cursor-pointer transition-colors flex items-center gap-2"
                                            id={`print-order-btn-${order.id}`}
                                        >
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                                                <path d="M4 6V2h8v4M4 12H2V7h12v5h-2M4 10h8v4H4v-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Print Pass
                                        </button>
                                    </div>
                                </div>

                                {/* Issued Tickets Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {order.tickets.map((t, idx) => (
                                        <div
                                            key={t.id}
                                            className="bg-bg-primary/80 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between"
                                            id={`my-ticket-${t.id}`}
                                        >
                                            <div>
                                                {/* Header row */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-body text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 border border-gold/20 px-2.5 py-0.5 rounded-full">
                                                        Ticket {idx + 1} of {order.tickets.length}
                                                    </span>
                                                    <span className="font-body text-xs font-bold text-text-primary">
                                                        {t.ticket_type_name}
                                                    </span>
                                                </div>

                                                <h3 className="font-display text-xl font-bold text-text-primary mb-0.5">
                                                    {t.artist}
                                                </h3>
                                                <p className="font-display text-sm font-semibold text-gold mb-3">
                                                    {t.event_title}
                                                </p>

                                                <div className="font-body text-xs text-text-muted space-y-1 pt-3 border-t border-white/6 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-3.5 h-3.5 text-gold shrink-0" viewBox="0 0 16 16" fill="none">
                                                            <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
                                                            <path d="M2 7h12" stroke="currentColor" strokeWidth="1.2" />
                                                        </svg>
                                                        <span>{t.formatted_date} at {t.formatted_time}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-3.5 h-3.5 text-gold shrink-0" viewBox="0 0 16 16" fill="none">
                                                            <path d="M8 1.5C5.2 1.5 3 3.7 3 6.5C3 10.2 8 14.5 8 14.5C8 14.5 13 10.2 13 6.5C13 3.7 10.8 1.5 8 1.5ZM8 8C7.2 8 6.5 7.3 6.5 6.5C6.5 5.7 7.2 5 8 5C8.8 5 9.5 5.7 9.5 6.5C9.5 7.3 8.8 8 8 8Z" fill="currentColor" />
                                                        </svg>
                                                        <span>{t.venue_name}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Authentic TicketQRCode and Barcode token */}
                                            <div className="pt-3 border-t border-white/8 flex items-center justify-between bg-black/40 p-3 rounded-xl">
                                                <div className="font-mono text-xs font-bold text-gold tracking-wider">
                                                    {t.ticket_code}
                                                </div>

                                                <TicketQRCode code={t.ticket_code} size={96} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
