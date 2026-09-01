import { useState } from 'react'
import heroBg from '../assets/hero-bg.jpg'
import './Hero.css'

export default function Hero() {
  const [query, setQuery] = useState('')

  return (
    <section className="hero" id="hero-section">
      <div className="hero__bg">
        <img
          src={heroBg}
          alt="Massive concert crowd with dramatic stage lighting"
          className="hero__bg-img"
        />
        <div className="hero__overlay" />
      </div>

      <div className="hero__content">
        <div className="hero__badge" id="hero-badge">
          <span className="hero__badge-dot" />
          Live events near you
        </div>

        <h1 className="hero__headline" id="hero-headline">
          Every Great Night<br />
          <span className="hero__headline-accent">Starts With a Ticket</span>
        </h1>

        <p className="hero__sub" id="hero-subheadline">
          Discover live shows, lock in your seats, feel the bass.
        </p>

        <form
          className="hero__search"
          id="hero-search-form"
          onSubmit={(e) => {
            e.preventDefault()
            /* Will integrate with search API */
          }}
        >
          <div className="hero__search-inner">
            <svg
              className="hero__search-icon"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13.5 13.5L17.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className="hero__search-input"
              placeholder="Search artists, venues, or events…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              id="hero-search-input"
              aria-label="Search artists, venues, or events"
            />
            <button type="submit" className="hero__search-btn" id="find-shows-btn">
              Find Shows
            </button>
          </div>
        </form>

        <div className="hero__stats" id="hero-stats">
          <div className="hero__stat">
            <span className="hero__stat-num">2,400+</span>
            <span className="hero__stat-label">Live Events</span>
          </div>
          <div className="hero__stat-divider" />
          <div className="hero__stat">
            <span className="hero__stat-num">850+</span>
            <span className="hero__stat-label">Venues</span>
          </div>
          <div className="hero__stat-divider" />
          <div className="hero__stat">
            <span className="hero__stat-num">1.2M</span>
            <span className="hero__stat-label">Tickets Sold</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll" id="scroll-indicator">
        <span className="hero__scroll-text">Explore</span>
        <div className="hero__scroll-line" />
      </div>
    </section>
  )
}
