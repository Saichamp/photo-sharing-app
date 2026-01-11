// backend/utils/systemMonitor.js
const os = require('os');
const mongoose = require('mongoose');
const axios = require('axios');
const config = require('../config/config');

async function getBasicSystemMetrics() {
  const memoryTotal = os.totalmem() / (1024 * 1024); // MB
  const memoryUsed = (os.totalmem() - os.freemem()) / (1024 * 1024); // MB

  return {
    cpu: null, // cheap placeholder, real CPU sampling can be added later
    memory: {
      used: Number(memoryUsed.toFixed(2)),
      total: Number(memoryTotal.toFixed(2)),
      percentage: Number(((memoryUsed / memoryTotal) * 100).toFixed(2))
    }
  };
}

async function pingDatabase() {
  const start = Date.now();
  const state = mongoose.connection.readyState; // 1 = connected
  let status = 'disconnected';

  if (state === 1) status = 'connected';
  if (state === 2) status = 'connecting';
  if (state === 3) status = 'disconnecting';

  let responseTime = null;
  try {
    await mongoose.connection.db.command({ ping: 1 });
    responseTime = Date.now() - start;
  } catch {
    status = 'error';
    responseTime = Date.now() - start;
  }

  return { status, responseTime };
}

async function pingFaceService() {
  if (!config.faceService?.healthUrl) {
    return { status: 'unknown', queueLength: null };
  }

  try {
    const res = await axios.get(config.faceService.healthUrl, { timeout: 2000 });
    return {
      status: res.data?.status || 'ok',
      queueLength: res.data?.queueLength ?? null
    };
  } catch {
    return { status: 'error', queueLength: null };
  }
}

module.exports = {
  getBasicSystemMetrics,
  pingDatabase,
  pingFaceService
};
