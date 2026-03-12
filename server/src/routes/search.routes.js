const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { protect } = require('../middleware/authMiddleware');

// Protect limits search to jurisdiction if using strict village-level logins
router.get('/', protect, searchController.globalSearch);

module.exports = router;
