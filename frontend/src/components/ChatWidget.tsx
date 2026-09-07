import { useState, useRef, useEffect, type FormEvent } from "react";
import { sendChatMessage, type ChatMessageItem } from "../api/chat";

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessageItem[]>([
        {
            role: "assistant",
            content: "Hi! I'm Spotlight AI \u26A1 Your concert and live event assistant. Ask me anything about upcoming shows, venues, or artist lineups!",
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [geoFetching, setGeoFetching] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const requestBrowserLocation = async (): Promise<{ lat: number; lng: number } | null> => {
        if (typeof window === "undefined" || !("geolocation" in navigator)) {
            setError("Geolocation is not supported in this browser. Try telling me what city you're in instead!");
            return null;
        }
        setGeoFetching(true);
        try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (p) => resolve(p),
                    (err) => reject(err),
                    { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
                );
            });
            const coords = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
            };
            setUserCoords(coords);
            setError(null);
            return coords;
        } catch (err: any) {
            const msg =
                err?.code === 1
                    ? "You denied location access. No problem \u2014 just tell me what city you're in instead!"
                    : "I couldn't get your location from the browser. Try telling me what city you're in instead!";
            setError(msg);
            return null;
        } finally {
            setGeoFetching(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        setError(null);
        const userMsg: ChatMessageItem = { role: "user", content: trimmed };

        const updatedHistory = [...messages, userMsg];
        setMessages(updatedHistory);
        setInput("");
        setIsLoading(true);

        try {
            const historyForBackend = updatedHistory.slice(-6);

            let currentCoords = userCoords;
            const looksLikeWhereAmI = /\b(where\s*(?:am|'?r?e?)\s*i\s*(?:right\s*now)?|unde\s+sunt\s*(?:eu|acum)?|use\s*(?:my|the)\s*current\s*location|whats?\s*my\s*(?:current\s*)?location)\b/i.test(
                trimmed
            );

            if (looksLikeWhereAmI && !currentCoords) {
                const fresh = await requestBrowserLocation();
                if (fresh) currentCoords = fresh;
            }

            const res = await sendChatMessage(trimmed, historyForBackend, {
                user_latitude: currentCoords?.lat ?? null,
                user_longitude: currentCoords?.lng ?? null,
            });

            if (res.needs_browser_geolocation && !currentCoords) {
                const fresh = await requestBrowserLocation();
                if (fresh) {
                    const retry = await sendChatMessage(trimmed, historyForBackend, {
                        user_latitude: fresh.lat,
                        user_longitude: fresh.lng,
                    });
                    if (retry.error) {
                        setMessages((prev) => [
                            ...prev,
                            { role: "assistant", content: `\u26A0\uFE0F ${retry.error}` },
                        ]);
                    } else {
                        setMessages((prev) => [
                            ...prev,
                            { role: "assistant", content: retry.reply },
                        ]);
                    }
                    setIsLoading(false);
                    return;
                }
            }

            if (res.error) {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: `\u26A0\uFE0F ${res.error}`,
                    },
                ]);
            } else {
                let replyText = res.reply;
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: replyText,
                    },
                ]);
            }
        } catch (err: any) {
            const errorMsg = err.message || "Failed to reach AI assistant. Please try again.";
            setError(errorMsg);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: `\u26A0\uFE0F ${errorMsg}`,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[360px] sm:w-[400px] h-[540px] rounded-2xl bg-[#0c0c14]/95 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="px-5 py-4 bg-gradient-to-r from-[#141420] to-[#1a1429] border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-[#e8a838] to-[#c2185b] flex items-center justify-center text-white text-sm font-bold shadow-md">
                                ✨
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0c0c14]" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm tracking-wide">Spotlight AI</h3>
                                <p className="text-[#a8a3b3] text-xs">Concert &amp; Event Assistant</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={requestBrowserLocation}
                                disabled={geoFetching || isLoading}
                                title={
                                    userCoords
                                        ? `Using your location (${userCoords.lat.toFixed(2)}, ${userCoords.lng.toFixed(2)})`
                                        : "Use my current location"
                                }
                                className={`relative text-xs h-8 px-2 rounded-lg transition-all flex items-center gap-1
                                    ${userCoords
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30"
                                        : "text-[#a8a3b3] hover:text-white hover:bg-white/5 border border-transparent"}
                                    disabled:opacity-50`}
                                aria-label="Use my current location"
                            >
                                {geoFetching ? (
                                    <span className="w-2 h-2 rounded-full bg-[#e8a838] animate-pulse" />
                                ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M12 22s8-7.58 8-14a8 8 0 10-16 0c0 6.42 8 14 8 14zm0-18a6 6 0 016 6c0 3.87-4.4 9.41-6 11.31C10.4 19.41 6 13.87 6 10a6 6 0 016-6zm0 8a2 2 0 100-4 2 2 0 000 4z"
                                        />
                                    </svg>
                                )}
                                <span className="hidden sm:inline text-[10px]">
                                    {userCoords ? "Geo ON" : "Locate me"}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="text-[#a8a3b3] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                                aria-label="Close Chat"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm">
                        {messages.map((msg, idx) => {
                            const isUser = msg.role === "user";
                            return (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                                >
                                    {!isUser && (
                                        <div className="w-7 h-7 rounded-full bg-[#e8a838]/20 border border-[#e8a838]/40 text-[#e8a838] flex items-center justify-center text-xs shrink-0 mt-0.5">
                                            ✨
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 leading-relaxed whitespace-pre-wrap ${
                                            isUser
                                                ? "bg-gradient-to-r from-[#e8a838] to-[#d4942a] text-black font-medium rounded-tr-none shadow-md"
                                                : "bg-[#161622] text-[#f0ece4] border border-white/5 rounded-tl-none"
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing Indicator */}
                        {isLoading && (
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-[#e8a838]/20 border border-[#e8a838]/40 text-[#e8a838] flex items-center justify-center text-xs shrink-0">
                                    ✨
                                </div>
                                <div className="bg-[#161622] text-[#a8a3b3] border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#e8a838] animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-2 h-2 rounded-full bg-[#e8a838] animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-2 h-2 rounded-full bg-[#e8a838] animate-bounce" />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-2.5 bg-red-950/40 border border-red-500/20 text-red-300 text-xs rounded-xl">
                                {error}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="p-3 bg-[#08080e] border-t border-white/10 flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder='Ask about concerts, artists, venues... or try "I\u2019m in Miami, closest concert?"'
                            disabled={isLoading}
                            className="flex-1 bg-[#141420] text-white text-sm placeholder-[#6b6575] rounded-xl px-4 py-2.5 border border-white/10 focus:outline-none focus:border-[#e8a838]/60 transition-all disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#e8a838] to-[#c2185b] text-white flex items-center justify-center hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:hover:opacity-40 disabled:active:scale-100 transition-all shadow-md shrink-0"
                            aria-label="Send Message"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="group relative flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#e8a838] via-[#d4942a] to-[#c2185b] text-black font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                aria-label="Toggle AI Concert Assistant Chat"
            >
                <span className="text-lg">✨</span>
                <span className="text-sm font-bold tracking-wide text-white drop-shadow-sm">
                    {isOpen ? "Close Assistant" : "Ask Spotlight AI"}
                </span>
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e8a838] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#e8a838]"></span>
                    </span>
                )}
            </button>
        </div>
    );
}
