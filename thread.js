const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "database", "groupSettings.json");

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function writeSettings(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getGroupSettings(groupId) {
  const all = readSettings();
  return all[groupId] || { welcome: true }; 
}


function setGroupSettings(groupId, settings) {
  const all = readSettings();
  all[groupId] = { ...(all[groupId] || {}), ...settings };
  writeSettings(all);
}

module.exports = {
  getGroupSettings,
  setGroupSettings
};
