const express = require('express');
const router = express.Router();
const {
    getCitizens,
    getCitizenById,
    createCitizen,
    updateCitizen
} = require('../controllers/citizen.controller');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getCitizens)
    .post(protect, createCitizen);

router.route('/:id')
    .get(protect, getCitizenById)
    .put(protect, updateCitizen);

module.exports = router;
