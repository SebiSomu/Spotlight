import { useState, useEffect } from 'react'

const navLinks = [
  { label: 'Events', href: '#events' },
  { label: 'Artists', href: '#artists' },
  { label: 'Venues', href: '#venues' },
  { label: 'My Tickets', href: '#tickets' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-5 md:px-10 lg:px-12 transition-all duration-350 ease-in-out ${
        scrolled
          ? 'bg-[rgba(8,8,14,0.92)] shadow-[0_1px_0_rgba(232,168,56,0.08)] backdrop-blur-sm'
          : 'bg-transparent'
      }`}
      id="main-nav"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-18">
        {/* Brand */}
        <a href="/" className="flex items-center gap-2.5 no-underline text-text-primary group" id="brand-link">
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
              mobileOpen ? 'translate-y-1.75 rotate-45' : ''
            }`}
          />
          <span
            className={`block w-5.5 h-0.5 bg-text-primary rounded-full transition-all duration-200 ${
              mobileOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block w-5.5 h-0.5 bg-text-primary rounded-full transition-all duration-300 ${
              mobileOpen ? '-translate-y-1.75 -rotate-45' : ''
            }`}
          />
        </button>

        {/* Links & CTA */}
        <div
          className={`flex items-center gap-2 transition-all duration-300 md:opacity-100 md:pointer-events-auto ${
            mobileOpen
              ? 'fixed inset-0 bg-[rgba(8,8,14,0.97)] flex-col justify-center gap-4 opacity-100 pointer-events-auto z-40'
              : 'max-md:opacity-0 max-md:pointer-events-none max-md:fixed max-md:inset-0 max-md:bg-[rgba(8,8,14,0.97)] max-md:flex-col max-md:justify-center max-md:gap-4'
          }`}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-body text-sm max-md:text-lg font-medium tracking-wide uppercase text-text-secondary no-underline px-4 py-2 max-md:py-3 rounded-md hover:text-text-primary hover:bg-white/5 transition-colors duration-200"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#sign-in"
            className="font-body text-sm max-md:text-base font-semibold tracking-wider uppercase text-bg-primary bg-gold hover:bg-gold-hover no-underline px-6 py-2.5 max-md:py-3.5 max-md:px-8 rounded-md md:ml-4 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow-gold/20"
            id="sign-in-btn"
            onClick={() => setMobileOpen(false)}
          >
            Sign In
          </a>
        </div>
      </div>
    </nav>
  )
}
