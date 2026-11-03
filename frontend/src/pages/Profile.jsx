import { useState } from 'react'
import { useAuth } from '../AuthContext'

const STATES = ["Punjab", "Haryana", "Uttar Pradesh", "Maharashtra", "Karnataka", "Andhra Pradesh",
  "Tamil Nadu", "Madhya Pradesh", "Rajasthan", "Gujarat", "Bihar", "West Bengal"]

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    state: user?.state || '',
    district: user?.district || '',
    village: user?.village || '',
    farm_size_ha: user?.farm_size_ha || 1
  })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      await updateProfile({ ...form, farm_size_ha: Number(form.farm_size_ha) })
      setMsg('Profile updated successfully!')
    } catch {
      setMsg('Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-7">
        <div className="card shadow border-0">
          <div className="card-body p-4">
            <h3 className="mb-4"><i className="bi bi-person-gear"></i> My Profile</h3>
            {msg && <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-danger'}`}>{msg}</div>}
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Name</label>
                  <input name="name" className="form-control" value={form.name} onChange={handleChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email (read-only)</label>
                  <input className="form-control" value={user?.email || ''} disabled />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Phone</label>
                  <input name="phone" className="form-control" value={form.phone} onChange={handleChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Farm Size (ha)</label>
                  <input type="number" name="farm_size_ha" className="form-control" step="0.1" value={form.farm_size_ha} onChange={handleChange} />
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">State</label>
                  <select name="state" className="form-select" value={form.state} onChange={handleChange}>
                    <option value="">Select</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">District</label>
                  <input name="district" className="form-control" value={form.district} onChange={handleChange} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Village</label>
                  <input name="village" className="form-control" value={form.village} onChange={handleChange} />
                </div>
              </div>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
