import { useState, useEffect } from 'react'
import './Navbar.css'

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
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`} id="main-nav">
      <div className="navbar__inner">
        <a href="/" className="navbar__brand" id="brand-link">
          {/* Spotlight icon — a simple beam/spot SVG */}
          <svg
            className="navbar__logo"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="14" cy="14" r="6" fill="#e8a838" />
            <circle cx="14" cy="14" r="10" stroke="#e8a838" strokeWidth="1.5" opacity="0.4" />
            <circle cx="14" cy="14" r="13.5" stroke="#e8a838" strokeWidth="1" opacity="0.15" />
          </svg>
          <span className="navbar__wordmark">Spotlight</span>
        </a>

        <button
          className={`navbar__hamburger${mobileOpen ? ' navbar__hamburger--open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          id="hamburger-btn"
        >
          <span /><span /><span />
        </button>

        <div className={`navbar__links${mobileOpen ? ' navbar__links--open' : ''}`}>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="navbar__link"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a href="#sign-in" className="navbar__cta" id="sign-in-btn" onClick={() => setMobileOpen(false)}>
            Sign In
          </a>
        </div>
      </div>
    </nav>
  )
}
