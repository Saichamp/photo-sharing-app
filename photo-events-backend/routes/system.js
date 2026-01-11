/**
 * System routes - /api/admin/system/*
 */

const express = require('express');
const router = express.Router();

const systemController = require('../controllers/systemController');
const { authenticate } = require('../middleware/authenticate');
const adminAuth = require('../middleware/adminAuth');

// Apply authentication and admin check to ALL routes
router.use(authenticate);
router.use(adminAuth);

router.get('/health', systemController.getHealth);
router.get('/health/trend', systemController.getHealthTrend);
router.get('/summary', systemController.getSystemSummary);

module.exports = router;
