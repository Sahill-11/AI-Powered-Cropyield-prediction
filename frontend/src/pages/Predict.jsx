import { useState } from 'react'
import { useAuth } from '../AuthContext'
import api from '../api'

const CROPS = ["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Soybean", "Groundnut", "Mustard", "Bajra", "Jowar"]
const STATES = ["Punjab", "Haryana", "Uttar Pradesh", "Maharashtra", "Karnataka", "Andhra Pradesh",
  "Tamil Nadu", "Madhya Pradesh", "Rajasthan", "Gujarat", "Bihar", "West Bengal"]
const SEASONS = ["Kharif", "Rabi", "Zaid"]
const SOILS = ["Loamy", "Clay", "Sandy", "Silty", "Black", "Red"]

export default function Predict() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    crop: 'Rice', state: user?.state || 'Punjab', season: 'Kharif', soil_type: 'Loamy',
    temperature: 28, rainfall: 800, humidity: 65, soil_ph: 6.5,
    nitrogen: 80, phosphorus: 40, potassium: 40, fertilizer_kg_ha: 100,
    irrigation: 1, area_ha: 1, days_to_harvest: 120
  })
  const [result, setResult] = useState(null)
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const payload = {
        ...form,
        temperature: Number(form.temperature),
        rainfall: Number(form.rainfall),
        humidity: Number(form.humidity),
        soil_ph: Number(form.soil_ph),
        nitrogen: Number(form.nitrogen),
        phosphorus: Number(form.phosphorus),
        potassium: Number(form.potassium),
        fertilizer_kg_ha: Number(form.fertilizer_kg_ha),
        irrigation: Number(form.irrigation),
        area_ha: Number(form.area_ha),
        days_to_harvest: Number(form.days_to_harvest)
      }
      const res = await api.post('/predict', payload)
      setResult(res.data)
      setTips(res.data.tips || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="mb-4"><i className="bi bi-graph-up-arrow text-success"></i> Crop Yield Prediction & Optimization</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-success text-white"><strong>Input Parameters</strong></div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Crop *</label>
                    <select name="crop" className="form-select" value={form.crop} onChange={handleChange}>
                      {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">State</label>
                    <select name="state" className="form-select" value={form.state} onChange={handleChange}>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Season</label>
                    <select name="season" className="form-select" value={form.season} onChange={handleChange}>
                      {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Soil Type</label>
                    <select name="soil_type" className="form-select" value={form.soil_type} onChange={handleChange}>
                      {SOILS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="col-12"><hr className="my-1" /><small className="text-muted">Weather & Climate</small></div>
                  <div className="col-md-4">
                    <label className="form-label">Temp (°C)</label>
                    <input type="number" name="temperature" className="form-control" step="0.1" value={form.temperature} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Rainfall (mm)</label>
                    <input type="number" name="rainfall" className="form-control" value={form.rainfall} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Humidity (%)</label>
                    <input type="number" name="humidity" className="form-control" value={form.humidity} onChange={handleChange} />
                  </div>

                  <div className="col-12"><hr className="my-1" /><small className="text-muted">Soil Nutrients</small></div>
                  <div className="col-md-3">
                    <label className="form-label">pH</label>
                    <input type="number" name="soil_ph" className="form-control" step="0.1" value={form.soil_ph} onChange={handleChange} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">N</label>
                    <input type="number" name="nitrogen" className="form-control" value={form.nitrogen} onChange={handleChange} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">P</label>
                    <input type="number" name="phosphorus" className="form-control" value={form.phosphorus} onChange={handleChange} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">K</label>
                    <input type="number" name="potassium" className="form-control" value={form.potassium} onChange={handleChange} />
                  </div>

                  <div className="col-12"><hr className="my-1" /><small className="text-muted">Inputs & Area</small></div>
                  <div className="col-md-4">
                    <label className="form-label">Fertilizer kg/ha</label>
                    <input type="number" name="fertilizer_kg_ha" className="form-control" value={form.fertilizer_kg_ha} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Irrigation</label>
                    <select name="irrigation" className="form-select" value={form.irrigation} onChange={handleChange}>
                      <option value="1">Irrigated</option>
                      <option value="0">Rainfed</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Area (ha)</label>
                    <input type="number" name="area_ha" className="form-control" step="0.1" value={form.area_ha} onChange={handleChange} />
                  </div>
                </div>
                <button type="submit" className="btn btn-success w-100 mt-4" disabled={loading}>
                  {loading ? 'Predicting...' : <><i className="bi bi-cpu"></i> Predict Yield & Get Optimization</>}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          {result ? (
            <>
              <div className="card border-0 shadow-sm mb-4 result-card">
                <div className="card-body text-center p-4">
                  <h5 className="text-muted">Predicted Yield</h5>
                  <h1 className="display-4 fw-bold text-success">{result.predicted_yield} <small className="fs-5">tons/ha</small></h1>
                  <p className="mb-0">Total estimated production for {form.area_ha} ha: <strong>{result.total_production} tons</strong></p>
                  <p className="small text-muted mt-2 mb-0">{form.crop} · {form.season} · {form.state}</p>
                </div>
              </div>
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-warning-subtle">
                  <strong><i className="bi bi-lightbulb"></i> Optimization Recommendations</strong>
                </div>
                <div className="card-body">
                  <ul className="list-group list-group-flush">
                    {tips.map((t, i) => <li key={i} className="list-group-item">{t}</li>)}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="card border-0 shadow-sm h-100 d-flex align-items-center justify-content-center bg-light">
              <div className="text-center p-5 text-muted">
                <i className="bi bi-bar-chart-line fs-1"></i>
                <p className="mt-3 mb-0">Fill the form and click Predict to see AI yield forecast and optimization tips.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
