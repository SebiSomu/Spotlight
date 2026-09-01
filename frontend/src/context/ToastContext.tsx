import {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    type ReactNode,
} from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextType {
    toasts: ToastItem[];
    showToast: (toast: Omit<ToastItem, "id">) => void;
    removeToast: (id: string) => void;
    toast: {
        success: (title: string, message?: string) => void;
        error: (title: string, message?: string) => void;
        info: (title: string, message?: string) => void;
    };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        ({ type, title, message }: Omit<ToastItem, "id">) => {
            const id = Math.random().toString(36).substring(2, 9);
            const newToast: ToastItem = { id, type, title, message };

            setToasts((prev) => [...prev, newToast]);

            setTimeout(() => {
                removeToast(id);
            }, 4000);
        },
        [removeToast],
    );

    const toast = useMemo(
        () => ({
            success: (title: string, message?: string) =>
                showToast({ type: "success", title, message }),
            error: (title: string, message?: string) =>
                showToast({ type: "error", title, message }),
            info: (title: string, message?: string) =>
                showToast({ type: "info", title, message }),
        }),
        [showToast],
    );

    return (
        <ToastContext.Provider
            value={{ toasts, showToast, removeToast, toast }}
        >
            {children}
            {/* Toast Container */}
            <div
                className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
                id="toast-container"
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-surface/95 backdrop-blur-md shadow-2xl transition-all duration-300 animate-fade-in-up ${
                            t.type === "success"
                                ? "border-emerald-500/40 shadow-emerald-500/10"
                                : t.type === "error"
                                  ? "border-crimson/40 shadow-crimson/10"
                                  : "border-gold/40 shadow-gold/10"
                        }`}
                    >
                        {/* Icon */}
                        <div className="shrink-0 mt-0.5">
                            {t.type === "success" ? (
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                    <svg
                                        className="w-3.5 h-3.5"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                    >
                                        <path
                                            d="M3.5 8.5l3 3 6-6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            ) : t.type === "error" ? (
                                <div className="w-5 h-5 rounded-full bg-crimson/20 text-crimson flex items-center justify-center">
                                    <svg
                                        className="w-3.5 h-3.5"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                    >
                                        <path
                                            d="M4 4l8 8M12 4l-8 8"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                            ) : (
                                <div className="w-5 h-5 rounded-full bg-gold/20 text-gold flex items-center justify-center">
                                    <svg
                                        className="w-3.5 h-3.5"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                    >
                                        <circle
                                            cx="8"
                                            cy="8"
                                            r="6"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        />
                                        <path
                                            d="M8 5v3.5M8 11h.01"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h4 className="font-body text-xs font-bold uppercase tracking-wider text-text-primary">
                                {t.title}
                            </h4>
                            {t.message && (
                                <p className="font-body text-xs text-text-muted mt-0.5 leading-relaxed">
                                    {t.message}
                                </p>
                            )}
                        </div>

                        {/* Dismiss */}
                        <button
                            onClick={() => removeToast(t.id)}
                            className="shrink-0 text-text-muted hover:text-text-primary p-1 bg-transparent border-none cursor-pointer"
                            aria-label="Dismiss toast"
                        >
                            <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 16 16"
                                fill="none"
                            >
                                <path
                                    d="M4 4l8 8M12 4l-8 8"
                                    stroke="currentColor"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
