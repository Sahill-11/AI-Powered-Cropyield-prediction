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

  if (!data) return <div className="text-center py-5">Loading dashboard...</div>

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Welcome, {user?.name} 👋</h2>
        <Link to="/predict" className="btn btn-success"><i className="bi bi-graph-up"></i> New Prediction</Link>
      </div>

      <div className="row g-3 mb-4">
        {[
          { icon: 'bi-basket', color: 'success', value: data.total_crops, label: 'Crop Records' },
          { icon: 'bi-graph-up-arrow', color: 'primary', value: data.total_predictions, label: 'Predictions' },
          { icon: 'bi-geo-alt', color: 'warning', value: user?.state || '—', label: 'State' },
          { icon: 'bi-rulers', color: 'info', value: `${user?.farm_size_ha || 1} ha`, label: 'Farm Size' }
        ].map((s, i) => (
          <div className="col-md-3" key={i}>
            <div className="card border-0 shadow-sm text-center p-3">
              <div className={`text-${s.color} fs-3`}><i className={`bi ${s.icon}`}></i></div>
              <h4 className="mb-0">{s.value}</h4>
              <small className="text-muted">{s.label}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between">
              <strong>Recent Crops</strong>
              <Link to="/crops">View all</Link>
            </div>
            <div className="card-body p-0">
              {data.recent_crops.length ? (
                <table className="table table-hover mb-0">
                  <thead><tr><th>Crop</th><th>Season</th><th>Area</th><th>Soil</th></tr></thead>
                  <tbody>
                    {data.recent_crops.map(c => (
                      <tr key={c.id}>
                        <td>{c.crop_name}</td>
                        <td>{c.season || '—'}</td>
                        <td>{c.area_ha} ha</td>
                        <td>{c.soil_type || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted p-3 mb-0">No crops yet. <Link to="/crops">Add crop</Link></p>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between">
              <strong>Recent Predictions</strong>
              <Link to="/history">View all</Link>
            </div>
            <div className="card-body p-0">
              {data.recent_predictions.length ? (
                <table className="table table-hover mb-0">
                  <thead><tr><th>Crop</th><th>Yield</th><th>Production</th><th>Date</th></tr></thead>
                  <tbody>
                    {data.recent_predictions.map(p => (
                      <tr key={p.id}>
                        <td>{p.crop}</td>
                        <td><span className="badge bg-success">{p.predicted_yield} t/ha</span></td>
                        <td>{p.total_production} t</td>
                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted p-3 mb-0">No predictions yet. <Link to="/predict">Predict now</Link></p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
