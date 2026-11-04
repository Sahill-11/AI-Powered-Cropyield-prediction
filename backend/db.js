const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_PATH = path.join(__dirname, 'data.json');
const DB_NAME = process.env.DB_NAME || 'crop_yield_ai';
let pool;

if (!/^[a-zA-Z0-9_]+$/.test(DB_NAME)) {
  throw new Error('DB_NAME may contain only letters, numbers and underscores');
}

function parseJson(value) {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

async function initializeDatabase() {
  if (!process.env.DB_USER) {
    throw new Error('Set DB_USER in backend/.env before starting the server');
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(320) NOT NULL UNIQUE,
        phone VARCHAR(64) NOT NULL DEFAULT '',
        password VARCHAR(255) NOT NULL,
        state VARCHAR(128) NOT NULL DEFAULT '',
        district VARCHAR(128) NOT NULL DEFAULT '',
        village VARCHAR(128) NOT NULL DEFAULT '',
        farm_size_ha DECIMAL(12, 2) NOT NULL DEFAULT 1,
        created_at VARCHAR(40) NOT NULL
      ) ENGINE=InnoDB
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS crops (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        created_at VARCHAR(40) NOT NULL,
        payload JSON NOT NULL,
        INDEX crops_user_created (user_id, created_at),
        CONSTRAINT crops_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        predicted_yield DOUBLE NOT NULL,
        total_production DOUBLE NOT NULL,
        created_at VARCHAR(40) NOT NULL,
        payload JSON NOT NULL,
        INDEX predictions_user_created (user_id, created_at),
        CONSTRAINT predictions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_migrations (
        name VARCHAR(100) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    await migrateLegacyJson();
  } catch (error) {
    await pool.end();
    pool = undefined;
    throw error;
  }
}

async function migrateLegacyJson() {
  const [migrations] = await pool.execute(
    'SELECT name FROM app_migrations WHERE name = ?',
    ['json_to_mysql_v1']
  );
  if (migrations.length) return;

  const legacy = fs.existsSync(DB_PATH)
    ? JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
    : { users: [], crops: [], predictions: [] };
  const users = Array.isArray(legacy.users) ? legacy.users : [];
  const crops = Array.isArray(legacy.crops) ? legacy.crops : [];
  const predictions = Array.isArray(legacy.predictions) ? legacy.predictions : [];
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    for (const user of users) {
      await connection.execute(
        `INSERT IGNORE INTO users
          (id, name, email, phone, password, state, district, village, farm_size_ha, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id, user.name, user.email, user.phone || '', user.password,
          user.state || '', user.district || '', user.village || '',
          Number(user.farm_size_ha) || 1, user.created_at || new Date().toISOString()
        ]
      );
    }
    for (const crop of crops) {
      await connection.execute(
        'INSERT IGNORE INTO crops (id, user_id, created_at, payload) VALUES (?, ?, ?, ?)',
        [crop.id, crop.user_id, crop.created_at || new Date().toISOString(), JSON.stringify(crop)]
      );
    }
    for (const prediction of predictions) {
      await connection.execute(
        `INSERT IGNORE INTO predictions
          (id, user_id, predicted_yield, total_production, created_at, payload)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          prediction.id, prediction.user_id, Number(prediction.predicted_yield) || 0,
          Number(prediction.total_production) || 0, prediction.created_at || new Date().toISOString(),
          JSON.stringify(prediction)
        ]
      );
    }
    await connection.execute(
      'INSERT INTO app_migrations (name) VALUES (?)',
      ['json_to_mysql_v1']
    );
    await connection.commit();
    console.log(`Migrated legacy JSON data to MySQL (${users.length} users, ${crops.length} crops, ${predictions.length} predictions).`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findUserByEmail(email) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] ? { ...rows[0], farm_size_ha: Number(rows[0].farm_size_ha) } : null;
}

async function findUserById(id) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? { ...rows[0], farm_size_ha: Number(rows[0].farm_size_ha) } : null;
}

async function createUser(user) {
  await pool.execute(
    `INSERT INTO users
      (id, name, email, phone, password, state, district, village, farm_size_ha, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id, user.name, user.email, user.phone, user.password, user.state,
      user.district, user.village, user.farm_size_ha, user.created_at
    ]
  );
}

async function updateUser(id, values) {
  await pool.execute(
    `UPDATE users SET name = ?, phone = ?, state = ?, district = ?, village = ?, farm_size_ha = ?
     WHERE id = ?`,
    [values.name, values.phone, values.state, values.district, values.village, values.farm_size_ha, id]
  );
}

function decodeRows(rows) {
  return rows.map(row => ({
    ...parseJson(row.payload),
    id: row.id,
    user_id: row.user_id,
    created_at: row.created_at
  }));
}

async function getCropsForUser(userId) {
  const [rows] = await pool.execute(
    'SELECT id, user_id, created_at, payload FROM crops WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return decodeRows(rows);
}

async function createCrop(crop) {
  await pool.execute(
    'INSERT INTO crops (id, user_id, created_at, payload) VALUES (?, ?, ?, ?)',
    [crop.id, crop.user_id, crop.created_at, JSON.stringify(crop)]
  );
}

async function deleteCrop(id, userId) {
  const [result] = await pool.execute('DELETE FROM crops WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows > 0;
}

async function createPrediction(prediction) {
  await pool.execute(
    `INSERT INTO predictions
      (id, user_id, predicted_yield, total_production, created_at, payload)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      prediction.id, prediction.user_id, prediction.predicted_yield,
      prediction.total_production, prediction.created_at, JSON.stringify(prediction)
    ]
  );
}

async function getPredictionsForUser(userId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, predicted_yield, total_production, created_at, payload
     FROM predictions WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  return decodeRows(rows).map((prediction, index) => ({
    ...prediction,
    predicted_yield: rows[index].predicted_yield,
    total_production: rows[index].total_production
  }));
}

module.exports = {
  initializeDatabase,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  getCropsForUser,
  createCrop,
  deleteCrop,
  createPrediction,
  getPredictionsForUser
};
