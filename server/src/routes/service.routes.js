const express = require('express');
const router = express.Router();
const {
    getServices,
    createService,
    validateApplicant,
    updateVerificationStatus,
    approveCertificate,
    rejectCertificate,
    issueCertificate,
    uploadProof
} = require('../controllers/service.controller');
const { protect, authorizeRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getServices)
    .post(protect, createService);

router.post('/validate-applicant', protect, validateApplicant);

// State transitions endpoints with RBAC
router.put('/:id/verify', protect, authorizeRole('Clerk', 'Admin'), updateVerificationStatus);
router.put('/:id/approve', protect, authorizeRole('Revenue Officer', 'Admin'), approveCertificate);
router.put('/:id/reject', protect, authorizeRole('Revenue Officer', 'Admin'), rejectCertificate);
router.put('/:id/issue', protect, authorizeRole('Revenue Officer', 'Admin'), issueCertificate);

// Document upload
router.post('/:id/upload-proof', protect, upload.single('file'), uploadProof);

module.exports = router;
