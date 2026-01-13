const express = require('express');
const router = express.Router();
const {
    getFamilies,
    createFamily,
    getFamilyById,
    addMemberToFamily,
    removeMemberFromFamily
} = require('../controllers/family.controller');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getFamilies)
    .post(protect, createFamily);

router.route('/:id')
    .get(protect, getFamilyById);

router.route('/:id/members')
    .post(protect, addMemberToFamily);

router.route('/:id/members/remove')
    .post(protect, removeMemberFromFamily);

module.exports = router;
