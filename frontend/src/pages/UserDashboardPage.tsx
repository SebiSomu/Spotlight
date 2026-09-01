import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { type Order, type Ticket, fetchOrdersApi } from "../api/orders";
import TicketQRCode from "../components/TicketQRCode";

interface UserDashboardPageProps {
    onExploreClick: () => void;
}

export default function UserDashboardPage({ onExploreClick }: UserDashboardPageProps) {
    const { user, logout } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"tickets" | "receipts" | "account">("tickets");

    useEffect(() => {
        async function loadDashboardData() {
            setLoading(true);
            try {
                const res = await fetchOrdersApi();
                setOrders(res.orders);
            } catch (err) {
                console.error("Failed to load user order history:", err);
                setError("Unable to load your dashboard data. Please try again.");
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            loadDashboardData();
        } else {
            setLoading(false);
        }
    }, [user]);

    const handlePrintPass = () => {
        window.print();
    };

    const getUserInitials = () => {
        if (!user) return "?";
        if (user.first_name && user.last_name) {
            return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
        }
        return user.email.substring(0, 2).toUpperCase();
    };

    // Extract all issued tickets across orders
    const allTickets: Ticket[] = orders.flatMap((o) => o.tickets);
    const totalSpent = orders.reduce((sum, o) => sum + o.total_price, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary pt-28 pb-24 px-5 md:px-10 lg:px-12">
                <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
                    <div className="h-40 bg-surface/50 rounded-3xl" />
                    <div className="h-12 bg-surface/50 rounded-xl w-1/3" />
                    <div className="h-64 bg-surface/50 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-bg-primary pt-28 pb-24 px-5 text-center">
                <div className="max-w-md mx-auto bg-surface/40 border border-white/10 rounded-2xl p-8 space-y-4">
                    <h2 className="font-display text-xl font-bold text-text-primary">
                        Sign In Required
                    </h2>
                    <p className="font-body text-sm text-text-muted">
                        Please sign in to access your user dashboard, order receipts, and digital ticket passes.
                    </p>
                    <button
                        onClick={onExploreClick}
                        className="font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover px-6 py-2.5 rounded-lg border-none cursor-pointer transition-all"
                    >
                        Browse Concerts
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary pt-28 pb-24 px-5 md:px-10 lg:px-12" id="user-dashboard-page">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Profile Header Banner */}
                <div className="bg-surface border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                        {/* User Identity */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gold text-bg-primary font-display font-bold text-2xl flex items-center justify-center shadow-lg shadow-gold/20 shrink-0">
                                {getUserInitials()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
                                        {user.full_name || user.email.split("@")[0]}
                                    </h1>
                                    <span className="font-body text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 border border-gold/25 px-2.5 py-0.5 rounded-full">
                                        {user.role === "admin" ? "ADMIN" : "SPOTLIGHT MEMBER"}
                                    </span>
                                </div>
                                <p className="font-body text-xs text-text-muted">
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="flex items-center gap-4 sm:gap-6 bg-bg-primary/80 border border-white/8 rounded-2xl p-4 w-full sm:w-auto justify-around">
                            <div className="text-center px-2">
                                <span className="font-display text-xl sm:text-2xl font-bold text-text-primary block">
                                    {orders.length}
                                </span>
                                <span className="font-body text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                                    Orders
                                </span>
                            </div>

                            <div className="h-8 w-px bg-white/10" />

                            <div className="text-center px-2">
                                <span className="font-display text-xl sm:text-2xl font-bold text-gold block">
                                    {allTickets.length}
                                </span>
                                <span className="font-body text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                                    Tickets
                                </span>
                            </div>

                            <div className="h-8 w-px bg-white/10" />

                            <div className="text-center px-2">
                                <span className="font-display text-xl sm:text-2xl font-bold text-emerald-400 block">
                                    ${totalSpent.toFixed(2)}
                                </span>
                                <span className="font-body text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                                    Spent
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Navigation Tabs */}
                <div className="flex border-b border-white/10 gap-2" id="dashboard-tabs">
                    <button
                        onClick={() => setActiveTab("tickets")}
                        className={`font-body text-xs font-bold uppercase tracking-wider px-5 py-3 border-b-2 cursor-pointer transition-colors bg-transparent ${
                            activeTab === "tickets"
                                ? "border-gold text-gold"
                                : "border-transparent text-text-muted hover:text-text-primary"
                        }`}
                        id="tab-digital-tickets"
                    >
                        Digital Passes ({allTickets.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("receipts")}
                        className={`font-body text-xs font-bold uppercase tracking-wider px-5 py-3 border-b-2 cursor-pointer transition-colors bg-transparent ${
                            activeTab === "receipts"
                                ? "border-gold text-gold"
                                : "border-transparent text-text-muted hover:text-text-primary"
                        }`}
                        id="tab-order-history"
                    >
                        Order Receipts ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("account")}
                        className={`font-body text-xs font-bold uppercase tracking-wider px-5 py-3 border-b-2 cursor-pointer transition-colors bg-transparent ${
                            activeTab === "account"
                                ? "border-gold text-gold"
                                : "border-transparent text-text-muted hover:text-text-primary"
                        }`}
                        id="tab-account-settings"
                    >
                        Account Profile
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-crimson/10 border border-crimson/30 rounded-2xl text-xs font-body text-crimson">
                        {error}
                    </div>
                )}

                {/* Tab 1: Digital Tickets Grid */}
                {activeTab === "tickets" && (
                    <div id="tab-content-tickets">
                        {allTickets.length === 0 ? (
                            <div className="text-center py-20 bg-surface/30 border border-white/10 rounded-2xl space-y-4">
                                <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mx-auto">
                                    <svg className="w-8 h-8" viewBox="0 0 16 16" fill="none">
                                        <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
                                        <path d="M2 7h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <h2 className="font-display text-xl font-bold text-text-primary">
                                    No Active Tickets
                                </h2>
                                <p className="font-body text-xs text-text-muted max-w-sm mx-auto">
                                    You have not purchased any concert tickets yet. Explore upcoming tour dates to book your first show.
                                </p>
                                <button
                                    onClick={onExploreClick}
                                    className="font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover px-6 py-2.5 rounded-lg border-none cursor-pointer transition-all"
                                >
                                    Explore Concerts
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="digital-passes-grid">
                                {allTickets.map((t) => (
                                    <div
                                        key={t.id}
                                        className="bg-surface border border-white/10 hover:border-gold/30 rounded-3xl p-6 shadow-xl transition-all space-y-4 relative overflow-hidden flex flex-col justify-between"
                                        id={`ticket-card-${t.id}`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                {t.genre && (
                                                    <span className="font-body text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 border border-gold/20 px-2.5 py-0.5 rounded-full">
                                                        {t.genre}
                                                    </span>
                                                )}
                                                <span className="font-body text-xs font-bold text-text-primary">
                                                    {t.ticket_type_name}
                                                </span>
                                            </div>

                                            <h3 className="font-display text-2xl font-bold text-text-primary mb-1">
                                                {t.artist}
                                            </h3>
                                            <p className="font-display text-base font-semibold text-gold mb-4">
                                                {t.event_title}
                                            </p>

                                            <div className="font-body text-xs text-text-muted space-y-1.5 pt-3 border-t border-white/6 mb-4">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gold shrink-0" viewBox="0 0 16 16" fill="none">
                                                        <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
                                                        <path d="M2 7h12" stroke="currentColor" strokeWidth="1.2" />
                                                    </svg>
                                                    <span>{t.formatted_date} at {t.formatted_time}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gold shrink-0" viewBox="0 0 16 16" fill="none">
                                                        <path d="M8 1.5C5.2 1.5 3 3.7 3 6.5C3 10.2 8 14.5 8 14.5C8 14.5 13 10.2 13 6.5C13 3.7 10.8 1.5 8 1.5ZM8 8C7.2 8 6.5 7.3 6.5 6.5C6.5 5.7 7.2 5 8 5C8.8 5 9.5 5.7 9.5 6.5C9.5 7.3 8.8 8 8 8Z" fill="currentColor" />
                                                    </svg>
                                                    <span>{t.venue_name}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom QR and Print */}
                                        <div className="pt-4 border-t border-white/8 flex items-center justify-between gap-4 bg-black/40 p-3 rounded-2xl">
                                            <div>
                                                <span className="font-body text-[10px] text-text-muted block mb-0.5">Ticket Code</span>
                                                <span className="font-mono text-xs font-bold text-gold tracking-widest block mb-2">
                                                    {t.ticket_code}
                                                </span>
                                                <button
                                                    onClick={handlePrintPass}
                                                    className="font-body text-[10px] font-bold uppercase tracking-wider text-text-primary bg-white/6 hover:bg-white/12 border border-white/10 px-3 py-1.5 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1.5"
                                                >
                                                    <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none">
                                                        <path d="M4 6V2h8v4M4 12H2V7h12v5h-2M4 10h8v4H4v-4z" stroke="currentColor" strokeWidth="1.2" />
                                                    </svg>
                                                    Print Pass
                                                </button>
                                            </div>

                                            <TicketQRCode code={t.ticket_code} size={90} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Order Receipts History */}
                {activeTab === "receipts" && (
                    <div className="space-y-4" id="tab-content-receipts">
                        {orders.length === 0 ? (
                            <div className="text-center py-16 bg-surface/30 border border-white/10 rounded-2xl text-text-muted font-body text-sm">
                                No order receipts found.
                            </div>
                        ) : (
                            orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl space-y-4"
                                    id={`receipt-card-${order.id}`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-3">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-display font-bold text-text-primary text-base">
                                                    Order #{order.id}
                                                </span>
                                                <span className="font-body text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                                    {order.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="font-body text-xs text-text-muted">
                                                Payment Reference: <strong className="font-mono text-text-secondary">{order.payment_reference}</strong>
                                            </span>
                                        </div>

                                        <div className="text-right">
                                            <span className="font-body text-xs text-text-muted block">Purchased Date</span>
                                            <span className="font-body text-xs font-semibold text-text-primary">{order.formatted_date}</span>
                                        </div>
                                    </div>

                                    {/* Line items */}
                                    <div className="space-y-2 font-body text-xs">
                                        {order.tickets.map((t) => (
                                            <div key={t.id} className="flex justify-between p-3 bg-bg-primary/60 rounded-xl border border-white/5">
                                                <div>
                                                    <span className="font-bold text-text-primary block">{t.artist} — {t.event_title}</span>
                                                    <span className="text-text-muted">{t.ticket_type_name} ({t.venue_name})</span>
                                                </div>
                                                <div className="text-right font-semibold text-gold">
                                                    ${t.price_dollars.toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-white/8 font-body">
                                        <span className="text-xs text-text-muted">Payment Method: <strong className="text-text-secondary uppercase">{order.payment_method}</strong></span>
                                        <span className="font-display text-lg font-bold text-gold">Total: ${order.total_price.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Tab 3: Account Profile Details */}
                {activeTab === "account" && (
                    <div className="bg-surface border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-2xl" id="tab-content-account">
                        <h2 className="font-display text-xl font-bold text-text-primary border-b border-white/10 pb-3">
                            Member Profile
                        </h2>

                        <div className="space-y-4 font-body text-sm">
                            <div className="p-4 bg-bg-primary/70 rounded-xl border border-white/5">
                                <span className="text-text-muted text-xs block mb-1">Full Name</span>
                                <span className="font-bold text-text-primary">{user.full_name || "Not provided"}</span>
                            </div>

                            <div className="p-4 bg-bg-primary/70 rounded-xl border border-white/5">
                                <span className="text-text-muted text-xs block mb-1">Email Address</span>
                                <span className="font-bold text-text-primary">{user.email}</span>
                            </div>

                            <div className="p-4 bg-bg-primary/70 rounded-xl border border-white/5">
                                <span className="text-text-muted text-xs block mb-1">Role & Privileges</span>
                                <span className="font-bold text-gold uppercase">{user.role}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                            <button
                                onClick={logout}
                                className="font-body text-xs font-bold uppercase tracking-wider text-crimson bg-crimson/10 hover:bg-crimson/20 border border-crimson/30 px-6 py-3 rounded-xl cursor-pointer transition-colors"
                                id="dashboard-signout-btn"
                            >
                                Sign Out of Account
                            </button>

                            <button
                                onClick={onExploreClick}
                                className="font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover px-6 py-3 rounded-xl border-none cursor-pointer transition-all"
                            >
                                Browse Events
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
