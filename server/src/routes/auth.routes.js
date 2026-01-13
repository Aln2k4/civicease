const express = require('express');
const router = express.Router();
const { registerOfficial, loginOfficial } = require('../controllers/auth.controller');
const { protect } = require('../middleware/authMiddleware');

const r = express.Router();

r.post('/register', registerOfficial);
r.post('/login', loginOfficial);

module.exports = r;
