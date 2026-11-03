import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import api from '../api'

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data)).catch(console.error)
  }, [])

  if (!data) return <div className="text-center py-5"><div className="spinner-border text-success" role="status"><span className="visually-hidden">Loading...</span></div><p className="text-muted mt-3 mb-0">Preparing your farm overview...</p></div>

  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome mb-4">
        <div>
          <span className="section-kicker">YOUR FARM AT A GLANCE</span>
          <h1>Welcome back, {user?.name} <span aria-hidden="true">👋</span></h1>
          <p>Here’s what’s happening across your crops and predictions.</p>
        </div>
        <Link to="/predict" className="btn btn-success"><i className="bi bi-plus-lg me-2"></i>New prediction</Link>
      </section>

      <div className="row g-3 mb-4">
        {[
          { icon: 'bi-flower1', tone: 'green', value: data.total_crops, label: 'Crop records', note: 'Across your farm' },
          { icon: 'bi-graph-up-arrow', tone: 'blue', value: data.total_predictions, label: 'Predictions', note: 'Yield estimates made' },
          { icon: 'bi-geo-alt', tone: 'gold', value: user?.state || '—', label: 'Farm location', note: 'Registered state' },
          { icon: 'bi-bounding-box', tone: 'sage', value: `${user?.farm_size_ha || 1} ha`, label: 'Farm size', note: 'Total registered area' }
        ].map((stat, i) => (
          <div className="col-sm-6 col-xl-3" key={i}>
            <div className="stat-card h-100">
              <div className={`stat-icon stat-icon-${stat.tone}`}><i className={`bi ${stat.icon}`}></i></div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-note">{stat.note}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="dashboard-banner mb-4">
        <div className="dashboard-banner-copy">
          <span>MAKE YOUR NEXT MOVE</span>
          <h2>Every season starts with a good plan.</h2>
          <p>Explore a crop yield estimate using your farm’s soil and weather conditions.</p>
          <Link to="/predict" className="btn btn-light">Run a prediction <i className="bi bi-arrow-right ms-2"></i></Link>
        </div>
        <div className="dashboard-banner-photo" role="img" aria-label="Green crops growing in a field"></div>
      </section>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card dashboard-table-card h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <div><span className="section-kicker">YOUR FARM</span><strong className="d-block mt-1">Recent crops</strong></div>
              <Link to="/crops" className="dashboard-view-link">View all <i className="bi bi-arrow-right"></i></Link>
            </div>
            <div className="card-body p-0">
              {data.recent_crops.length ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead><tr><th>Crop</th><th>Season</th><th>Area</th><th>Soil</th></tr></thead>
                    <tbody>
                      {data.recent_crops.map(c => (
                        <tr key={c.id}>
                          <td><span className="crop-table-icon"><i className="bi bi-flower1"></i></span><strong>{c.crop_name}</strong></td>
                          <td><span className="season-tag">{c.season || '—'}</span></td>
                          <td>{c.area_ha} ha</td>
                          <td>{c.soil_type || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="dashboard-empty"><i className="bi bi-flower1"></i><p>No crop records yet.</p><Link to="/crops">Add your first crop</Link></div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card dashboard-table-card h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <div><span className="section-kicker">YIELD OUTLOOK</span><strong className="d-block mt-1">Recent predictions</strong></div>
              <Link to="/history" className="dashboard-view-link">View history <i className="bi bi-arrow-right"></i></Link>
            </div>
            <div className="card-body p-0">
              {data.recent_predictions.length ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead><tr><th>Crop</th><th>Yield</th><th>Production</th><th>Date</th></tr></thead>
                    <tbody>
                      {data.recent_predictions.map(p => (
                        <tr key={p.id}>
                          <td><span className="crop-table-icon"><i className="bi bi-graph-up"></i></span><strong>{p.crop}</strong></td>
                          <td><span className="yield-tag">{p.predicted_yield} t/ha</span></td>
                          <td>{p.total_production} t</td>
                          <td>{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="dashboard-empty"><i className="bi bi-bar-chart-line"></i><p>No predictions yet.</p><Link to="/predict">Create a yield estimate</Link></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
