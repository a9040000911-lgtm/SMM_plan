// Monkey-patch to prevent glob from traversing user's home directory.
// Next.js compiled glob walks into Windows junction points (Application Data,
// Cookies, etc.) which cause EPERM errors. Instead of blacklisting individual
// junctions, we block readdir for ANY subdirectory of the user's home that
// isn't part of the project directory (D:\Smmplan).
const fs = require('fs');
const os = require('os');
const path = require('path');

const originalReaddir = fs.readdir;
const originalReaddirSync = fs.readdirSync;

const home = os.homedir().replace(/\\/g, '/').toLowerCase();
const projectDir = process.cwd().replace(/\\/g, '/').toLowerCase();

function shouldBlock(p) {
  if (typeof p !== 'string') return false;
  const normalized = p.replace(/\\/g, '/').toLowerCase();
  // Block any path inside user's home directory
  // EXCEPT the project directory itself and node_modules
  if (normalized.startsWith(home + '/')) {
    // Allow AppData\Local\npm-cache, AppData\Roaming\npm (npm stuff)
    if (normalized.includes('/appdata/')) return false;
    // Allow the project directory
    if (normalized.startsWith(projectDir)) return false;
    // Block everything else in home (junctions, Desktop, Documents, etc)
    return true;
  }
  return false;
}

fs.readdir = function(dirPath, ...args) {
  if (shouldBlock(dirPath)) {
    const callback = args[args.length - 1];
    if (typeof callback === 'function') return callback(null, []);
    return;
  }
  return originalReaddir.call(this, dirPath, ...args);
};

fs.readdirSync = function(dirPath, ...args) {
  if (shouldBlock(dirPath)) {
    return [];
  }
  return originalReaddirSync.call(this, dirPath, ...args);
};

const originalPromisesReaddir = fs.promises.readdir;
fs.promises.readdir = async function(dirPath, ...args) {
  if (shouldBlock(dirPath)) {
    return [];
  }
  return originalPromisesReaddir.call(this, dirPath, ...args);
};
