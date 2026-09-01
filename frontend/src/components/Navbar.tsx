import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
    onNavigate?: (view: "home" | "events" | "my_tickets" | "event_detail") => void;
    currentView?: "home" | "events" | "my_tickets" | "event_detail";
}

export default function Navbar({ onNavigate, currentView = "home" }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const { user, openModal, logout } = useAuth();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const getUserInitials = () => {
        if (!user) return "?";
        if (user.first_name && user.last_name) {
            return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
        }
        return user.email.substring(0, 2).toUpperCase();
    };

    const handleBrandClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onNavigate?.("home");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleEventsClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onNavigate?.("events");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleMyTicketsClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setDropdownOpen(false);
        setMobileOpen(false);
        onNavigate?.("my_tickets");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 px-5 md:px-10 lg:px-12 transition-all duration-350 ease-in-out ${
                scrolled
                    ? "bg-[rgba(8,8,14,0.92)] shadow-[0_1px_0_rgba(232,168,56,0.08)] backdrop-blur-sm"
                    : "bg-transparent"
            }`}
            id="main-nav"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between h-18">
                {/* Brand */}
                <a
                    href="/"
                    onClick={handleBrandClick}
                    className="flex items-center gap-2.5 no-underline text-text-primary group cursor-pointer"
                    id="brand-link"
                >
                    <svg
                        className="w-7 h-7 transition-transform duration-300 group-hover:scale-105"
                        viewBox="0 0 28 28"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <circle cx="14" cy="14" r="6" fill="#e8a838" />
                        <circle cx="14" cy="14" r="10" stroke="#e8a838" strokeWidth="1.5" opacity="0.4" />
                        <circle cx="14" cy="14" r="13.5" stroke="#e8a838" strokeWidth="1" opacity="0.15" />
                    </svg>
                    <span className="font-display text-2xl font-semibold tracking-tight text-text-primary">
                        Spotlight
                    </span>
                </a>

                {/* Mobile Hamburger Toggle */}
                <button
                    className="md:hidden flex flex-col gap-1.25 bg-transparent border-0 cursor-pointer p-2 z-50"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                    aria-expanded={mobileOpen}
                    id="hamburger-btn"
                >
                    <span
                        className={`block w-5.5 h-0.5 bg-text-primary rounded-full transition-all duration-300 ${
                            mobileOpen ? "translate-y-1.75 rotate-45" : ""
                        }`}
                    />
                    <span
                        className={`block w-5.5 h-0.5 bg-text-primary rounded-full transition-all duration-200 ${
                            mobileOpen ? "opacity-0" : ""
                        }`}
                    />
                    <span
                        className={`block w-5.5 h-0.5 bg-text-primary rounded-full transition-all duration-300 ${
                            mobileOpen ? "-translate-y-1.75 -rotate-45" : ""
                        }`}
                    />
                </button>

                {/* Links & Auth Button */}
                <div
                    className={`flex items-center gap-2 transition-all duration-300 md:opacity-100 md:pointer-events-auto ${
                        mobileOpen
                            ? "fixed inset-0 bg-[rgba(8,8,14,0.97)] flex-col justify-center gap-4 opacity-100 pointer-events-auto z-40"
                            : "max-md:opacity-0 max-md:pointer-events-none max-md:fixed max-md:inset-0 max-md:bg-[rgba(8,8,14,0.97)] max-md:flex-col max-md:justify-center max-md:gap-4"
                    }`}
                >
                    <a
                        href="#events"
                        onClick={handleEventsClick}
                        className={`font-body text-sm max-md:text-lg font-medium tracking-wide uppercase no-underline px-4 py-2 max-md:py-3 rounded-md transition-colors duration-200 ${
                            currentView === "events"
                                ? "text-gold bg-white/5 font-semibold"
                                : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                        }`}
                    >
                        Events
                    </a>

                    {user ? (
                        /* User Profile Dropdown */
                        <div className="relative md:ml-2">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2.5 bg-white/6 hover:bg-white/10 border border-white/10 rounded-full py-1.5 px-3.5 cursor-pointer transition-all duration-200"
                                id="user-profile-btn"
                            >
                                <div className="w-6 h-6 rounded-full bg-gold text-bg-primary font-display font-bold text-xs flex items-center justify-center">
                                    {getUserInitials()}
                                </div>
                                <span className="font-body text-sm font-semibold text-text-primary max-w-[120px] truncate">
                                    {user.first_name || user.email.split("@")[0]}
                                </span>
                                <svg className="w-3.5 h-3.5 text-text-muted" viewBox="0 0 16 16" fill="none">
                                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-surface border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                                    <div className="px-4 py-2 border-b border-white/6">
                                        <p className="font-body text-xs font-semibold text-text-primary truncate">
                                            {user.full_name || "Spotlight User"}
                                        </p>
                                        <p className="font-body text-[11px] text-text-muted truncate">
                                            {user.email}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleMyTicketsClick}
                                        className="w-full text-left flex items-center gap-2 px-4 py-2 font-body text-xs font-semibold text-text-primary hover:bg-white/5 border-none cursor-pointer transition-colors"
                                        id="dropdown-my-tickets-btn"
                                    >
                                        My Tickets
                                    </button>

                                    <button
                                        onClick={() => {
                                            logout();
                                            setDropdownOpen(false);
                                            setMobileOpen(false);
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-4 py-2 font-body text-xs font-semibold text-crimson hover:bg-crimson/10 border-none cursor-pointer transition-colors"
                                        id="sign-out-btn"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                openModal("login");
                                setMobileOpen(false);
                            }}
                            className="font-body text-sm max-md:text-base font-semibold tracking-wider uppercase text-bg-primary bg-gold hover:bg-gold-hover border-none cursor-pointer px-6 py-2.5 max-md:py-3.5 max-md:px-8 rounded-md md:ml-4 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow-gold/20"
                            id="sign-in-btn"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
