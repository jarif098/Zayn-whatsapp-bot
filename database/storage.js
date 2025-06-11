const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { MongoClient } = require('mongodb');

const config = require('../config.json');

let db;
let mongoClient;
let mongoDb;
let mongoCollection;

const jsonDir = path.join(__dirname, 'jsondata');
if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir);

const dataCache = {
  userMoney: [],
  userData: [],
  prefixesData: [],
  groupSettings: []
};

async function initStorage() {
  const storeType = config.storeType.toLowerCase();
  
  if (storeType === 'sqlite') {
    await initSQLite();
  } else if (storeType === 'mongo') {
    await initMongo();
  } else {
    await initJSON();
  }

  await loadCachedData(); 

  console.log(`Storage initialized using ${storeType} backend.`);
}


// ======= SQLite =========

async function initSQLite() {
  const dbPath = path.join(__dirname, 'storage.sqlite');
  db = new sqlite3.Database(dbPath);

const tables = {
  userMoney: `CREATE TABLE IF NOT EXISTS userMoney (id TEXT PRIMARY KEY, money INTEGER, msgCount INTEGER)`,
  userData: `CREATE TABLE IF NOT EXISTS userData (id TEXT PRIMARY KEY, data TEXT)`,
  prefixesData: `CREATE TABLE IF NOT EXISTS prefixesData (id TEXT PRIMARY KEY, prefix TEXT)`,
  groupSettings: `CREATE TABLE IF NOT EXISTS groupSettings (id TEXT PRIMARY KEY, settings TEXT)`
};


  for (const sql of Object.values(tables)) {
    await runSQL(sql);
  }

  dataCache.userMoney = await loadTable('userMoney');
  dataCache.userData = await loadTable('userData');
  dataCache.prefixesData = await loadTable('prefixesData');
  dataCache.groupSettings = await loadTable('groupSettings');
}

function runSQL(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allSQL(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function loadTable(tableName) {
  try {
    const rows = await allSQL(`SELECT * FROM ${tableName}`);
    if (tableName === 'userData') {
      return rows.map(row => ({
        id: row.id,
        data: JSON.parse(row.data)
      }));
    }
    return rows;
  } catch (err) {
    if (err.message.includes('no such table')) return [];
    throw err;
  }
}

async function saveTable(tableName, data) {
  let insertSQL = '';
  let makeParams;

  if (tableName === 'userMoney') {
    insertSQL = `
      INSERT INTO userMoney (id, money, msgCount)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        money = excluded.money,
        msgCount = excluded.msgCount
    `;
    makeParams = (item) => [item.id, item.money ?? 0, item.msgCount ?? 0];
  } else if (tableName === 'userData') {
    insertSQL = `
      INSERT INTO userData (id, data)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET
        data = excluded.data
    `;
    makeParams = (item) => [item.id, JSON.stringify(item.data)];
  } else if (tableName === 'prefixesData') {
    insertSQL = `
      INSERT INTO prefixesData (id, prefix)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET
        prefix = excluded.prefix
    `;
    makeParams = (item) => [item.id, item.prefix];
  } else if (tableName === 'groupSettings') {
    insertSQL = `
      INSERT INTO groupSettings (id, settings)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET
        settings = excluded.settings
    `;
    makeParams = (item) => [item.id, item.settings];
  }

  for (const item of data) {
    await runSQL(insertSQL, makeParams(item));
  }
}


// ======= MongoDB =========

async function initMongo() {
  mongoClient = new MongoClient(config.mongoUri);
  await mongoClient.connect();
  mongoDb = mongoClient.db(config.mongoDbName);

  mongoCollection = {
    userMoney: mongoDb.collection('userMoney'),
    userData: mongoDb.collection('userData'),
    prefixesData: mongoDb.collection('prefixesData'),
    groupSettings: mongoDb.collection('groupSettings')
  };

  await Promise.all(
    Object.values(mongoCollection).map(coll =>
      coll.createIndex({ id: 1 }, { unique: true })
    )
  );

  for (const key of Object.keys(mongoCollection)) {
    dataCache[key] = await mongoCollection[key].find().toArray();
    if (key === 'userData') {
      dataCache[key] = dataCache[key].map(item => {
        if (typeof item.data === 'string') {
          try {
            item.data = JSON.parse(item.data);
          } catch {}
        }
        return item;
      });
    }
  }
}

async function saveMongo(key) {
  if (!mongoCollection[key]) throw new Error(`No mongo collection for key ${key}`);
  await mongoCollection[key].deleteMany({});
  if (dataCache[key].length > 0) {
    if (key === 'userData') {
      const toInsert = dataCache[key].map(item => ({
        ...item,
        data: JSON.stringify(item.data)
      }));
      await mongoCollection[key].insertMany(toInsert);
    } else {
      await mongoCollection[key].insertMany(dataCache[key]);
    }
  }
}

// ======= JSON =========

async function initJSON() {
  for (const key of Object.keys(dataCache)) {
    const filePath = path.join(jsonDir, `${key}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]');
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    try {
      dataCache[key] = JSON.parse(raw);
    } catch {
      dataCache[key] = [];
    }
  }
}

function saveJSON(key) {
  if (!dataCache[key]) {
    dataCache[key] = [];
  }
  const filePath = path.join(jsonDir, `${key}.json`);
  fs.writeFileSync(filePath, JSON.stringify(dataCache[key], null, 2));
}

// ======= Generic API =========

async function getData(key) {
  if (!dataCache[key]) dataCache[key] = [];
  return dataCache[key];
}

async function saveData(key) {
  if (!key || !(key in dataCache)) {
    throw new Error(`saveData: Invalid key "${key}" or key not loaded.`);
  }

  if (!Array.isArray(dataCache[key])) {
    dataCache[key] = [];
  }

  const storeType = config.storeType.toLowerCase();
  if (storeType === 'sqlite') {
    await saveTable(key, dataCache[key]);
  } else if (storeType === 'mongo') {
    await saveMongo(key);
  } else {
    saveJSON(key);
  }
}


// ======= Message Counting =========

async function countUserMessage(groupId, userJid, userMoney, SaveData) {
  if (!groupId.endsWith('@g.us')) return;

  const id = `${groupId}_${userJid}`;
  let user = userMoney.find(u => u.id === id);
  if (!user) {
    user = { id, money: 0, msgCount: 1 };
    userMoney.push(user);
  } else {
    user.msgCount = (user.msgCount || 0) + 1;
  }

  console.log(`Counted message from ${userJid} in ${groupId}. Total: ${user.msgCount}`);

  await SaveData("userMoney");
}

async function loadCachedData() {
}

module.exports = {
  initStorage,
  getData,
  saveData,
  dataCache,
  countUserMessage
};
