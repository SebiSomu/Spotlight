import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthModal() {
    const { isModalOpen, modalMode, closeModal, login, signup, openModal } =
        useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal mode changes
    useEffect(() => {
        setError(null);
        setEmail("");
        setPassword("");
        setPasswordConfirmation("");
        setFirstName("");
        setLastName("");
    }, [modalMode, isModalOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeModal();
        };
        if (isModalOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isModalOpen, closeModal]);

    if (!isModalOpen) return null;

    const isLogin = modalMode === "login";

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isLogin && password !== passwordConfirmation) {
            setError("Passwords do not match");
            return;
        }

        setIsSubmitting(true);

        try {
            if (isLogin) {
                await login({ email, password });
            } else {
                await signup({
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                    first_name: firstName,
                    last_name: lastName,
                });
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050508]/80 backdrop-blur-md animate-fade-in-up"
            onClick={(e) => {
                if (e.target === e.currentTarget) closeModal();
            }}
            id="auth-modal-backdrop"
        >
            <div
                className="relative w-full max-w-md bg-surface border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden"
                id="auth-modal-card"
            >
                {/* Top Accent Beam */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-crimson to-gold" />

                {/* Close Button */}
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-2 bg-white/5 hover:bg-white/10 rounded-full border-none cursor-pointer transition-colors duration-200"
                    aria-label="Close modal"
                    id="close-auth-modal"
                >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M4 4l8 8M12 4l-8 8"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>

                {/* Header Branding */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 mb-2">
                        <svg
                            className="w-6 h-6"
                            viewBox="0 0 28 28"
                            fill="none"
                        >
                            <circle cx="14" cy="14" r="6" fill="#e8a838" />
                            <circle
                                cx="14"
                                cy="14"
                                r="10"
                                stroke="#e8a838"
                                strokeWidth="1.5"
                                opacity="0.4"
                            />
                            <circle
                                cx="14"
                                cy="14"
                                r="13.5"
                                stroke="#e8a838"
                                strokeWidth="1"
                                opacity="0.15"
                            />
                        </svg>
                        <span className="font-display text-xl font-semibold tracking-tight text-text-primary">
                            Spotlight
                        </span>
                    </div>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-text-primary">
                        {isLogin ? "Welcome Back" : "Create an Account"}
                    </h2>
                    <p className="font-body text-xs text-text-muted mt-1">
                        {isLogin
                            ? "Sign in to access your tickets & holds"
                            : "Join Spotlight to lock in tickets"}
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-bg-primary/80 border border-white/6 p-1 rounded-xl mb-6">
                    <button
                        type="button"
                        className={`flex-1 py-2 font-body text-xs font-semibold uppercase tracking-wider rounded-lg border-none cursor-pointer transition-all duration-200 ${
                            isLogin
                                ? "bg-surface text-gold shadow-sm"
                                : "text-text-muted hover:text-text-primary bg-transparent"
                        }`}
                        onClick={() => openModal("login")}
                        id="tab-login"
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2 font-body text-xs font-semibold uppercase tracking-wider rounded-lg border-none cursor-pointer transition-all duration-200 ${
                            !isLogin
                                ? "bg-surface text-gold shadow-sm"
                                : "text-text-muted hover:text-text-primary bg-transparent"
                        }`}
                        onClick={() => openModal("signup")}
                        id="tab-signup"
                    >
                        Sign Up
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-5 p-3 rounded-lg bg-crimson/15 border border-crimson/40 text-crimson font-body text-xs leading-normal flex items-start gap-2">
                        <svg
                            className="w-4 h-4 shrink-0 mt-0.5"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <circle
                                cx="8"
                                cy="8"
                                r="7"
                                stroke="currentColor"
                                strokeWidth="1.2"
                            />
                            <path
                                d="M8 5v4M8 11h.01"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Auth Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {!isLogin && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={firstName}
                                    onChange={(e) =>
                                        setFirstName(e.target.value)
                                    }
                                    placeholder="Sarah"
                                    className="w-full bg-bg-primary/90 border border-white/10 focus:border-gold/50 focus:outline-none rounded-lg px-3.5 py-2.5 font-body text-sm text-text-primary placeholder:text-text-muted/50 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={lastName}
                                    onChange={(e) =>
                                        setLastName(e.target.value)
                                    }
                                    placeholder="Connor"
                                    className="w-full bg-bg-primary/90 border border-white/10 focus:border-gold/50 focus:outline-none rounded-lg px-3.5 py-2.5 font-body text-sm text-text-primary placeholder:text-text-muted/50 transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-bg-primary/90 border border-white/10 focus:border-gold/50 focus:outline-none rounded-lg px-3.5 py-2.5 font-body text-sm text-text-primary placeholder:text-text-muted/50 transition-colors"
                            id="auth-email-input"
                        />
                    </div>

                    <div>
                        <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-bg-primary/90 border border-white/10 focus:border-gold/50 focus:outline-none rounded-lg px-3.5 py-2.5 font-body text-sm text-text-primary placeholder:text-text-muted/50 transition-colors"
                            id="auth-password-input"
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={passwordConfirmation}
                                onChange={(e) =>
                                    setPasswordConfirmation(e.target.value)
                                }
                                placeholder="••••••••"
                                className="w-full bg-bg-primary/90 border border-white/10 focus:border-gold/50 focus:outline-none rounded-lg px-3.5 py-2.5 font-body text-sm text-text-primary placeholder:text-text-muted/50 transition-colors"
                                id="auth-confirm-password-input"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 font-body text-xs font-bold tracking-wider uppercase text-bg-primary bg-gold hover:bg-gold-hover disabled:opacity-50 border-none rounded-lg py-3 cursor-pointer transition-all duration-200 shadow-md hover:shadow-gold/20 flex items-center justify-center gap-2"
                        id="auth-submit-btn"
                    >
                        {isSubmitting ? (
                            <>
                                <svg
                                    className="w-4 h-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        opacity="0.3"
                                    />
                                    <path
                                        d="M12 2a10 10 0 0 1 10 10"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                Processing…
                            </>
                        ) : isLogin ? (
                            "Sign In"
                        ) : (
                            "Create Account"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
