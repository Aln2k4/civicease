const express = require('express');
const router = express.Router();
const {
    getCitizens,
    getCitizenById,
    createCitizen,
    updateCitizen
} = require('../controllers/citizen.controller');
const { protect } = require('../middleware/authMiddleware');
const { uploadCitizens } = require('../controllers/citizen.controller');

const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getCitizens)
    .post(protect, upload.single('birthCertificate'), createCitizen);

router.route('/upload')
    .post(protect, upload.single('file'), uploadCitizens);

router.route('/:id')
    .get(protect, getCitizenById)
    .put(protect, updateCitizen);

module.exports = router;
