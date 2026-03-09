const express = require('express');
const router = express.Router();
const {
    stageUpload,
    confirmUpload,
    getUploadStatus,
    getUploadErrors
} = require('../controllers/upload.controller');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Route: /api/upload

// Stage 1: Upload and Preview
router.post('/stage', protect, upload.single('file'), stageUpload);

// Stage 2: Confirm and Process
router.post('/confirm/:sessionId', protect, confirmUpload);

// Monitoring
router.get('/status/:sessionId', protect, getUploadStatus);
router.get('/errors/:sessionId', protect, getUploadErrors);

module.exports = router;
