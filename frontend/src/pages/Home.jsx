import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Home() {
  const { user } = useAuth()
  return (
    <>
      <div className="hero text-center mb-5">
        <h1 className="display-5 fw-bold text-white">AI-Powered Crop Yield Prediction<br />& Optimization</h1>
        <p className="lead text-white-50 mt-3">
          Predict yield using soil, weather, irrigation & climate data.<br />
          Get personalized optimization tips for higher profits.
        </p>
        {user ? (
          <Link to="/predict" className="btn btn-warning btn-lg mt-3 px-4">
            <i className="bi bi-lightning-charge"></i> Start Prediction
          </Link>
        ) : (
          <>
            <Link to="/register" className="btn btn-warning btn-lg mt-3 px-4 me-2">Create Farmer Account</Link>
            <Link to="/login" className="btn btn-outline-light btn-lg mt-3 px-4">Login</Link>
          </>
        )}
      </div>

      <div className="row g-4 mb-5">
        {[
          { icon: 'bi-person-plus', color: 'success', title: 'Farmer Accounts', desc: 'Sign up, login, manage profile, farm size, location and crop history securely.' },
          { icon: 'bi-cpu', color: 'primary', title: 'AI Yield Prediction', desc: 'Science-based model using soil NPK, pH, rainfall, temperature, humidity & irrigation.' },
          { icon: 'bi-lightbulb', color: 'warning', title: 'Smart Optimization', desc: 'Actionable tips on fertilizer, irrigation, pH correction and climate suitability.' }
        ].map((f, i) => (
          <div className="col-md-4" key={i}>
            <div className="card h-100 border-0 shadow-sm feature-card">
              <div className="card-body text-center p-4">
                <div className={`feature-icon bg-${f.color}-subtle text-${f.color} mb-3`}>
                  <i className={`bi ${f.icon} fs-2`}></i>
                </div>
                <h5>{f.title}</h5>
                <p className="text-muted small">{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row align-items-center">
        <div className="col-lg-6">
          <h3 className="fw-bold">Supported Crops</h3>
          <p className="text-muted">Rice, Wheat, Maize, Cotton, Sugarcane, Soybean, Groundnut, Mustard, Bajra, Jowar</p>
          <h3 className="fw-bold mt-4">Key Features</h3>
          <ul className="list-unstyled">
            {['Full farmer signup / login', 'Crop record management', 'Soil + Weather + Climate prediction', 'Optimization recommendations', 'Prediction history & dashboard', 'React + Node.js stack'].map((t, i) => (
              <li className="mb-2" key={i}><i className="bi bi-check-circle-fill text-success"></i> {t}</li>
            ))}
          </ul>
        </div>
        <div className="col-lg-6">
          <div className="card border-0 shadow bg-light">
            <div className="card-body p-4">
              <h5 className="fw-bold">How it works</h5>
              <ol className="mb-0">
                <li className="mb-2">Create your free farmer account</li>
                <li className="mb-2">Add your crop & soil details</li>
                <li className="mb-2">Enter current weather / climate data</li>
                <li className="mb-2">Get AI predicted yield (tons/ha)</li>
                <li className="mb-2">Follow optimization tips for better results</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
