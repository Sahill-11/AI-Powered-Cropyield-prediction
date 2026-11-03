import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const STATES = ["Punjab", "Haryana", "Uttar Pradesh", "Maharashtra", "Karnataka", "Andhra Pradesh",
  "Tamil Nadu", "Madhya Pradesh", "Rajasthan", "Gujarat", "Bihar", "West Bengal"]

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', state: '', district: '', village: '', farm_size_ha: 1
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-7">
        <div className="card shadow border-0">
          <div className="card-body p-4">
            <h3 className="text-center mb-4"><i className="bi bi-person-plus text-success"></i> Create Farmer Account</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Full Name *</label>
                  <input name="name" className="form-control" value={form.name} onChange={handleChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email *</label>
                  <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Phone</label>
                  <input name="phone" className="form-control" value={form.phone} onChange={handleChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Password *</label>
                  <input type="password" name="password" className="form-control" value={form.password} onChange={handleChange} required minLength={6} />
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
              <div className="mb-3">
                <label className="form-label">Farm Size (hectares)</label>
                <input type="number" name="farm_size_ha" className="form-control" step="0.1" min="0.1" value={form.farm_size_ha} onChange={handleChange} />
              </div>
              <button type="submit" className="btn btn-success w-100" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
            <p className="text-center mt-3 mb-0">Already have account? <Link to="/login">Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
