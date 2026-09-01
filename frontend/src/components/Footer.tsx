export default function Footer() {
    return (
        <footer
            className="bg-bg-deep border-t border-white/6 py-12 sm:py-18 px-5 md:px-10 lg:px-12"
            id="main-footer"
        >
            <div className="max-w-7xl mx-auto">
                {/* Top Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-12 sm:mb-16">
                    {/* Brand Col */}
                    <div className="lg:col-span-2">
                        <a
                            href="/"
                            className="inline-flex items-center gap-2.5 no-underline mb-4 group"
                        >
                            <svg
                                className="w-6 h-6"
                                viewBox="0 0 28 28"
                                fill="none"
                                aria-hidden="true"
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
                        </a>
                        <p className="font-body text-sm leading-relaxed text-text-muted max-w-sm">
                            The best seats for the best nights.
                            <br />
                            Book live shows with confidence.
                        </p>
                    </div>

                    {/* Links 1 */}
                    <div className="flex flex-col gap-3">
                        <h4 className="font-body text-xs font-bold tracking-widest uppercase text-text-secondary mb-1">
                            Discover
                        </h4>
                        <a
                            href="#events"
                            className="font-body text-sm text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            All Events
                        </a>
                        <a
                            href="#artists"
                            className="font-body text-sm text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            Artists
                        </a>
                        <a
                            href="#venues"
                            className="font-body text-sm text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            Venues
                        </a>
                        <a
                            href="#festivals"
                            className="font-body text-sm text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            Festivals
                        </a>
                    </div>

                    {/* Links 2 */}
                    <div className="flex flex-col gap-3">
                        <h4 className="font-body text-xs font-bold tracking-widest uppercase text-text-secondary mb-1">
                            Support
                        </h4>
                        <a
                            href="#help"
                            className="font-body text-sm text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            Help Center
                        </a>
                        <a
                            href="#refunds"
                            className="font-body text-sm text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            Refund Policy
                        </a>
                        <a
                            href="#accessibility"
                            className="font-body text-sm text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            Accessibility
                        </a>
                        <a
                            href="#contact"
                            className="font-body text-sm text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            Contact Us
                        </a>
                    </div>

                    {/* Links 3 */}
                    <div className="flex flex-col gap-3">
                        <h4 className="font-body text-xs font-bold tracking-widest uppercase text-text-secondary mb-1">
                            Company
                        </h4>
                        <a
                            href="#about"
                            className="font-body text-sm text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            About
                        </a>
                        <a
                            href="#careers"
                            className="font-body text-sm text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            Careers
                        </a>
                        <a
                            href="#press"
                            className="font-body text-sm text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            Press
                        </a>
                        <a
                            href="#partners"
                            className="font-body text-sm text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            For Venues
                        </a>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/6 text-center sm:text-left">
                    <p className="font-body text-xs text-text-muted">
                        &copy; 2026 Spotlight. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a
                            href="#privacy"
                            className="font-body text-xs text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            Privacy
                        </a>
                        <a
                            href="#terms"
                            className="font-body text-xs text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            Terms
                        </a>
                        <a
                            href="#cookies"
                            className="font-body text-xs text-text-muted hover:text-text-primary no-underline transition-colors duration-200"
                        >
                            Cookies
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
