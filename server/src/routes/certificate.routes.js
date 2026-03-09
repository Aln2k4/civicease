const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getCertificatePreview } = require('../controllers/certificate.controller');

router.get('/preview/:type', protect, authorize('Official', 'Admin'), getCertificatePreview);

module.exports = router;
