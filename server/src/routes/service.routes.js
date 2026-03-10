const express = require('express');
const router = express.Router();
const {
    getServices,
    createService,
    validateApplicant,
    updateVerificationStatus,
    approveCertificate,
    rejectCertificate,
    issueCertificate
} = require('../controllers/service.controller');
const { protect, authorizeRole } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getServices)
    .post(protect, createService);

router.post('/validate-applicant', protect, validateApplicant);

// State transitions endpoints with RBAC
router.put('/:id/verify', protect, authorizeRole('Clerk', 'Admin'), updateVerificationStatus);
router.put('/:id/approve', protect, authorizeRole('Revenue Officer', 'Admin'), approveCertificate);
router.put('/:id/reject', protect, authorizeRole('Revenue Officer', 'Admin'), rejectCertificate);
router.put('/:id/issue', protect, authorizeRole('Revenue Officer', 'Admin'), issueCertificate);

module.exports = router;
