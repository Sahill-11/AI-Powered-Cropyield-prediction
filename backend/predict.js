/**
 * Realistic yield prediction + optimization based on Indian crop science ranges.
 * (Same logic used to generate the original training data)
 */

const CROP_PARAMS = {
  Rice:      { base: 3.8, temp: [24, 32], rain: [1000, 2000], ph: [5.5, 7.0], n: [80, 120], p: [30, 50], k: [30, 50] },
  Wheat:     { base: 3.2, temp: [15, 25], rain: [400, 800],  ph: [6.0, 7.5], n: [100, 150], p: [40, 60], k: [30, 50] },
  Maize:     { base: 4.5, temp: [20, 30], rain: [500, 1000], ph: [5.8, 7.0], n: [90, 140], p: [40, 60], k: [40, 60] },
  Cotton:    { base: 1.8, temp: [25, 35], rain: [600, 1200], ph: [5.8, 8.0], n: [60, 100], p: [30, 50], k: [40, 60] },
  Sugarcane: { base: 70.0, temp: [25, 35], rain: [1200, 2500], ph: [6.0, 7.5], n: [150, 250], p: [50, 80], k: [80, 120] },
  Soybean:   { base: 1.6, temp: [20, 30], rain: [500, 900],  ph: [6.0, 7.0], n: [20, 40], p: [40, 60], k: [30, 50] },
  Groundnut: { base: 1.5, temp: [25, 30], rain: [500, 1000], ph: [5.5, 7.0], n: [20, 40], p: [30, 50], k: [30, 50] },
  Mustard:   { base: 1.4, temp: [15, 25], rain: [300, 600],  ph: [6.0, 7.5], n: [60, 100], p: [30, 50], k: [20, 40] },
  Bajra:     { base: 1.8, temp: [25, 35], rain: [300, 600],  ph: [6.5, 8.0], n: [40, 80], p: [20, 40], k: [20, 40] },
  Jowar:     { base: 1.5, temp: [25, 32], rain: [400, 800],  ph: [6.0, 7.5], n: [40, 80], p: [20, 40], k: [20, 40] }
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function scoreRange(value, idealMin, idealMax, tolerance) {
  const mid = (idealMin + idealMax) / 2;
  const half = (idealMax - idealMin) / 2 + tolerance;
  return clamp(1 - Math.abs(value - mid) / half, 0, 1.15);
}

function predictYield(input) {
  const crop = input.crop || 'Rice';
  const params = CROP_PARAMS[crop] || CROP_PARAMS.Rice;

  const temp = Number(input.temperature) || 28;
  const rain = Number(input.rainfall) || 800;
  const humidity = Number(input.humidity) || 65;
  const ph = Number(input.soil_ph) || 6.5;
  const n = Number(input.nitrogen) || 80;
  const p = Number(input.phosphorus) || 40;
  const k = Number(input.potassium) || 40;
  const fert = Number(input.fertilizer_kg_ha) || 100;
  const irrigation = Number(input.irrigation) ? 1 : 0;
  const area = Number(input.area_ha) || 1;
  const soilMoisture = Number(input.soil_moisture);
  const hasSoilMoisture = input.soil_moisture !== undefined &&
    input.soil_moisture !== null && input.soil_moisture !== '' &&
    Number.isFinite(soilMoisture);

  const tScore = scoreRange(temp, params.temp[0], params.temp[1], 8);
  const rScore = scoreRange(rain, params.rain[0], params.rain[1], 400);
  const phScore = scoreRange(ph, params.ph[0], params.ph[1], 1.2);
  const nScore = scoreRange(n, params.n[0], params.n[1], 40);
  const pScore = scoreRange(p, params.p[0], params.p[1], 25);
  const kScore = scoreRange(k, params.k[0], params.k[1], 25);
  const fertScore = clamp(fert / 140, 0.5, 1.35);
  const irrBonus = irrigation ? 1.18 : 0.90;
  const humScore = humidity >= 45 && humidity <= 90 ? 1.0 : 0.85;

  // Combined factor (weighted)
  const factor =
    tScore * 0.18 +
    rScore * 0.18 +
    phScore * 0.12 +
    nScore * 0.15 +
    pScore * 0.08 +
    kScore * 0.08 +
    fertScore * 0.12 +
    irrBonus * 0.09;

  // Normalize around 1.0
  const normalized = factor / 0.85;
  let yieldT = params.base * normalized * humScore;
  if (hasSoilMoisture) {
    if (soilMoisture < 10) yieldT *= 0.85;
    else if (soilMoisture > 45) yieldT *= 0.9;
  }

  // Small random-like variation based on inputs hash (deterministic)
  const seed = (temp * 7 + rain * 3 + n * 11 + ph * 13) % 100;
  const noise = 0.92 + (seed / 100) * 0.16;
  yieldT = yieldT * noise;

  yieldT = Math.max(0.25, Math.round(yieldT * 100) / 100);

  return {
    predicted_yield: yieldT,
    total_production: Math.round(yieldT * area * 100) / 100,
    unit: 'tons/ha'
  };
}

function generateOptimization(input, predictedYield) {
  const tips = [];
  const crop = input.crop || 'Rice';
  const params = CROP_PARAMS[crop] || CROP_PARAMS.Rice;
  const temp = Number(input.temperature) || 28;
  const rain = Number(input.rainfall) || 800;
  const ph = Number(input.soil_ph) || 6.5;
  const n = Number(input.nitrogen) || 80;
  const p = Number(input.phosphorus) || 40;
  const k = Number(input.potassium) || 40;
  const fert = Number(input.fertilizer_kg_ha) || 100;
  const irrigation = Number(input.irrigation) ? 1 : 0;
  const soilMoisture = Number(input.soil_moisture);
  const hasSoilMoisture = input.soil_moisture !== undefined &&
    input.soil_moisture !== null && input.soil_moisture !== '' &&
    Number.isFinite(soilMoisture);

  if (temp < params.temp[0]) {
    tips.push(`🌡️ Temperature (${temp}°C) is low for ${crop}. Prefer sowing in ${params.temp[0]}–${params.temp[1]}°C window or use early varieties.`);
  } else if (temp > params.temp[1]) {
    tips.push(`🌡️ Temperature (${temp}°C) is high. Ensure irrigation + mulching to reduce heat stress.`);
  }

  if (rain < params.rain[0] && !irrigation) {
    tips.push(`💧 Rainfall (${rain} mm) is below ideal (${params.rain[0]}–${params.rain[1]} mm). Switch to irrigation to avoid major yield loss.`);
  } else if (rain > params.rain[1]) {
    tips.push(`💧 Excess rainfall (${rain} mm). Ensure good drainage to prevent waterlogging.`);
  }

  if (!irrigation && rain < 650) {
    tips.push('🚿 Strongly recommended: Adopt drip or sprinkler irrigation (expected 15–25% yield gain).');
  }

  if (hasSoilMoisture && soilMoisture < 10) {
    tips.push(`💧 Model-estimated topsoil moisture is low (${soilMoisture}%). Check field moisture and consider irrigation.`);
  } else if (hasSoilMoisture && soilMoisture > 45) {
    tips.push(`💧 Model-estimated topsoil moisture is high (${soilMoisture}%). Check field conditions and drainage.`);
  }

  if (ph < params.ph[0]) {
    tips.push(`🧪 Soil pH (${ph}) is acidic. Apply lime (2–4 q/ha) to raise pH toward ${params.ph[0]}–${params.ph[1]}.`);
  } else if (ph > params.ph[1]) {
    tips.push(`🧪 Soil pH (${ph}) is alkaline. Apply gypsum / organic manure for better nutrient uptake.`);
  }

  if (n < params.n[0]) {
    tips.push(`🌿 Nitrogen low (${n} kg/ha). Apply urea/DAP to reach ${params.n[0]}–${params.n[1]} kg/ha.`);
  } else if (n > params.n[1] + 50) {
    tips.push(`🌿 Excess Nitrogen (${n}). Reduce urea to avoid lodging & pest attack.`);
  }

  if (p < params.p[0]) tips.push('🌿 Phosphorus is low. Apply SSP/DAP for better root & flowering.');
  if (k < params.k[0]) tips.push('🌿 Potassium is low. Apply MOP for grain filling & stress tolerance.');

  if (fert < 60) {
    tips.push('📦 Fertilizer use is low. Balanced NPK + micronutrients can increase yield 10–20%.');
  }

  if (tips.length === 0) {
    tips.push('✅ Current conditions look good for the selected crop. Follow recommended package of practices.');
  }

  tips.push(`📊 Expected yield: ~${predictedYield} t/ha. With optimized irrigation + balanced fertilizer, potential improvement: 10–25%.`);
  return tips;
}

module.exports = { predictYield, generateOptimization, CROP_PARAMS };
