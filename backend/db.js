const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

const defaultData = {
  users: [],
  crops: [],
  predictions: []
};

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('DB load error', e.message);
  }
  return { ...defaultData };
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getDb() {
  return load();
}

function updateDb(updater) {
  const data = load();
  updater(data);
  save(data);
  return data;
}

module.exports = { getDb, updateDb, save, load };
