import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import SEO from '@/components/SEO'
import './Landing.css'

function Landing() {

  return (
    <>
      <SEO 
        title="Propella — Find Your Home in Cameroon"
        description="Browse verified listings. Book site visits. Pay with Mobile Money."
        keywords="real estate Cameroon, properties Cameroon, house for sale, apartment for rent, land, Yaoundé, Douala, Buea"
      />

      <div className="landing-page">
        {/* NAV */}
        <nav>
          <div className="nav-logo">
            <img src="/app-icon.png" alt="Propella" className="logo-img" />
            <span>Propella</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#landlords">Landlords</a>
          </div>
          <div className="nav-right">
            <Link to="/guest" className="nav-btn nav-btn-web">
              Open Web App
            </Link>
            <a 
              className="nav-btn nav-btn-download" 
              href="https://play.google.com/store/apps/details?id=com.propella.app" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Download App
            </a>
          </div>
        </nav>

        {/* HERO */}
        <div className="hero-wrap">
          <section className="hero">
            <div className="hero-text">
              <h1>Find a home you'll <i>love</i><br />in Cameroon</h1>
              <p className="hero-sub">Browse verified listings. Book site visits. Pay with Mobile Money.</p>
              <div className="hero-badges">
                <a 
                  className="badge badge-apple" 
                  href="https://apps.apple.com/us/app/propellacam/id6759719240" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Icon icon="mdi:apple" width="32" height="32" />
                  <div className="bl">
                    <small>Download on the</small>
                    <strong>App Store</strong>
                  </div>
                </a>
                <a 
                  className="badge badge-google" 
                  href="https://play.google.com/store/apps/details?id=com.propella.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Icon icon="logos:google-play-icon" width="28" height="28" />
                  <div className="bl">
                    <small>GET IT ON</small>
                    <strong>Google Play</strong>
                  </div>
                </a>
              </div>
            </div>
            <div className="hero-phone-wrap">
              <div className="hero-phone">
                <img src="/screenshots/1.png" alt="Propella App" onError={(e) => { e.currentTarget.src = '/app-icon.png' }} />
              </div>
            </div>
          </section>
        </div>

        {/* CITY STRIP */}
        <div className="city-strip">
          <div className="city-label">TOP CITIES</div>
          <div className="city-pill">Yaoundé</div>
          <div className="city-pill">Douala</div>
          <div className="city-pill">Buea</div>
          <div className="city-pill">Bamenda</div>
          <div className="city-pill">Bafoussam</div>
          <div className="city-pill">Limbe</div>
          <div className="city-pill">Garoua</div>
          <div className="city-pill">Maroua</div>
        </div>

        {/* FEATURES */}
        <section id="features" className="features">
          <div className="feat-head">
            <div className="s-label">FEATURES</div>
            <h2 className="s-h2">Everything you need to find your next home</h2>
          </div>
          <div className="feat-grid">
            <div className="feat-card">
              <div className="feat-n">01</div>
              <h3>Browse Verified Listings</h3>
              <p>Explore properties across Cameroon with detailed photos, videos, and information. All listings are verified by our team.</p>
            </div>
            <div className="feat-card">
              <div className="feat-n">02</div>
              <h3>Book Site Visits</h3>
              <p>Schedule property viewings directly through the app. Connect with agents and landlords to arrange convenient visit times.</p>
            </div>
            <div className="feat-card">
              <div className="feat-n">03</div>
              <h3>Secure Payments</h3>
              <p>Pay deposits and rent safely using Mobile Money (MTN, Orange) or bank transfers. All transactions are secure and transparent.</p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="how">
          <div className="how-head">
            <div className="s-label">HOW IT WORKS</div>
            <h2 className="s-h2">Find your home in <i>three</i> simple steps</h2>
          </div>
          <div className="steps">
            <div className="step">
              <img src="/screenshots/1.png" alt="Search" className="step-img" onError={(e) => { e.currentTarget.src = '/app-icon.png' }} />
              <div className="step-tag">STEP 01</div>
              <h3>Search & Filter</h3>
              <p>Use advanced filters to find properties that match your needs—location, price, bedrooms, and more.</p>
            </div>
            <div className="step">
              <img src="/screenshots/2.png" alt="Connect" className="step-img" onError={(e) => { e.currentTarget.src = '/app-icon.png' }} />
              <div className="step-tag">STEP 02</div>
              <h3>Connect with Agents</h3>
              <p>Chat with verified agents, ask questions, and schedule site visits at your convenience.</p>
            </div>
            <div className="step">
              <img src="/screenshots/3.png" alt="Reserve" className="step-img" onError={(e) => { e.currentTarget.src = '/app-icon.png' }} />
              <div className="step-tag">STEP 03</div>
              <h3>Reserve Your Home</h3>
              <p>Make secure payments and complete your reservation directly through the platform.</p>
            </div>
          </div>
        </section>

        {/* LANDLORD SECTION */}
        <section id="landlords" className="landlord">
          <div className="ll-visual">
            <div className="ll-phone">
              <img src="/screenshots/4.png" alt="Landlord App" onError={(e) => { e.currentTarget.src = '/app-icon.png' }} />
            </div>
          </div>
          <div className="ll-copy">
            <div className="s-label">FOR LANDLORDS</div>
            <h2 className="s-h2">List your property and reach <i>thousands</i></h2>
            <p>Join landlords and agents across Cameroon who use Propella to list properties, manage bookings, and get paid faster.</p>
            <div className="stat-row">
              <div>
                <div className="stat-num">100+</div>
                <div className="stat-lbl">Active Listings</div>
              </div>
              <div>
                <div className="stat-num">90+</div>
                <div className="stat-lbl">Agents & Landlords</div>
              </div>
            </div>
            <Link to="/auth/signup" className="text-btn">
              Start Listing
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </section>

        {/* PAYMENT SECTION */}
        <section className="payment">
          <div className="pay-copy">
            <div className="s-label">PAYMENTS</div>
            <h2 className="s-h2">Pay <i>safely</i> with Mobile Money</h2>
            <p>We support all major payment methods in Cameroon, making it easy to pay rent, deposits, and fees securely.</p>
            <div className="pay-methods">
              <div className="pay-pill">
                <div className="pip-logo">
                  <img src="/mtn-logo.svg" alt="MTN" style={{ width: '20px', height: '20px' }} />
                </div>
                MTN Mobile Money
              </div>
              <div className="pay-pill">
                <div className="pip-logo">
                  <img src="/orange-logo.svg" alt="Orange" style={{ width: '20px', height: '20px' }} />
                </div>
                Orange Money
              </div>
            </div>
            <Link to="/auth/signup" className="text-btn-white">
              Learn More
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
          <div className="pay-visual">
            <div className="pay-phone">
              <img src="/screenshots/3.png" alt="Payment" onError={(e) => { e.currentTarget.src = '/app-icon.png' }} />
            </div>
          </div>
        </section>

        {/* WALLET SECTION */}
        <section className="wallet">
          <div className="wallet-visual">
            <div className="wallet-phone">
              <img src="/screenshots/5.png" alt="Wallet" onError={(e) => { e.currentTarget.src = '/app-icon.png' }} />
            </div>
          </div>
          <div className="wallet-copy">
            <div className="s-label">WALLET</div>
            <h2 className="s-h2">Track your <i>earnings</i> and withdraw anytime</h2>
            <p>Landlords and agents can manage their earnings, track commission payments, and withdraw funds directly to their mobile money or bank account.</p>
            <Link to="/auth/signup" className="text-btn">
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="final">
          <h2>Ready to find<br />your <i>dream</i> home?</h2>
          <p>Join thousands of users who trust Propella for their real estate needs.</p>
          <div className="final-btns">
            <a 
              className="badge badge-apple" 
              href="https://apps.apple.com/us/app/propellacam/id6759719240" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Icon icon="mdi:apple" width="32" height="32" />
              <div className="bl">
                <small>Download on the</small>
                <strong>App Store</strong>
              </div>
            </a>
            <a 
              className="badge badge-google" 
              href="https://play.google.com/store/apps/details?id=com.propella.app" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Icon icon="logos:google-play-icon" width="28" height="28" />
              <div className="bl">
                <small>GET IT ON</small>
                <strong>Google Play</strong>
              </div>
            </a>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="foot-logo">Propella</div>
          <small>&copy; 2026 Propella. All rights reserved.</small>
          <div className="foot-links">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/support">Support</Link>
          </div>
        </footer>
      </div>
    </>
  )
}

export default Landing
