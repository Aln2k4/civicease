const Official = require('../models/Official');
const jwt = require('jsonwebtoken');

const generateToken = (id, role, villageId, districtId, talukId) => {
    return jwt.sign({
        id,
        role,
        villageId,
        districtId,
        talukId
    }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new official
// @route   POST /api/auth/register
// @access  Public (or Admin only in prod)
const VillageOffice = require('../models/VillageOffice');

// Helper to generate password
const generatePassword = (username) => {
    const randomSuffix = Math.random().toString(36).slice(-4).toUpperCase();
    return `${username}@${randomSuffix}`;
};

// @desc    Register a new official (Revenue Officer)
// @route   POST /api/auth/register
// @access  Admin only (ideally)
const registerOfficial = async (req, res) => {
    // Note: 'role' defaults to 'Revenue Officer' if not passed, but we enforce it here for clarity
    const { name, email, department, villageOfficeId, role = 'Revenue Officer' } = req.body;

    try {
        let villageOffice;


        // Check if valid ObjectId, otherwise search by code
        if (mongoose.Types.ObjectId.isValid(villageOfficeId)) {
            villageOffice = await VillageOffice.findById(villageOfficeId);
        } else {
            // Try matching by codes (assuming input might be a code)
            // Example input: KL01AND!01
            // We'll search exact match on any relevant field or a derived field
            // The user input seems to be "KL<DistrictCode><VillageCode>" or just a random code they have
            // Let's try to match against known patterns or just failsafe
            // Ideally, we should add a 'code' or 'username' field to VillageOffice if that's what they track
            // For now, let's assume they might be passing the villageCode or similar.

            // Try to fuzzy match or finding by distinct fields if possible
            // But best bet:
            villageOffice = await VillageOffice.findOne({
                $or: [
                    { villageCode: villageOfficeId },
                    { userId: villageOfficeId } // In case they use the userId field
                ]
            });
        }

        if (!villageOffice) {
            return res.status(400).json({ message: 'Invalid Village Office ID or Code' });
        }

        // Check if an official already exists for this village
        const existingOfficial = await Official.findOne({ villageOfficeId });
        if (existingOfficial) {
            return res.status(400).json({ message: 'Account already exists for this Village Office. Only one account per village is allowed.' });
        }

        // Generate Username: KL<DistrictCode><VillageCode>
        // Ensure codes are uppercase and trimmed
        const dCode = villageOffice.districtCode.trim().toUpperCase();
        const vCode = villageOffice.villageCode.trim().toUpperCase();
        const username = `KL${dCode}${vCode}`;

        // Double check username uniqueness (though one-per-village implies uniqueness if codes are unique)
        const userExists = await Official.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'System Error: Username collision detected.' });
        }

        const password = generatePassword(username); // Plaintext to show ONCE

        const official = await Official.create({
            name,
            email, // Optional/Sparse
            username,
            password, // Mongoose pre-save will hash this
            role,
            department,
            villageOfficeId
        });

        if (official) {
            res.status(201).json({
                _id: official._id,
                name: official.name,
                username: official.username,
                role: official.role,
                villageOffice: villageOffice.villageName,
                generatedPassword: password, // SENT ONLY ONCE
                message: 'Official created. secure the credentials immediately.'
            });
        } else {
            res.status(400).json({ message: 'Invalid official data' });
        }
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Duplicate entry detected. Account likely already exists.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth official & get token
// @route   POST /api/auth/login
// @access  Public
const loginOfficial = async (req, res) => {
    // accept 'identifier' which can be email or username
    const { identifier, password } = req.body;

    try {
        // Find by email OR username
        const official = await Official.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        }).populate('villageOfficeId');

        if (official && (await official.matchPassword(password))) {
            res.json({
                _id: official._id,
                name: official.name,
                username: official.username,
                email: official.email,
                role: official.role,
                villageOfficeId: official.villageOfficeId ? official.villageOfficeId._id : null,
                villageContext: official.villageOfficeId, // Send full obj if needed
                token: generateToken(
                    official._id,
                    official.role,
                    official.villageOfficeId ? official.villageOfficeId._id : null,
                    official.villageOfficeId ? official.villageOfficeId.districtCode : null,
                    // Let's populate specific IDs if needed, but here we might just have the object.
                    // Let's use the object IDs if available in the populated object.
                    // Wait, villageOfficeId is populated.
                    official.villageOfficeId ? official.villageOfficeId.district : null, // Or districtCode? Requirement: district_id. 
                    // Since VillageOffice model doesn't store district_id (it stores district name/code), we might need to rely on what we have.
                    // We'll trust the plan: ensure we put what is available.
                    // User requirements: district_id, taluk_id. 
                    // Since we don't have separate tables for district/taluk yet (just strings in village), we will use these strings or codes.
                    // "district_id" usually implies a DB PK, but here the village object has the data.
                    // I will put the strings/codes as IDs for now as that's the closest truth.
                    official.villageOfficeId ? official.villageOfficeId.district : null,
                    official.villageOfficeId ? official.villageOfficeId.taluk : null
                ),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerOfficial, loginOfficial };
