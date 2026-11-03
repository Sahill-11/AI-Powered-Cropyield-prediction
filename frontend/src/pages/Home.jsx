import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Home() {
  const { user } = useAuth()
  return (
    <div className="home-page">
      <section className="hero-panel mb-5">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot"></span> DATA-DRIVEN FARMING</span>
          <h1>Grow with confidence.<br /><span>Harvest your potential.</span></h1>
          <p>Turn your soil and weather data into a clearer picture of the season ahead. Get a yield estimate and practical recommendations for your farm.</p>
          <div className="hero-actions">
            {user ? (
              <Link to="/predict" className="btn btn-success btn-lg">Start a prediction <i className="bi bi-arrow-right ms-2"></i></Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-success btn-lg">Create your account <i className="bi bi-arrow-right ms-2"></i></Link>
                <Link to="/login" className="btn btn-outline-light btn-lg">Log in</Link>
              </>
            )}
          </div>
          <div className="hero-note"><i className="bi bi-check-circle-fill"></i> Crop insights built around your farm data</div>
        </div>
        <div className="hero-image" role="img" aria-label="Sunlight over a green crop field">
          <div className="image-caption">
            <span className="caption-icon"><i className="bi bi-sun"></i></span>
            <span><strong>Every season,</strong><br />a smarter starting point</span>
          </div>
        </div>
        <div className="hero-decoration" aria-hidden="true"><i className="bi bi-flower3"></i></div>
      </section>

      <section className="intro-row mb-4">
        <div>
          <span className="section-kicker">A better view of your farm</span>
          <h2>Make each decision count</h2>
        </div>
        <p>Bring crop, soil and climate details together to explore the factors that shape your yield.</p>
      </section>

      <div className="row g-4 mb-5">
        {[
          { icon: 'bi-graph-up-arrow', number: '01', title: 'Explore a yield estimate', desc: 'Use crop, soil, weather and irrigation details to get an estimate for your growing season.' },
          { icon: 'bi-droplet-half', number: '02', title: 'Understand your inputs', desc: 'See how rainfall, soil nutrients and local growing conditions inform your crop outlook.' },
          { icon: 'bi-lightbulb', number: '03', title: 'Plan your next steps', desc: 'Review tailored recommendations for irrigation, fertilizer and soil management.' }
        ].map((f, i) => (
          <div className="col-md-4" key={i}>
            <div className="card h-100 border-0 feature-card">
              <div className="card-body p-4">
                <div className="feature-topline"><span className="feature-icon"><i className={`bi ${f.icon}`}></i></span><span>{f.number}</span></div>
                <h5>{f.title}</h5>
                <p className="text-muted small mb-0">{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="crop-strip">
        <div>
          <span className="section-kicker">Made for your fields</span>
          <h3>One place for your growing season</h3>
          <p>Keep crop records, compare past predictions and build a more complete picture over time.</p>
          <Link to={user ? '/dashboard' : '/register'} className="text-success fw-semibold text-decoration-none">Explore your farm workspace <i className="bi bi-arrow-right ms-1"></i></Link>
        </div>
        <div className="crop-visual" role="img" aria-label="Golden field ready for harvest">
          <div className="crop-visual-label"><i className="bi bi-geo-alt-fill me-2"></i>Insights rooted in your fields</div>
        </div>
      </section>

      <section className="supported-crops">
        <span className="section-kicker">A diverse range of crops</span>
        <div className="crop-pills">
          {['Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Groundnut', 'Mustard', 'Bajra', 'Jowar'].map(crop => (
            <span className="crop-pill" key={crop}><i className="bi bi-leaf-fill"></i>{crop}</span>
          ))}
        </div>
      </section>
    </div>
  )
}
