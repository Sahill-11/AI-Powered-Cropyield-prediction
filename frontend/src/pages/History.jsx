import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function History() {
  const [preds, setPreds] = useState([])

  useEffect(() => {
    api.get('/history').then(r => setPreds(r.data)).catch(console.error)
  }, [])

  return (
    <div className="history-page">
      <section className="page-heading-row mb-4">
        <div>
          <span className="section-kicker">LEARN FROM EVERY SEASON</span>
          <h1>Prediction history</h1>
          <p>Review your past yield estimates and the conditions behind them.</p>
        </div>
        <Link to="/predict" className="btn btn-success"><i className="bi bi-plus-lg me-2"></i>New prediction</Link>
      </section>

      <div className="history-summary mb-3">
        <span className="history-summary-icon"><i className="bi bi-clock-history"></i></span>
        <span><strong>{preds.length}</strong> {preds.length === 1 ? 'prediction saved' : 'predictions saved'}</span>
      </div>

      {preds.length ? (
        <div className="table-responsive card history-table-card">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Date</th><th>Crop</th><th>Location</th><th>Season</th>
                <th>Temperature</th><th>Rainfall</th><th>Soil pH</th><th>N-P-K</th>
                <th>Yield</th><th>Production</th>
              </tr>
            </thead>
            <tbody>
              {preds.map(p => (
                <tr key={p.id}>
                  <td className="history-date">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td><span className="crop-table-icon"><i className="bi bi-flower1"></i></span><strong>{p.crop}</strong></td>
                  <td><i className="bi bi-geo-alt me-1 text-muted"></i>{p.state}</td>
                  <td><span className="season-tag">{p.season}</span></td>
                  <td>{p.temperature}°C</td>
                  <td>{p.rainfall} mm</td>
                  <td>{p.soil_ph}</td>
                  <td>{p.nitrogen}-{p.phosphorus}-{p.potassium}</td>
                  <td><span className="yield-tag">{p.predicted_yield} t/ha</span></td>
                  <td><strong>{p.total_production} t</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="history-empty">
          <span className="history-empty-icon"><i className="bi bi-bar-chart-line"></i></span>
          <h2>Your history starts here</h2>
          <p>Run a yield prediction to save your first estimate and track it here.</p>
          <Link to="/predict" className="btn btn-success"><i className="bi bi-graph-up-arrow me-2"></i>Make your first prediction</Link>
        </div>
      )}
    </div>
  )
}
