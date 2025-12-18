// backend/routes/system.js
const express = require('express');
const router = express.Router();

const systemController = require('../controllers/systemController');
const authenticate = require('../middleware/authenticate');
const adminAuth = require('../middleware/adminAuth');

router.use(authenticate, adminAuth);

router.get('/health', systemController.getHealth);
router.get('/health/trend', systemController.getHealthTrend);
router.get('/summary', systemController.getSystemSummary);

module.exports = router;
