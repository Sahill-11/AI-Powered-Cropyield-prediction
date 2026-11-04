require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { predictYield, generateOptimization } = require('./predict');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'crop-yield-ai-secret-key-2024';

app.use(cors());
app.use(express.json());

const asyncHandler = handler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

// Auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ---------- Auth ----------
app.post('/api/register', asyncHandler(async (req, res) => {
  const { name, email, phone, password, state, district, village, farm_size_ha } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password required' });
  }
  const normalizedEmail = email.toLowerCase();
  if (await db.findUserByEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name,
    email: normalizedEmail,
    phone: phone || '',
    password: hash,
    state: state || '',
    district: district || '',
    village: village || '',
    farm_size_ha: Number(farm_size_ha) || 1,
    created_at: new Date().toISOString()
  };
  try {
    await db.createUser(user);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    throw error;
  }
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, state: user.state, farm_size_ha: user.farm_size_ha }
  });
}));

app.post('/api/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await db.findUserByEmail((email || '').toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: {
      id: user.id, name: user.name, email: user.email, phone: user.phone,
      state: user.state, district: user.district, village: user.village,
      farm_size_ha: user.farm_size_ha
    }
  });
}));

app.get('/api/me', auth, asyncHandler(async (req, res) => {
  const user = await db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    id: user.id, name: user.name, email: user.email, phone: user.phone,
    state: user.state, district: user.district, village: user.village,
    farm_size_ha: user.farm_size_ha
  });
}));

app.put('/api/profile', auth, asyncHandler(async (req, res) => {
  const user = await db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { name, phone, state, district, village, farm_size_ha } = req.body;
  await db.updateUser(req.user.id, {
    name: name || user.name,
    phone: phone === undefined ? user.phone : phone,
    state: state === undefined ? user.state : state,
    district: district === undefined ? user.district : district,
    village: village === undefined ? user.village : village,
    farm_size_ha: farm_size_ha === undefined ? user.farm_size_ha : Number(farm_size_ha)
  });
  res.json({ success: true });
}));

// ---------- Live weather ----------
async function fetchWeatherJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Weather provider returned HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

app.get('/api/weather', auth, async (req, res) => {
  const location = String(req.query.location || '').trim();
  if (!location || location.length > 100) {
    return res.status(400).json({ error: 'Enter a location (up to 100 characters)' });
  }

  try {
    const geocodingUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
    geocodingUrl.search = new URLSearchParams({
      name: location,
      count: '1',
      language: 'en',
      format: 'json',
      countryCode: 'IN'
    });
    const geocoding = await fetchWeatherJson(geocodingUrl);
    const place = geocoding.results?.[0];
    if (!place) {
      return res.status(404).json({ error: `No Indian location found for "${location}"` });
    }

    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.search = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: 'temperature_2m,relative_humidity_2m,precipitation,soil_moisture_0_to_1cm',
      daily: 'precipitation_sum',
      forecast_days: '7',
      timezone: 'auto'
    });
    const forecast = await fetchWeatherJson(forecastUrl);
    const current = forecast.current;
    const soilMoisture = current?.soil_moisture_0_to_1cm;
    if (!current || !Number.isFinite(current.temperature_2m) ||
        !Number.isFinite(current.relative_humidity_2m) || !Number.isFinite(soilMoisture)) {
      throw new Error('Weather provider returned incomplete current conditions');
    }

    res.json({
      location: [place.name, place.admin1].filter(Boolean).join(', '),
      observed_at: current.time,
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      current_precipitation_mm: current.precipitation,
      soil_moisture_percent: Math.round(soilMoisture * 1000) / 10,
      soil_moisture_source: 'Open-Meteo model estimate, top 1 cm',
      rainfall_next_7_days_mm: (forecast.daily?.precipitation_sum || [])
        .reduce((total, value) => total + (Number(value) || 0), 0)
    });
  } catch (e) {
    console.error('Weather fetch error:', e.message);
    res.status(502).json({ error: 'Could not fetch live weather. Please try again shortly.' });
  }
});

// ---------- Crops ----------
app.get('/api/crops', auth, asyncHandler(async (req, res) => {
  const crops = await db.getCropsForUser(req.user.id);
  res.json(crops);
}));

app.post('/api/crops', auth, asyncHandler(async (req, res) => {
  const crop = {
    ...req.body,
    id: uuidv4(),
    user_id: req.user.id,
    created_at: new Date().toISOString()
  };
  await db.createCrop(crop);
  res.json(crop);
}));

app.delete('/api/crops/:id', auth, asyncHandler(async (req, res) => {
  await db.deleteCrop(req.params.id, req.user.id);
  res.json({ success: true });
}));

// ---------- Predict ----------
app.post('/api/predict', auth, asyncHandler(async (req, res) => {
  const input = req.body;
  const result = predictYield(input);
  const tips = generateOptimization(input, result.predicted_yield);

  const record = {
    ...input,
    id: uuidv4(),
    user_id: req.user.id,
    predicted_yield: result.predicted_yield,
    total_production: result.total_production,
    optimization_tips: tips,
    created_at: new Date().toISOString()
  };
  await db.createPrediction(record);

  res.json({ ...result, tips, id: record.id });
}));

app.get('/api/history', auth, asyncHandler(async (req, res) => {
  const preds = await db.getPredictionsForUser(req.user.id);
  res.json(preds);
}));

app.get('/api/dashboard', auth, asyncHandler(async (req, res) => {
  const [crops, preds] = await Promise.all([
    db.getCropsForUser(req.user.id),
    db.getPredictionsForUser(req.user.id)
  ]);
  res.json({
    total_crops: crops.length,
    total_predictions: preds.length,
    recent_crops: crops.slice(0, 5),
    recent_predictions: preds.slice(0, 5)
  });
}));

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'CropYield AI Backend running' }));

app.use((error, req, res, next) => {
  console.error('Request failed:', error.message);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Request failed. Check the backend logs for details.' });
});

db.initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\nCropYield AI Backend running on http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health\n`);
    });
  })
  .catch(error => {
    console.error('Could not initialize MySQL:', error.message);
    process.exitCode = 1;
  });
