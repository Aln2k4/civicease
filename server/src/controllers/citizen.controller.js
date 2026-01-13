const Citizen = require('../models/Citizen');

// @desc    Get all citizens
// @route   GET /api/citizens
// @access  Private
const getCitizens = async (req, res) => {
    try {
        const citizens = await Citizen.find({});
        res.json(citizens);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get citizen by ID
// @route   GET /api/citizens/:id
// @access  Private
const getCitizenById = async (req, res) => {
    try {
        const citizen = await Citizen.findById(req.params.id).populate('familyId');
        if (citizen) {
            res.json(citizen);
        } else {
            res.status(404).json({ message: 'Citizen not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a citizen
// @route   POST /api/citizens
// @access  Private
const createCitizen = async (req, res) => {
    const {
        name, dob, age, gender, houseName, place, locality, district, address, contactNumber,
        uniqueId, familyId, headOfFamily, relationshipToHead, occupation, annualIncome
    } = req.body;

    try {
        const citizenExists = await Citizen.findOne({ uniqueId });
        if (citizenExists) {
            return res.status(400).json({ message: 'Citizen with this ID already exists' });
        }

        const citizen = await Citizen.create({
            name, dob, age, gender, houseName, place, locality, district, address, contactNumber,
            uniqueId, familyId, headOfFamily, relationshipToHead, occupation, annualIncome
        });

        res.status(201).json(citizen);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update citizen
// @route   PUT /api/citizens/:id
// @access  Private
const updateCitizen = async (req, res) => {
    try {
        const citizen = await Citizen.findById(req.params.id);

        if (citizen) {
            Object.assign(citizen, req.body);
            const updatedCitizen = await citizen.save();
            res.json(updatedCitizen);
        } else {
            res.status(404).json({ message: 'Citizen not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getCitizens, getCitizenById, createCitizen, updateCitizen };
