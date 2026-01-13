const Official = require('../models/Official');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new official
// @route   POST /api/auth/register
// @access  Public (or Admin only in prod)
const registerOfficial = async (req, res) => {
    const { name, email, password, role, department } = req.body;

    try {
        const officialExists = await Official.findOne({ email });

        if (officialExists) {
            return res.status(400).json({ message: 'Official already exists' });
        }

        const official = await Official.create({
            name,
            email,
            password,
            role,
            department
        });

        if (official) {
            res.status(201).json({
                _id: official._id,
                name: official.name,
                email: official.email,
                role: official.role,
                token: generateToken(official._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid official data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth official & get token
// @route   POST /api/auth/login
// @access  Public
const loginOfficial = async (req, res) => {
    const { email, password } = req.body;

    try {
        const official = await Official.findOne({ email });

        if (official && (await official.matchPassword(password))) {
            res.json({
                _id: official._id,
                name: official.name,
                email: official.email,
                role: official.role,
                token: generateToken(official._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerOfficial, loginOfficial };
