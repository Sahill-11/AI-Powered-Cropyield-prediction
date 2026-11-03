import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function History() {
  const [preds, setPreds] = useState([])

  useEffect(() => {
    api.get('/history').then(r => setPreds(r.data)).catch(console.error)
  }, [])

  return (
    <>
      <h2 className="mb-4">Prediction History</h2>
      {preds.length ? (
        <div className="table-responsive card border-0 shadow-sm">
          <table className="table table-hover mb-0">
            <thead className="table-success">
              <tr>
                <th>Date</th><th>Crop</th><th>State</th><th>Season</th>
                <th>Temp</th><th>Rain</th><th>pH</th><th>N-P-K</th>
                <th>Yield</th><th>Production</th>
              </tr>
            </thead>
            <tbody>
              {preds.map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td><strong>{p.crop}</strong></td>
                  <td>{p.state}</td>
                  <td>{p.season}</td>
                  <td>{p.temperature}°C</td>
                  <td>{p.rainfall} mm</td>
                  <td>{p.soil_ph}</td>
                  <td>{p.nitrogen}-{p.phosphorus}-{p.potassium}</td>
                  <td><span className="badge bg-success">{p.predicted_yield} t/ha</span></td>
                  <td>{p.total_production} t</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="alert alert-info">No predictions yet. <Link to="/predict">Make your first prediction</Link></div>
      )}
    </>
  )
}
