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
  const [location, setLocation] = useState(user?.district || user?.state || 'Punjab')
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState('')
  const [result, setResult] = useState(null)
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const fetchWeather = async () => {
    setWeatherError('')
    setWeatherLoading(true)
    try {
      const geocodingUrl = new URL('https://geocoding-api.open-meteo.com/v1/search')
      geocodingUrl.search = new URLSearchParams({
        name: location.trim(),
        count: '1',
        language: 'en',
        format: 'json',
        countryCode: 'IN'
      })
      const geocodingResponse = await fetch(geocodingUrl)
      if (!geocodingResponse.ok) throw new Error('Location lookup is temporarily unavailable.')
      const geocoding = await geocodingResponse.json()
      const place = geocoding.results?.[0]
      if (!place) throw new Error(`No Indian location found for "${location.trim()}".`)

      const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast')
      forecastUrl.search = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        current: 'temperature_2m,relative_humidity_2m,precipitation,soil_moisture_0_to_1cm',
        daily: 'precipitation_sum',
        forecast_days: '7',
        timezone: 'auto'
      })
      const forecastResponse = await fetch(forecastUrl)
      if (!forecastResponse.ok) throw new Error('Weather provider is temporarily unavailable.')
      const forecast = await forecastResponse.json()
      const current = forecast.current
      const moisture = current?.soil_moisture_0_to_1cm
      if (!current || !Number.isFinite(current.temperature_2m) ||
          !Number.isFinite(current.relative_humidity_2m) || !Number.isFinite(moisture)) {
        throw new Error('Weather provider returned incomplete conditions for this location.')
      }

      const weatherData = {
        location: [place.name, place.admin1].filter(Boolean).join(', '),
        observed_at: current.time,
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        soil_moisture_percent: Math.round(moisture * 1000) / 10,
        soil_moisture_source: 'Open-Meteo model estimate, top 1 cm',
        rainfall_next_7_days_mm: (forecast.daily?.precipitation_sum || [])
          .reduce((total, value) => total + (Number(value) || 0), 0)
      }
      setWeather(weatherData)
      setForm(prev => ({
        ...prev,
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        soil_moisture: weatherData.soil_moisture_percent
      }))
    } catch (err) {
      setWeatherError(err.message || 'Could not fetch live weather. Check your internet connection and try again.')
    } finally {
      setWeatherLoading(false)
    }
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
        days_to_harvest: Number(form.days_to_harvest),
        ...(weather ? {
          weather_location: weather.location,
          weather_observed_at: weather.observed_at,
          soil_moisture_source: weather.soil_moisture_source
        } : {}),
        ...(form.soil_moisture !== undefined && form.soil_moisture !== ''
          ? { soil_moisture: Number(form.soil_moisture) }
          : {})
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
      <section className="page-heading-row mb-4">
        <div>
          <span className="section-kicker">PLAN WITH BETTER INSIGHT</span>
          <h1>Crop yield prediction</h1>
          <p>Enter your crop, soil and weather details to explore a yield estimate.</p>
        </div>
        <div className="predict-heading-icon"><i className="bi bi-graph-up-arrow"></i></div>
      </section>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card predict-form-card">
            <div className="card-header predict-card-heading">
              <span className="predict-heading-icon small"><i className="bi bi-sliders"></i></span>
              <div><strong>Farm conditions</strong><small>Tell us about this growing season</small></div>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12"><div className="form-section-label"><span>01</span> Crop & location</div></div>
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
                  <div className="col-12">
                    <label className="form-label">City / district for live weather</label>
                    <div className="input-group">
                      <input className="form-control" value={location} onChange={e => {
                        setLocation(e.target.value)
                        setWeather(null)
                      }}
                        placeholder="e.g. Ludhiana" aria-label="City or district for live weather" />
                      <button type="button" className="btn btn-outline-success" onClick={fetchWeather}
                        disabled={weatherLoading || !location.trim()}>
                        {weatherLoading ? 'Fetching...' : <><i className="bi bi-cloud-sun"></i> Fetch live weather</>}
                      </button>
                    </div>
                    {weatherError && <div className="text-danger small mt-2">{weatherError}</div>}
                    {weather && <div className="text-success small mt-2">
                      Live data for {weather.location} · updated {weather.observed_at} · next 7 days: {weather.rainfall_next_7_days_mm.toFixed(1)} mm rain
                    </div>}
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

                  <div className="col-12"><div className="form-section-label"><span>02</span> Weather & climate</div></div>
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
                  <div className="col-md-4">
                    <label className="form-label">Soil moisture (%)</label>
                    <input type="number" name="soil_moisture" className="form-control" min="0" max="100"
                      step="0.1" value={form.soil_moisture || ''} onChange={handleChange} />
                    <div className="form-text">Model estimate for top 1 cm; verify in the field.</div>
                  </div>
                  <div className="col-12">
                    <div className="form-text">Season rainfall (mm) below is still entered manually; the API shows only the next 7-day forecast.</div>
                  </div>

                  <div className="col-12"><div className="form-section-label"><span>03</span> Soil nutrients</div></div>
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

                  <div className="col-12"><div className="form-section-label"><span>04</span> Farm inputs</div></div>
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
                <div className="result-card-image" role="img" aria-label="Healthy green crops in a field"></div>
                <div className="card-body text-center p-4">
                  <span className="result-label"><i className="bi bi-stars me-2"></i>YOUR YIELD OUTLOOK</span>
                  <h1 className="display-4 fw-bold text-success mt-2">{result.predicted_yield} <small className="fs-5">tons/ha</small></h1>
                  <p className="mb-3">Estimated production across <strong>{form.area_ha} ha</strong>: <strong>{result.total_production} tons</strong></p>
                  <div className="result-context"><span>{form.crop}</span><span>{form.season}</span><span>{form.state}</span></div>
                </div>
              </div>
              <div className="card border-0 shadow-sm">
                <div className="card-header recommendations-heading">
                  <span className="recommendation-icon"><i className="bi bi-lightbulb"></i></span>
                  <div><strong>Recommendations</strong><small>Ideas to help optimize your growing conditions</small></div>
                </div>
                <div className="card-body">
                  <ul className="list-group list-group-flush">
                    {tips.map((t, i) => <li key={i} className="list-group-item">{t}</li>)}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="card predict-placeholder h-100 d-flex align-items-center justify-content-center">
              <div className="predict-placeholder-image" role="img" aria-label="Sunlit farmland"></div>
              <div className="text-center p-4 p-md-5">
                <span className="history-empty-icon"><i className="bi bi-bar-chart-line"></i></span>
                <h2>Your forecast will appear here</h2>
                <p>Complete the farm conditions and run a prediction to see your estimated yield and recommendations.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
