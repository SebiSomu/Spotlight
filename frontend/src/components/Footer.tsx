import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__brand-col">
            <a href="/" className="footer__brand">
              <svg className="footer__logo" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="14" cy="14" r="6" fill="#e8a838" />
                <circle cx="14" cy="14" r="10" stroke="#e8a838" strokeWidth="1.5" opacity="0.4" />
                <circle cx="14" cy="14" r="13.5" stroke="#e8a838" strokeWidth="1" opacity="0.15" />
              </svg>
              <span className="footer__brand-text">Spotlight</span>
            </a>
            <p className="footer__tagline">
              The best seats for the best nights.<br />
              Book with confidence.
            </p>
          </div>

          <div className="footer__links-group">
            <h4 className="footer__links-title">Discover</h4>
            <a href="#events" className="footer__link">All Events</a>
            <a href="#artists" className="footer__link">Artists</a>
            <a href="#venues" className="footer__link">Venues</a>
            <a href="#festivals" className="footer__link">Festivals</a>
          </div>

          <div className="footer__links-group">
            <h4 className="footer__links-title">Support</h4>
            <a href="#help" className="footer__link">Help Center</a>
            <a href="#refunds" className="footer__link">Refund Policy</a>
            <a href="#accessibility" className="footer__link">Accessibility</a>
            <a href="#contact" className="footer__link">Contact Us</a>
          </div>

          <div className="footer__links-group">
            <h4 className="footer__links-title">Company</h4>
            <a href="#about" className="footer__link">About</a>
            <a href="#careers" className="footer__link">Careers</a>
            <a href="#press" className="footer__link">Press</a>
            <a href="#partners" className="footer__link">For Venues</a>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">&copy; 2026 Spotlight. All rights reserved.</p>
          <div className="footer__legal">
            <a href="#privacy" className="footer__legal-link">Privacy</a>
            <a href="#terms" className="footer__legal-link">Terms</a>
            <a href="#cookies" className="footer__legal-link">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
