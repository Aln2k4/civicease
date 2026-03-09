const express = require('express');
const router = express.Router();
const { getServices, createService, validateApplicant } = require('../controllers/service.controller');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getServices)
    .post(protect, createService);

router.post('/validate-applicant', protect, validateApplicant);

module.exports = router;
