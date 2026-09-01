import type { TicketType } from "../api/events";

interface StadiumSeatMapProps {
    ticketTypes: TicketType[];
    selectedTicketTypeId: number | null;
    onSelectSection: (ticketTypeId: number) => void;
}

// Maps common ticket tier name keywords to stadium section display data
function matchSection(
    name: string,
    idx: number,
): { label: string; sublabel?: string } {
    const n = name.toLowerCase();
    if (n.includes("vip") || n.includes("pit") || n.includes("lounge") || n.includes("golden") || n.includes("karma") || n.includes("ovo") || n.includes("kinetic"))
        return { label: "VIP", sublabel: "Pit / Lounge" };
    if (n.includes("floor") || n.includes("field") || n.includes("ga") || n.includes("general") || n.includes("standing") || n.includes("spheres"))
        return { label: "FLOOR", sublabel: "General Admission" };
    if (n.includes("lower") || n.includes("club") || n.includes("bowl") || n.includes("reserved") || n.includes("main") || n.includes("pavilion") || n.includes("concourse") || n.includes("suite"))
        return { label: "LOWER", sublabel: "Lower Bowl" };
    if (n.includes("upper") || n.includes("balcony") || n.includes("level"))
        return { label: "UPPER", sublabel: "Upper Level" };
    // fallback by index
    const fallbacks = ["FLOOR", "LOWER", "UPPER"];
    return { label: fallbacks[idx % fallbacks.length] ?? "SECTION" };
}

// Color per section type
function sectionBaseColor(label: string, isSelected: boolean, isSoldOut: boolean): string {
    if (isSoldOut) return "#2a2a35";
    if (isSelected) return "#e8a838";
    const colors: Record<string, string> = {
        "VIP": "#7c3aed",
        "FLOOR": "#1d4ed8",
        "LOWER": "#0f766e",
        "UPPER": "#374151",
    };
    return colors[label] ?? "#374151";
}

function sectionStroke(label: string, isSelected: boolean, isSoldOut: boolean): string {
    if (isSoldOut) return "#3a3a45";
    if (isSelected) return "#f5c842";
    const strokes: Record<string, string> = {
        "VIP": "#a855f7",
        "FLOOR": "#3b82f6",
        "LOWER": "#14b8a6",
        "UPPER": "#6b7280",
    };
    return strokes[label] ?? "#6b7280";
}

export default function StadiumSeatMap({
    ticketTypes,
    selectedTicketTypeId,
    onSelectSection,
}: StadiumSeatMapProps) {
    if (!ticketTypes || ticketTypes.length === 0) return null;

    // Map each TicketType to a display section
    const sections = ticketTypes.map((tt, idx) => {
        const { label, sublabel } = matchSection(tt.name, idx);
        return { tt, label, sublabel };
    });

    return (
        <div className="w-full" id="stadium-seat-map">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-display text-sm font-bold text-text-primary">
                    Venue Section Map
                </h4>
                <span className="font-body text-xs text-text-muted">
                    Click a section to select
                </span>
            </div>

            {/* SVG Stadium */}
            <div className="relative bg-bg-primary/60 border border-white/10 rounded-2xl p-4 overflow-hidden">
                <svg
                    viewBox="0 0 400 340"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto"
                    aria-label="Stadium section map"
                >
                    {/* Background stadium shell */}
                    <ellipse cx="200" cy="175" rx="185" ry="155" fill="#0f0f18" stroke="#2a2a3a" strokeWidth="1.5" />

                    {/* UPPER LEVEL ring */}
                    {(() => {
                        const upperIdx = sections.findIndex((s) => s.label === "UPPER");
                        const tt = sections[upperIdx]?.tt ?? sections[sections.length - 1]?.tt;
                        const isSelected = tt && selectedTicketTypeId === tt.id;
                        const isSoldOut = tt?.is_sold_out ?? false;
                        const fill = sectionBaseColor("UPPER", !!isSelected, isSoldOut);
                        const stroke = sectionStroke("UPPER", !!isSelected, isSoldOut);
                        return (
                            <g
                                onClick={() => tt && !isSoldOut && onSelectSection(tt.id)}
                                className={tt && !isSoldOut ? "cursor-pointer" : "cursor-not-allowed"}
                                id="section-upper"
                            >
                                <ellipse cx="200" cy="175" rx="183" ry="153" fill={fill} stroke={stroke} strokeWidth="1.5" opacity="0.9" />
                                {isSelected && (
                                    <ellipse cx="200" cy="175" rx="183" ry="153" fill="none" stroke="#f5c842" strokeWidth="3" opacity="0.5" />
                                )}
                            </g>
                        );
                    })()}

                    {/* LOWER BOWL ring */}
                    {(() => {
                        const lowerIdx = sections.findIndex((s) => s.label === "LOWER");
                        const tt = sections[lowerIdx]?.tt ?? sections[Math.min(1, sections.length - 1)]?.tt;
                        const isSelected = tt && selectedTicketTypeId === tt.id;
                        const isSoldOut = tt?.is_sold_out ?? false;
                        const fill = sectionBaseColor("LOWER", !!isSelected, isSoldOut);
                        const stroke = sectionStroke("LOWER", !!isSelected, isSoldOut);
                        return (
                            <g
                                onClick={() => tt && !isSoldOut && onSelectSection(tt.id)}
                                className={tt && !isSoldOut ? "cursor-pointer" : "cursor-not-allowed"}
                                id="section-lower"
                            >
                                <ellipse cx="200" cy="175" rx="140" ry="116" fill={fill} stroke={stroke} strokeWidth="1.5" opacity="0.95" />
                                {isSelected && (
                                    <ellipse cx="200" cy="175" rx="140" ry="116" fill="none" stroke="#f5c842" strokeWidth="3" opacity="0.5" />
                                )}
                            </g>
                        );
                    })()}

                    {/* FLOOR / GA inner oval */}
                    {(() => {
                        const floorIdx = sections.findIndex((s) => s.label === "FLOOR");
                        const tt = sections[floorIdx]?.tt ?? sections[0]?.tt;
                        const isSelected = tt && selectedTicketTypeId === tt.id;
                        const isSoldOut = tt?.is_sold_out ?? false;
                        const fill = sectionBaseColor("FLOOR", !!isSelected, isSoldOut);
                        const stroke = sectionStroke("FLOOR", !!isSelected, isSoldOut);
                        return (
                            <g
                                onClick={() => tt && !isSoldOut && onSelectSection(tt.id)}
                                className={tt && !isSoldOut ? "cursor-pointer" : "cursor-not-allowed"}
                                id="section-floor"
                            >
                                <ellipse cx="200" cy="185" rx="92" ry="74" fill={fill} stroke={stroke} strokeWidth="1.5" opacity="0.95" />
                                {isSelected && (
                                    <ellipse cx="200" cy="185" rx="92" ry="74" fill="none" stroke="#f5c842" strokeWidth="3" opacity="0.5" />
                                )}
                            </g>
                        );
                    })()}

                    {/* STAGE block */}
                    <rect x="156" y="60" width="88" height="26" rx="6" fill="#1a1a28" stroke="#e8a838" strokeWidth="1.5" />
                    <text x="200" y="78" textAnchor="middle" fill="#e8a838" fontSize="10" fontWeight="700" fontFamily="sans-serif" letterSpacing="2">STAGE</text>

                    {/* VIP PIT section — front row crescent */}
                    {(() => {
                        const vipIdx = sections.findIndex((s) => s.label === "VIP");
                        const tt = sections[vipIdx]?.tt;
                        if (!tt) return null;
                        const isSelected = selectedTicketTypeId === tt.id;
                        const isSoldOut = tt.is_sold_out;
                        const fill = sectionBaseColor("VIP", isSelected, isSoldOut);
                        const stroke = sectionStroke("VIP", isSelected, isSoldOut);
                        return (
                            <g
                                onClick={() => !isSoldOut && onSelectSection(tt.id)}
                                className={!isSoldOut ? "cursor-pointer" : "cursor-not-allowed"}
                                id="section-vip"
                            >
                                <path
                                    d="M164 115 Q200 98 236 115 L230 140 Q200 126 170 140 Z"
                                    fill={fill}
                                    stroke={stroke}
                                    strokeWidth="1.5"
                                    opacity="0.95"
                                />
                                {isSelected && (
                                    <path
                                        d="M164 115 Q200 98 236 115 L230 140 Q200 126 170 140 Z"
                                        fill="none"
                                        stroke="#f5c842"
                                        strokeWidth="3"
                                        opacity="0.5"
                                    />
                                )}
                                <text x="200" y="132" textAnchor="middle" fill={isSoldOut ? "#555" : "white"} fontSize="8" fontWeight="700" fontFamily="sans-serif" letterSpacing="1">
                                    VIP PIT
                                </text>
                            </g>
                        );
                    })()}

                    {/* Section labels */}
                    {/* FLOOR label */}
                    <text x="200" y="198" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="10" fontWeight="700" fontFamily="sans-serif" letterSpacing="1.5" pointerEvents="none">FLOOR</text>

                    {/* LOWER BOWL label — left side */}
                    <text x="85" y="185" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8" fontWeight="600" fontFamily="sans-serif" transform="rotate(-20, 85, 185)" pointerEvents="none">LOWER</text>
                    <text x="315" y="185" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8" fontWeight="600" fontFamily="sans-serif" transform="rotate(20, 315, 185)" pointerEvents="none">LOWER</text>

                    {/* UPPER LEVEL label */}
                    <text x="38" y="220" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7.5" fontWeight="500" fontFamily="sans-serif" transform="rotate(-25, 38, 220)" pointerEvents="none">UPPER</text>
                    <text x="362" y="220" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7.5" fontWeight="500" fontFamily="sans-serif" transform="rotate(25, 362, 220)" pointerEvents="none">UPPER</text>
                </svg>

                {/* Section Legend */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                    {sections.map(({ tt, label, sublabel }) => {
                        const isSelected = selectedTicketTypeId === tt.id;
                        const fill = sectionBaseColor(label, isSelected, tt.is_sold_out);
                        return (
                            <button
                                key={tt.id}
                                onClick={() => !tt.is_sold_out && onSelectSection(tt.id)}
                                disabled={tt.is_sold_out}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                                    tt.is_sold_out
                                        ? "opacity-40 cursor-not-allowed border-white/5"
                                        : isSelected
                                        ? "border-gold/50 bg-gold/5"
                                        : "border-white/8 hover:border-white/20 cursor-pointer"
                                }`}
                                id={`legend-section-${tt.id}`}
                            >
                                <span
                                    className="w-3 h-3 rounded-sm shrink-0"
                                    style={{ backgroundColor: fill }}
                                />
                                <div className="min-w-0">
                                    <div className="font-body text-[10px] font-bold text-text-primary leading-none truncate">
                                        {label}
                                        {sublabel && <span className="font-normal text-text-muted"> · {sublabel}</span>}
                                    </div>
                                    <div className="font-body text-[10px] text-gold mt-0.5">${tt.price}</div>
                                </div>
                                {tt.is_sold_out && (
                                    <span className="ml-auto font-body text-[9px] font-bold text-text-muted uppercase tracking-wider shrink-0">Sold Out</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
