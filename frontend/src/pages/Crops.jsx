import { useEffect, useState } from 'react'
import api from '../api'

const CROPS = ["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Soybean", "Groundnut", "Mustard", "Bajra", "Jowar"]
const SEASONS = ["Kharif", "Rabi", "Zaid"]
const SOILS = ["Loamy", "Clay", "Sandy", "Silty", "Black", "Red"]
const IRR = ["Rainfed", "Canal", "Tube-well", "Drip", "Sprinkler"]

export default function Crops() {
  const [crops, setCrops] = useState([])
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({
    crop_name: 'Rice', season: 'Kharif', soil_type: 'Loamy', area_ha: 1,
    nitrogen: '', phosphorus: '', potassium: '', soil_ph: '', irrigation_type: 'Canal', fertilizer_used_kg: '', notes: ''
  })

  const load = () => api.get('/crops').then(r => setCrops(r.data)).catch(console.error)
  useEffect(() => { load() }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post('/crops', {
      ...form,
      area_ha: Number(form.area_ha) || 1,
      nitrogen: form.nitrogen ? Number(form.nitrogen) : null,
      phosphorus: form.phosphorus ? Number(form.phosphorus) : null,
      potassium: form.potassium ? Number(form.potassium) : null,
      soil_ph: form.soil_ph ? Number(form.soil_ph) : null,
      fertilizer_used_kg: form.fertilizer_used_kg ? Number(form.fertilizer_used_kg) : null
    })
    setShow(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this crop record?')) return
    await api.delete(`/crops/${id}`)
    load()
  }

  return (
    <>
      <section className="page-heading-row mb-4">
        <div>
          <span className="section-kicker">YOUR FIELDS, ORGANIZED</span>
          <h1>My crop records</h1>
          <p>Keep your crop, soil and irrigation details together in one place.</p>
        </div>
        <button className="btn btn-success" onClick={() => setShow(true)}><i className="bi bi-plus-lg me-2"></i>Add crop</button>
      </section>

      <div className="crop-overview mb-3">
        <div className="crop-overview-icon"><i className="bi bi-flower1"></i></div>
        <div><strong>{crops.length}</strong><span>{crops.length === 1 ? ' crop record' : ' crop records'}</span></div>
        <span className="crop-overview-note">Farm records at a glance</span>
      </div>

      {crops.length ? (
        <div className="table-responsive card crop-table-card">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Crop</th><th>Season</th><th>Soil</th><th>Area</th><th>N-P-K</th><th>pH</th><th>Irrigation</th><th></th>
              </tr>
            </thead>
            <tbody>
              {crops.map(c => (
                <tr key={c.id}>
                  <td><span className="crop-table-icon"><i className="bi bi-flower1"></i></span><strong>{c.crop_name}</strong></td>
                  <td><span className="season-tag">{c.season || '—'}</span></td>
                  <td>{c.soil_type || '—'}</td>
                  <td>{c.area_ha} ha</td>
                  <td>{c.nitrogen || '—'} - {c.phosphorus || '—'} - {c.potassium || '—'}</td>
                  <td>{c.soil_ph || '—'}</td>
                  <td>{c.irrigation_type || '—'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger crop-delete-button" onClick={() => handleDelete(c.id)} aria-label={`Delete ${c.crop_name} record`}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="crop-empty">
          <span className="history-empty-icon"><i className="bi bi-flower1"></i></span>
          <h2>Start your crop journal</h2>
          <p>Add a crop record to keep its season, soil, nutrients and irrigation details together.</p>
          <button className="btn btn-success" onClick={() => setShow(true)}><i className="bi bi-plus-lg me-2"></i>Add your first crop</button>
        </div>
      )}

      {show && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Add New Crop Record</h5>
                  <button type="button" className="btn-close" onClick={() => setShow(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Crop *</label>
                      <select name="crop_name" className="form-select" value={form.crop_name} onChange={handleChange}>
                        {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Season</label>
                      <select name="season" className="form-select" value={form.season} onChange={handleChange}>
                        {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Soil Type</label>
                      <select name="soil_type" className="form-select" value={form.soil_type} onChange={handleChange}>
                        {SOILS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Area (ha)</label>
                      <input type="number" name="area_ha" className="form-control" step="0.1" value={form.area_ha} onChange={handleChange} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Irrigation</label>
                      <select name="irrigation_type" className="form-select" value={form.irrigation_type} onChange={handleChange}>
                        {IRR.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Fertilizer (kg)</label>
                      <input type="number" name="fertilizer_used_kg" className="form-control" value={form.fertilizer_used_kg} onChange={handleChange} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Soil pH</label>
                      <input type="number" name="soil_ph" className="form-control" step="0.1" value={form.soil_ph} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Nitrogen</label>
                      <input type="number" name="nitrogen" className="form-control" value={form.nitrogen} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Phosphorus</label>
                      <input type="number" name="phosphorus" className="form-control" value={form.phosphorus} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Potassium</label>
                      <input type="number" name="potassium" className="form-control" value={form.potassium} onChange={handleChange} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Notes</label>
                      <textarea name="notes" className="form-control" rows="2" value={form.notes} onChange={handleChange}></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShow(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success">Save Crop</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
