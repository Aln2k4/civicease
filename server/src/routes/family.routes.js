const express = require('express');
const router = express.Router();
const familyController = require('../controllers/family.controller');
const { protect } = require('../middleware/authMiddleware');

const upload = require('../middleware/multer.config');

// Protect all routes
router.use(protect);

router.get('/', familyController.getFamilies);
router.post('/', familyController.createFamily);
router.get('/available-citizens', familyController.getAvailableCitizens);
router.get('/by-citizen/:citizenId', familyController.getFamilyByCitizenId);
router.get('/:id', familyController.getFamilyById);

// Add Member
router.post('/:id/members', familyController.addMember);

// Remove Member (Using PUT for FormData support)
// Remove Member (Using PUT for FormData support)
router.put('/:id/members/:memberId/remove', upload.single('certificate'), familyController.removeMember);

router.post('/upload', upload.single('file'), familyController.uploadFamilies);

module.exports = router;
