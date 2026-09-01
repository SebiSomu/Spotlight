import crowd1 from "../assets/crowd-1.jpg";
import crowd3 from "../assets/crowd-3.jpg";
import crowd4 from "../assets/crowd-4.jpg";

export default function ExperienceShowcase() {
    return (
        <section
            className="bg-[#08080e] py-20 sm:py-28 px-5 md:px-10 lg:px-12 border-t border-white/5 relative overflow-hidden"
            id="experience-section"
        >
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-gold/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-crimson/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto">
                {/* Section Tag */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="font-body text-xs font-bold tracking-widest uppercase text-gold bg-gold/10 border border-gold/20 px-3.5 py-1.5 rounded-full inline-block mb-3">
                        What An Experience
                    </span>
                    <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-text-primary mb-4">
                        Nothing Compares to <br />
                        <span className="bg-gradient-to-r from-gold via-[#f0c66e] to-gold bg-clip-text text-transparent">
                            Being In The Crowd
                        </span>
                    </h2>
                    <p className="font-body text-sm sm:text-base text-text-muted leading-relaxed">
                        Surround yourself with thousands of fans screaming every lyrics. Feel the bass reverberate through your chest and capture unforgettable core memories.
                    </p>
                </div>

                {/* Showcase Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Main Feature Card - Crowd 1 */}
                    <div className="lg:col-span-7 relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <div className="aspect-[16/10] overflow-hidden">
                            <img
                                src={crowd1}
                                alt="Electric concert crowd with lights"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#08080e] via-[#08080e]/40 to-transparent" />
                        </div>
                        
                        {/* Overlay Card Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                            <div className="inline-flex items-center gap-2 font-body text-xs font-semibold text-gold mb-2">
                                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 0L10.35 5.26L16 5.82L11.72 9.57L12.94 15.14L8 12.27L3.06 15.14L4.28 9.57L0 5.82L5.65 5.26L8 0Z" />
                                </svg>
                                Pure Stadium Energy
                            </div>
                            <h3 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                                Lock In Front-Row & Pit Access
                            </h3>
                            <p className="font-body text-xs sm:text-sm text-text-muted max-w-lg">
                                Secure verified tickets straight from primary venues with zero guesswork. Instant mobile delivery to your wallet.
                            </p>
                        </div>
                    </div>

                    {/* Secondary Crowd Cards Stack */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        {/* Card 2 */}
                        <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-surface">
                            <div className="aspect-[16/9] sm:aspect-[21/9] lg:aspect-[16/8] overflow-hidden">
                                <img
                                    src={crowd3}
                                    alt="Concert stage lights and atmosphere"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#08080e] via-[#08080e]/30 to-transparent" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                                <h4 className="font-display text-lg font-bold text-text-primary mb-1">
                                    100% Guaranteed Seats
                                </h4>
                                <p className="font-body text-xs text-text-muted">
                                    Every booking backed by our Spotlight Buyer Protection guarantee.
                                </p>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-surface">
                            <div className="aspect-[16/9] sm:aspect-[21/9] lg:aspect-[16/8] overflow-hidden">
                                <img
                                    src={crowd4}
                                    alt="Audience singing along under laser beams"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#08080e] via-[#08080e]/30 to-transparent" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                                <h4 className="font-display text-lg font-bold text-text-primary mb-1">
                                    Unmatched Acoustic Vibes
                                </h4>
                                <p className="font-body text-xs text-text-muted">
                                    From intimate historic theaters to world-famous arenas.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Quote Banner */}
                <div className="mt-12 bg-surface/40 border border-white/6 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold font-display text-xl font-bold shrink-0">
                            ⚡
                        </div>
                        <div>
                            <h4 className="font-display text-base sm:text-lg font-bold text-text-primary">
                                "The best concert booking app experience of 2026."
                            </h4>
                            <p className="font-body text-xs text-text-muted">
                                Join over 1.2 million music enthusiasts securing tickets daily.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
