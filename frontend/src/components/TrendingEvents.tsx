import { useEffect, useRef } from 'react'
import event1 from '../assets/crowd-1.jpg'
import event2 from '../assets/crowd-2.jpg'
import event3 from '../assets/crowd-3.jpg'
import event4 from '../assets/crowd-4.jpg'
import './TrendingEvents.css'

interface EventData {
  id: number
  image: string
  artist: string
  venue: string
  date: string
  price: number
  tag?: string
}

const events: EventData[] = [
  {
    id: 1,
    image: event1,
    artist: 'Marcus Vane',
    venue: 'The Roxy, Los Angeles',
    date: 'Sep 14, 2026',
    price: 75,
    tag: 'Selling Fast',
  },
  {
    id: 2,
    image: event2,
    artist: 'Neon Drift',
    venue: 'Echostage, Washington DC',
    date: 'Sep 21, 2026',
    price: 120,
  },
  {
    id: 3,
    image: event3,
    artist: 'The Rust & Ruin',
    venue: "Bowery Ballroom, NYC",
    date: 'Oct 3, 2026',
    price: 45,
    tag: 'Intimate Show',
  },
  {
    id: 4,
    image: event4,
    artist: 'Aria Blaze',
    venue: 'Madison Square Garden, NYC',
    date: 'Oct 18, 2026',
    price: 185,
    tag: 'Almost Sold Out',
  },
]

function EventCard({ event, index }: { event: EventData; index: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('event-card--visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="event-card"
      style={{ '--card-delay': `${index * 0.12}s` } as React.CSSProperties}
      id={`event-card-${event.id}`}
    >
      <div className="event-card__img-wrap">
        <img src={event.image} alt={`${event.artist} live`} className="event-card__img" loading="lazy" />
        <div className="event-card__img-overlay" />
        {event.tag && (
          <span className="event-card__tag">{event.tag}</span>
        )}
      </div>
      <div className="event-card__body">
        <h3 className="event-card__artist">{event.artist}</h3>
        <p className="event-card__venue">{event.venue}</p>
        <div className="event-card__footer">
          <span className="event-card__date">
            <svg viewBox="0 0 16 16" fill="none" className="event-card__date-icon" aria-hidden="true">
              <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
              <path d="M2 7h12" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {event.date}
          </span>
          <span className="event-card__price">From ${event.price}</span>
        </div>
        <button className="event-card__btn" id={`get-tickets-${event.id}`}>
          Get Tickets
          <svg viewBox="0 0 16 16" fill="none" className="event-card__btn-arrow" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function TrendingEvents() {
  return (
    <section className="trending" id="trending-section">
      <div className="trending__inner">
        <div className="trending__header">
          <div>
            <h2 className="trending__title" id="trending-title">Trending This Week</h2>
            <p className="trending__subtitle">The hottest shows people are booking right now</p>
          </div>
          <a href="#events" className="trending__see-all" id="see-all-link">
            See All Events
            <svg viewBox="0 0 16 16" fill="none" className="trending__see-all-arrow" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        <div className="trending__grid" id="trending-grid">
          {events.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
