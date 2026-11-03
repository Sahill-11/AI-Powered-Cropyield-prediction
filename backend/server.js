const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb, updateDb } = require('./db');
const { predictYield, generateOptimization } = require('./predict');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'crop-yield-ai-secret-key-2024';

app.use(cors());
app.use(express.json());

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
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phone, password, state, district, village, farm_size_ha } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }
    const db = getDb();
    if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password: hash,
      state: state || '',
      district: district || '',
      village: village || '',
      farm_size_ha: Number(farm_size_ha) || 1,
      created_at: new Date().toISOString()
    };
    updateDb(d => d.users.push(user));
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, state: user.state, farm_size_ha: user.farm_size_ha }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.email === (email || '').toLowerCase());
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/me', auth, (req, res) => {
  const db = getDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    id: user.id, name: user.name, email: user.email, phone: user.phone,
    state: user.state, district: user.district, village: user.village,
    farm_size_ha: user.farm_size_ha
  });
});

app.put('/api/profile', auth, (req, res) => {
  updateDb(d => {
    const user = d.users.find(u => u.id === req.user.id);
    if (!user) return;
    const { name, phone, state, district, village, farm_size_ha } = req.body;
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (state !== undefined) user.state = state;
    if (district !== undefined) user.district = district;
    if (village !== undefined) user.village = village;
    if (farm_size_ha !== undefined) user.farm_size_ha = Number(farm_size_ha);
  });
  res.json({ success: true });
});

// ---------- Crops ----------
app.get('/api/crops', auth, (req, res) => {
  const db = getDb();
  const crops = db.crops.filter(c => c.user_id === req.user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(crops);
});

app.post('/api/crops', auth, (req, res) => {
  const crop = {
    id: uuidv4(),
    user_id: req.user.id,
    ...req.body,
    created_at: new Date().toISOString()
  };
  updateDb(d => d.crops.push(crop));
  res.json(crop);
});

app.delete('/api/crops/:id', auth, (req, res) => {
  updateDb(d => {
    d.crops = d.crops.filter(c => !(c.id === req.params.id && c.user_id === req.user.id));
  });
  res.json({ success: true });
});

// ---------- Predict ----------
app.post('/api/predict', auth, (req, res) => {
  try {
    const input = req.body;
    const result = predictYield(input);
    const tips = generateOptimization(input, result.predicted_yield);

    const record = {
      id: uuidv4(),
      user_id: req.user.id,
      ...input,
      predicted_yield: result.predicted_yield,
      total_production: result.total_production,
      optimization_tips: tips,
      created_at: new Date().toISOString()
    };
    updateDb(d => d.predictions.push(record));

    res.json({ ...result, tips, id: record.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/history', auth, (req, res) => {
  const db = getDb();
  const preds = db.predictions
    .filter(p => p.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(preds);
});

app.get('/api/dashboard', auth, (req, res) => {
  const db = getDb();
  const crops = db.crops.filter(c => c.user_id === req.user.id);
  const preds = db.predictions.filter(p => p.user_id === req.user.id);
  res.json({
    total_crops: crops.length,
    total_predictions: preds.length,
    recent_crops: crops.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
    recent_predictions: preds.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
  });
});

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'CropYield AI Backend running' }));

app.listen(PORT, () => {
  console.log(`\n🚀 CropYield AI Backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
