const ServiceRecord = require('../models/ServiceRecord');

// @desc    Get all service records
// @route   GET /api/services
// @access  Private
const getServices = async (req, res) => {
    try {
        const services = await ServiceRecord.find({})
            .populate('applicant', 'name')
            .populate('officialId', 'name');
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a service record
// @route   POST /api/services
// @access  Private
const createService = async (req, res) => {
    const { serviceName, applicant, familyId, remarks, status } = req.body;

    try {
        const service = await ServiceRecord.create({
            serviceName,
            applicant,
            familyId,
            officialId: req.user._id, // From auth middleware
            remarks,
            status
        });

        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getServices, createService };
