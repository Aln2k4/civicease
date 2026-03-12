const Citizen = require('../models/Citizen');
const Family = require('../models/Family');
const ServiceRecord = require('../models/ServiceRecord');

exports.globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchTerm = q.trim();
        const searchRegex = new RegExp(searchTerm, 'i');

        // Note: For revenue officers, they ideally should only search within their village.
        // For admin, they can search globally.
        // Depending on existing setup, I will search globally for now or respect village context if available.
        const villageId = req.villageId; // Assuming protect middleware injects this

        const queryObj = {};
        if (villageId) {
            queryObj.villageOfficeId = villageId; // For Citizen
        }
        const familyQuery = villageId ? { villageId } : {};
        const serviceQuery = villageId ? { villageId } : {};


        // Search Citizens
        const citizens = await Citizen.find({
            ...queryObj,
            $or: [
                { name: searchRegex },
                { uniqueId: searchRegex }, // Aadhaar
                { rationCardNumber: searchRegex }
            ]
        }).limit(10).lean();

        // Search Families
        const families = await Family.find({
            ...familyQuery,
            $or: [
                { familyName: searchRegex },
                { rationCardNumber: searchRegex }
            ]
        }).limit(10).lean();

        // Check if ward is a number and search by ward
        const wardNumber = parseInt(searchTerm);
        if (!isNaN(wardNumber)) {
            const familyWardMatches = await Family.find({
                ...familyQuery,
                wardNumber: wardNumber
            }).limit(10).lean();
            families.push(...familyWardMatches);
        }

        // De-duplicate families (naive approach just for safety)
        const uniqueFamilies = Array.from(new Map(families.map(item => [item._id.toString(), item])).values());


        // Search Services
        // 1. Services matching serviceName
        const servicesByDetail = await ServiceRecord.find({
            ...serviceQuery,
            serviceName: searchRegex
        }).lean();

        // 2. Services belonging to matched citizens
        const citizenIds = citizens.map(c => c._id);
        const servicesByCitizens = await ServiceRecord.find({
            ...serviceQuery,
            applicant: { $in: citizenIds }
        }).lean();

        // Combine and dedup
        const allServices = [...servicesByDetail, ...servicesByCitizens];
        const uniqueServicesMap = new Map();
        allServices.forEach(item => uniqueServicesMap.set(item._id.toString(), item));
        const uniqueServices = Array.from(uniqueServicesMap.values()).slice(0, 10);

        // Populate the final list
        const populatedServices = await ServiceRecord.populate(uniqueServices, { path: 'applicant', select: 'name uniqueId' });

        res.status(200).json({
            citizens,
            families: uniqueFamilies.slice(0, 10), // Limit again after dedup
            services: populatedServices
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Server error during search' });
    }
};
