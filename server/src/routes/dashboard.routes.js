const express = require('express');
const router = express.Router();
const { getDashboardStats, getReportData } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getDashboardStats);
router.get('/report', protect, getReportData);

module.exports = router;
