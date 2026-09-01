import type { Order } from "../api/orders";
import TicketQRCode from "./TicketQRCode";

interface OrderConfirmationModalProps {
    order: Order;
    onClose: () => void;
}

export default function OrderConfirmationModal({
    order,
    onClose,
}: OrderConfirmationModalProps) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" id="order-confirmation-modal">
            <div className="bg-surface border border-gold/30 rounded-3xl max-w-2xl w-full p-6 sm:p-10 shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto">

                {/* Status Banner */}
                <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/40 text-gold flex items-center justify-center mx-auto mb-2 shadow-[0_0_24px_rgba(232,168,56,0.3)]">
                        <svg className="w-7 h-7" viewBox="0 0 20 20" fill="none">
                            <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="font-body text-xs font-bold uppercase tracking-widest text-gold block">
                        Payment Confirmed
                    </span>
                    <h2 className="font-display text-2xl sm:text-4xl font-bold text-text-primary">
                        Your Order is Confirmed!
                    </h2>
                    <p className="font-body text-xs sm:text-sm text-text-muted">
                        Order Ref: <strong className="text-text-primary font-mono">{order.payment_reference}</strong>
                    </p>
                </div>

                {/* Digital Ticket Stubs */}
                <div className="space-y-4">
                    <h3 className="font-display text-sm font-bold text-text-primary uppercase tracking-wider">
                        Issued Digital Tickets ({order.tickets.length})
                    </h3>

                    <div className="space-y-4" id="digital-tickets-list">
                        {order.tickets.map((t, idx) => (
                            <div
                                key={t.id}
                                className="bg-bg-primary/90 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6"
                                id={`ticket-stub-${t.id}`}
                            >
                                {/* Left side ticket info */}
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-body text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded">
                                            Ticket #{idx + 1}
                                        </span>
                                        <span className="font-body text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                            {t.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <h4 className="font-display text-lg font-bold text-text-primary">
                                        {t.artist}
                                    </h4>
                                    <p className="font-body text-xs font-medium text-gold">
                                        {t.event_title}
                                    </p>

                                    <div className="font-body text-xs text-text-muted space-y-0.5 pt-2 border-t border-white/6">
                                        <div><strong>Tier:</strong> {t.ticket_type_name}</div>
                                        <div><strong>Venue:</strong> {t.venue_name}</div>
                                        <div><strong>Date:</strong> {t.formatted_date} at {t.formatted_time}</div>
                                    </div>
                                </div>

                                {/* Right side authentic QR code & code */}
                                <div className="flex flex-col items-center justify-center p-3 bg-black/40 border border-white/8 rounded-xl shrink-0 text-center space-y-2">
                                    <TicketQRCode code={t.ticket_code} size={110} />
                                    <span className="font-mono text-[11px] font-bold text-gold tracking-widest">
                                        {t.ticket_code}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                    <button
                        onClick={handlePrint}
                        className="flex-1 font-body text-xs font-bold uppercase tracking-wider text-text-primary bg-white/5 hover:bg-white/10 border border-white/10 py-3.5 rounded-xl cursor-pointer transition-colors inline-flex items-center justify-center gap-2"
                        id="print-tickets-btn"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                            <path d="M4 6V2h8v4M4 12H2V7h12v5h-2M4 10h8v4H4v-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Print / Download Tickets
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 font-body text-xs font-bold uppercase tracking-wider text-bg-primary bg-gold hover:bg-gold-hover py-3.5 rounded-xl border-none cursor-pointer transition-all shadow-lg hover:shadow-gold/20"
                        id="return-to-events-btn"
                    >
                        Done & Return to Events
                    </button>
                </div>
            </div>
        </div>
    );
}
