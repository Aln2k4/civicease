const Citizen = require('../models/Citizen');
const VillageOffice = require('../models/VillageOffice');
const fs = require('fs');
const csv = require('csv-parser');
const { verifyBirthCertificate } = require('../services/ocrService');

// @desc    Get all citizens
// @route   GET /api/citizens
// @access  Private
const getCitizens = async (req, res) => {
    try {
        // DEBUG LOGGING
        console.log(`[getCitizens] Request from User: ${req.user?._id}, Role: ${req.user?.role}, VillageID: ${req.villageId}`);

        // STRICT JURISDICTION ENFORCEMENT
        // If the user is an official/officer, they MUST have a villageId. 
        // If it's missing, we deny access to prevent leaking "All" citizens.
        const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');
        if (!req.villageId && !isAdmin) {
            console.error("Critical: Jurisdiction context missing in controller for non-admin!");
            return res.status(403).json({ message: "Jurisdiction context missing. Access denied." });
        }

        let query = {};

        // If not admin, strictly filter by villageId
        if (!isAdmin && req.villageId) {
            query = { villageOfficeId: req.villageId };
        }

        const { search, district, taluk, villageId, ward } = req.query;

        // Location Hierarchy Filtering
        if (district || taluk || villageId) {
            let villageQuery = {};
            if (district) villageQuery.district = district;
            if (taluk) villageQuery.taluk = taluk;
            if (villageId) villageQuery._id = villageId;

            const matchedVillages = await VillageOffice.find(villageQuery).select('_id');
            const villageIds = matchedVillages.map(v => v._id);

            if (query.villageOfficeId) {
                // Intersect if officer is locked to a village
                // Usually an officer is locked to 1 village, so this filter won't change much unless they search outside jurisdiction (which is denied).
                // If they are allowed, we'd do an intersection. For now, just overwrite if Admin, or keep officer's.
                if (isAdmin) {
                    query.villageOfficeId = { $in: villageIds };
                } // else officer's query.villageOfficeId remains what it is
            } else {
                query.villageOfficeId = { $in: villageIds };
            }
        }

        if (ward) {
            query.ward = ward;
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { name: searchRegex },
                { houseName: searchRegex },
                { uniqueId: searchRegex },
                { contactNumber: searchRegex }
            ];
        }

        console.log("[getCitizens] Query:", JSON.stringify(query));

        const citizens = await Citizen.find(query).populate('villageOfficeId', 'villageName district taluk');
        res.json(citizens);
    } catch (error) {
        console.error("[getCitizens] Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get citizen by ID
// @route   GET /api/citizens/:id
// @access  Private
const getCitizenById = async (req, res) => {
    try {
        const citizen = await Citizen.findById(req.params.id).populate('familyId');

        // Jurisdiction Check
        const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');
        if (citizen && req.villageId && !isAdmin) {
            if (citizen.villageOfficeId.toString() !== req.villageId) {
                return res.status(403).json({ message: 'Access Denied: Outside Jurisdiction' });
            }
        }

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
    try {
        // Enforce Jurisdiction for Revenue Officers
        let assignedVillageId = req.body.villageOfficeId;
        if (req.villageId) {
            assignedVillageId = req.villageId; // strictly lock to token's village
        }

        if (!assignedVillageId) {
            // Cleanup uploaded file if validation fails
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Village Office ID is required' });
        }

        // File Validation
        if (!req.file) {
            return res.status(400).json({ message: 'Birth Certificate is mandatory' });
        }

        // OCR Validation
        const isCertificateValid = await verifyBirthCertificate(req.file.path);
        if (!isCertificateValid) {
            // Delete invalid file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Uploaded document does not appear to be a valid Birth Certificate. Verification failed.' });
        }

        // Check for duplicate Unique ID if provided
        if (req.body.uniqueId && req.body.uniqueId.trim() !== '') {
            const citizenExists = await Citizen.findOne({ uniqueId: req.body.uniqueId });
            if (citizenExists) {
                return res.status(400).json({ message: 'Citizen with this ID already exists' });
            }
        }

        const citizenData = {
            ...req.body,
            birthCertificate: req.file.path, // Save file path
            villageOfficeId: assignedVillageId
        };

        // Remove empty uniqueId to prevent duplicate key error (unique value constraint)
        if (!citizenData.uniqueId || citizenData.uniqueId.trim() === '') {
            delete citizenData.uniqueId;
        }

        const citizen = await Citizen.create(citizenData);

        res.status(201).json(citizen);
    } catch (error) {
        // Handle Mongoose validation errors explicitly
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join(', ') });
        }
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
            // Jurisdiction Check
            const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');
            if (req.villageId && !isAdmin) {
                if (citizen.villageOfficeId.toString() !== req.villageId) {
                    return res.status(403).json({ message: 'Access Denied: Outside Jurisdiction' });
                }
            }

            Object.assign(citizen, req.body);
            // Ensure villageOfficeId cannot be changed by Revenue Officer? 
            // - Usually immutable, but if needed, check access again.

            const updatedCitizen = await citizen.save();
            res.json(updatedCitizen);
        } else {
            res.status(404).json({ message: 'Citizen not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk Upload Citizens via CSV
// @route   POST /api/citizens/upload
// @access  Private
const uploadCitizens = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a CSV file' });
    }

    const results = [];
    const errors = [];
    let addedCount = 0;
    let updatedCount = 0;

    // Determine Village ID
    let assignedVillageId = req.villageId;
    if (!assignedVillageId && req.body.villageOfficeId) {
        assignedVillageId = req.body.villageOfficeId;
    }

    // Add VillageOffice import at top if not present (Wait, I need to check top of file first or just rely on scope? It's safe to require inside function or check imports)
    // checking imports... const Citizen = require('../models/Citizen'); // ... 
    // Better to add `const VillageOffice = require('../models/VillageOffice');` at top or inside function. 
    // I'll add it inside `uploadCitizens` to be safe and avoiding full file read if possible, but cleaner at top. 
    // The tool allows replacing a block. I will assume I need to add the require AND update the logic.
    // However, `uploadCitizens` is at the bottom. I'll just require it inside the function for now or in the logic block.

    const VillageOffice = require('../models/VillageOffice'); // Ensure this is available

    // ... (inside uploadCitizens)

    // Safety check - if no village ID can be determined (e.g. admin without explicit village in body), fail.
    // However, usually req.villageId is present for officers.
    if (!assignedVillageId) {
        try { fs.unlinkSync(req.file.path); } catch (e) { }
        return res.status(400).json({ message: "Could not determine Jurisdiction (Village ID)." });
    }

    // Fetch Village Details for auto-populating address
    let villageDetails = null;
    try {
        villageDetails = await VillageOffice.findById(assignedVillageId);
    } catch (err) {
        console.error("Error fetching village details:", err);
    }

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            // Cleanup file
            try { fs.unlinkSync(req.file.path); } catch (e) { }

            for (const row of results) {
                try {
                    // Basic Validation or Skip
                    if (!row.name || !row.contactNumber || !row.gender || !row.dob) {
                        errors.push({ name: row.name || 'Unknown', error: "Missing required fields (Name, Contact, Gender, DOB)" });
                        continue;
                    }

                    // Prepare Citizen Object
                    const citizenData = {
                        name: row.name,
                        dob: new Date(row.dob), // ensure date format is correct in CSV (YYYY-MM-DD)
                        gender: row.gender,
                        maritalStatus: row.maritalStatus,
                        houseName: row.houseName,
                        ward: row.ward,
                        place: row.place,
                        pinCode: row.pinCode,
                        contactNumber: row.contactNumber,
                        fatherName: row.fatherName,
                        motherName: row.motherName,
                        spouseName: row.spouseName,
                        alternateMobile: row.alternateMobile,
                        email: row.email,
                        uniqueId: row.uniqueId,
                        rationCardNumber: row.rationCardNumber,
                        electionId: row.electionId,
                        drivingLicence: row.drivingLicence,
                        passportNumber: row.passportNumber,
                        religion: row.religion,
                        caste: row.caste,
                        communityCategory: row.communityCategory,
                        occupation: row.occupation,
                        annualIncome: row.annualIncome ? Number(row.annualIncome) : 0,
                        familyAnnualIncome: row.familyAnnualIncome ? Number(row.familyAnnualIncome) : 0,

                        // Technical Defaults
                        villageOfficeId: assignedVillageId,
                        birthCertificate: "http://via.placeholder.com/150?text=Imported+Record", // Placeholder since we can't upload per-row files yet logic wise
                        // Note: birthCertificate is REQUIRED in schema.

                        // Map Present Address to Permanent Address (Requested Feature)
                        isPermanentSameAsPresent: true,
                        permanentAddress: {
                            houseName: row.houseName, // Explicit house name from CSV
                            place: row.place, // Explicit place from CSV
                            pinCode: row.pinCode, // Explicit pin

                            // Auto-populate or use CSV overrides
                            village: row.village || (villageDetails ? villageDetails.villageName : ''),
                            taluk: row.taluk || (villageDetails ? villageDetails.taluk : ''),
                            district: row.district || (villageDetails ? villageDetails.district : '')
                        }
                    };

                    // Clean empty uniqueId
                    if (!citizenData.uniqueId || citizenData.uniqueId.trim() === '') {
                        delete citizenData.uniqueId;
                    }

                    // Upsert Logic:
                    // Priority 1: Match by Unique ID
                    let existing = null;
                    if (citizenData.uniqueId) {
                        existing = await Citizen.findOne({ uniqueId: citizenData.uniqueId });
                    }

                    // Priority 2: Match by Name + Contact + Village (fuzzy match if no uniqueID)
                    if (!existing) {
                        existing = await Citizen.findOne({
                            name: citizenData.name,
                            contactNumber: citizenData.contactNumber,
                            villageOfficeId: assignedVillageId
                        });
                        // This prevents creating duplicate 'John Doe' with same phone in same village.
                    }

                    if (existing) {
                        // Update
                        if (existing.villageOfficeId.toString() !== assignedVillageId.toString()) {
                            errors.push({ name: row.name, error: "Citizen exists in another village. Cannot update." });
                            continue;
                        }

                        // Update fields
                        Object.assign(existing, citizenData);
                        // Preserve original birth cert if it wasn't a placeholder? 
                        // For now, let's keep existing birthCert if the new one is just a placeholder, 
                        // but if new schema requires it, we must be careful.
                        // Actually, if we are 'updating' via CSV, we probably don't want to overwrite the file link 
                        // with a dummy "Imported Record" if they already had a real one.
                        if (existing.birthCertificate && existing.birthCertificate !== "http://via.placeholder.com/150?text=Imported+Record") {
                            citizenData.birthCertificate = existing.birthCertificate;
                        }

                        Object.assign(existing, citizenData);
                        await existing.save();
                        updatedCount++;
                    } else {
                        // Create
                        await Citizen.create(citizenData);
                        addedCount++;
                    }

                } catch (err) {
                    errors.push({ name: row.name || 'Unknown', error: err.message });
                }
            }

            res.json({
                message: "Bulk import processing complete",
                stats: {
                    totalRows: results.length,
                    added: addedCount,
                    updated: updatedCount,
                    failed: errors.length
                },
                errors: errors
            });
        });
};

module.exports = { getCitizens, getCitizenById, createCitizen, updateCitizen, uploadCitizens };
