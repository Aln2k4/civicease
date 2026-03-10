const Family = require('../models/Family');
const Citizen = require('../models/Citizen');
const fs = require('fs');
const csv = require('csv-parser');

/**
 * Get all citizens available for family creation within a jurisdiction (village)
 * @route GET /api/families/available-citizens
 */
exports.getAvailableCitizens = async (req, res) => {
    try {
        const villageId = req.villageId; // Injected by protect/jurisdiction middleware
        const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');

        if (!villageId && !isAdmin) {
            return res.status(400).json({ message: "Jurisdiction context missing." });
        }

        const citizenQuery = isAdmin ? {} : { villageOfficeId: villageId };
        // 1. Get all citizens in this village (or all for admin)
        const allCitizens = await Citizen.find(citizenQuery)
            .select('name age gender uniqueId dob address permanentAddress rationCardNumber');

        const familyQuery = isAdmin ? { status: 'Active' } : { villageId: villageId, status: 'Active' };
        // 2. Get all citizens ALREADY in an active family in this village
        // Since a citizen can be in only one family, we check all families for member IDs
        const existingFamilies = await Family.find(familyQuery).select('members.citizenId');

        const assignedCitizenIds = new Set();
        existingFamilies.forEach(family => {
            family.members.forEach(member => {
                assignedCitizenIds.add(member.citizenId.toString());
            });
        });

        // 3. Filter out assigned citizens
        const availableCitizens = allCitizens.filter(citizen => !assignedCitizenIds.has(citizen._id.toString()));

        res.status(200).json(availableCitizens);

    } catch (error) {
        console.error("Error fetching available citizens:", error);
        res.status(500).json({ message: "Server error fetching available citizens." });
    }
};

/**
 * Create a new Family
 * @route POST /api/families
 */
exports.createFamily = async (req, res) => {
    try {
        const {
            familyName,
            wardNumber,
            address,
            rationCardNumber,
            headCitizenId,
            members // Array of { citizenId, relationship }
        } = req.body;

        const villageId = req.villageId;

        // STRICT JURISDICTION CHECK
        if (!villageId && req.user.role !== 'Admin') {
            console.error("Critical: Jurisdiction context missing in Family Controller!");
            return res.status(403).json({ message: "Jurisdiction context missing." });
        }

        const officialId = req.user.id;

        // --- VALIDATIONS ---

        // 1. Check Ration Card Uniqueness
        const existingRation = await Family.findOne({ rationCardNumber });
        if (existingRation) {
            return res.status(400).json({ message: "Ration Card Number already exists." });
        }

        // 2. Validate Head of Family
        const headCitizen = await Citizen.findById(headCitizenId);
        if (!headCitizen) {
            return res.status(404).json({ message: "Head of Family citizen not found." });
        }
        if (headCitizen.villageOfficeId.toString() !== villageId) {
            return res.status(403).json({ message: "Head of Family belongs to a different jurisdiction." });
        }
        if (headCitizen.age < 18) {
            return res.status(400).json({ message: "Head of Family must be at least 18 years old." });
        }

        // 3. Validate Members & Check for Duplicates (Double Listing)
        const allMemberIds = [headCitizenId, ...members.map(m => m.citizenId)];

        // Check for duplicates within the request itself
        const uniqueRequestedIds = new Set(allMemberIds);
        if (uniqueRequestedIds.size !== allMemberIds.length) {
            return res.status(400).json({ message: "Duplicate citizens found in the request." });
        }

        // Check if any member is ALREADY in another active family
        // We can query Family where 'members.citizenId' is IN [allMemberIds]
        const conflictingFamilies = await Family.find({
            'members.citizenId': { $in: allMemberIds },
            status: 'Active'
        });

        if (conflictingFamilies.length > 0) {
            return res.status(400).json({
                message: "One or more citizens are already members of another active family."
            });
        }

        // 4. Construct Member Array for DB
        // Head is also a member, usually with relationship 'Head'
        const familyMembers = [];

        // Add Head
        familyMembers.push({
            citizenId: headCitizenId,
            relationship: 'Head',
            isHead: true
        });

        // Add other members
        for (const m of members) {
            // Optional: Check if member exists in DB and is in same village
            // (Assuming strict usage, we trust the ID but verifying village is safer)
            const cit = await Citizen.findById(m.citizenId);
            if (!cit || cit.villageOfficeId.toString() !== villageId) {
                return res.status(400).json({ message: `Citizen ${m.citizenId} not found or outside jurisdiction.` });
            }

            familyMembers.push({
                citizenId: m.citizenId,
                relationship: m.relationship,
                isHead: false
            });
        }

        // --- CREATE FAMILY ---
        const newFamily = new Family({
            familyName,
            villageId,
            wardNumber,
            address,
            rationCardNumber,
            headCitizenId,
            members: familyMembers,
            createdBy: officialId
        });

        await newFamily.save();

        // Update Head Citizen flag
        await Citizen.findByIdAndUpdate(headCitizenId, { headOfFamily: true });

        res.status(201).json(newFamily);

    } catch (error) {
        console.error("Error creating family:", error);
        res.status(500).json({ message: "Server error creating family." });
    }
};

/**
 * Get all families in the jurisdiction
 * @route GET /api/families
 */
exports.getFamilies = async (req, res) => {
    try {
        const villageId = req.villageId;
        const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');

        if (!villageId && !isAdmin) {
            return res.status(403).json({ message: "Jurisdiction context missing." });
        }

        const familyQuery = isAdmin ? { status: 'Active' } : { villageId, status: 'Active' };
        const families = await Family.find(familyQuery)
            .populate('headCitizenId', 'name')
            .populate('villageId', 'villageName')
            .lean();

        // Map to match frontend expectations
        const formattedFamilies = families.map(f => ({
            _id: f._id,
            familyName: f.familyName,
            village: f.villageId ? f.villageId.villageName : 'N/A',
            wardNumber: f.wardNumber,
            headOfFamily: f.headCitizenId
        }));

        res.status(200).json(formattedFamilies);
    } catch (error) {
        console.error("Error fetching families:", error);
        res.status(500).json({ message: "Server error fetching families." });
    }
};

/**
 * Get family by ID with full details
 * @route GET /api/families/:id
 */
exports.getFamilyById = async (req, res) => {
    try {
        const { id } = req.params;
        const villageId = req.villageId;
        const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');

        const query = { _id: id };
        if (!isAdmin) {
            query.villageId = villageId;
        }

        const family = await Family.findOne(query)
            .populate('headCitizenId')
            .populate('members.citizenId')
            .populate('villageId', 'villageName')
            .lean();

        if (!family) {
            return res.status(404).json({ message: "Family not found." });
        }

        // Calculate Total Annual Income
        let totalIncome = 0;

        // Add Head's income
        if (family.headCitizenId && family.headCitizenId.annualIncome) {
            totalIncome += family.headCitizenId.annualIncome;
        }

        // Add Members' income
        if (family.members) {
            family.members.forEach(member => {
                if (member.citizenId && member.citizenId.annualIncome) {
                    totalIncome += member.citizenId.annualIncome;
                }
            });
        }

        // Format response
        const formattedFamily = {
            ...family,
            headOfFamily: family.headCitizenId,
            members: family.members.map(m => ({
                ...m.citizenId, // Spread citizen details
                relationshipToHead: m.relationship,
                _id: m.citizenId._id // Ensure ID is preserved
            })),
            village: family.villageId ? family.villageId.villageName : "Unknown",
            totalAnnualIncome: totalIncome
        };

        res.status(200).json(formattedFamily);

    } catch (error) {
        console.error("Error fetching family details:", error);
        res.status(500).json({ message: "Server error fetching family details." });
    }
};

/**
 * Remove a member from the family
 * @route PUT /api/families/:id/members/:memberId
 */
exports.removeMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const { reason } = req.body;
        const villageId = req.villageId;
        const certificatePath = req.file ? req.file.path : null;

        if (!certificatePath) {
            return res.status(400).json({ message: "Certificate is required for removing a member." });
        }

        const family = await Family.findOne({ _id: id, villageId });

        if (!family) {
            return res.status(404).json({ message: "Family not found." });
        }

        // Find member index
        const memberIndex = family.members.findIndex(m => m.citizenId.toString() === memberId);
        if (memberIndex === -1) {
            return res.status(404).json({ message: "Member not found in this family." });
        }

        const member = family.members[memberIndex];
        const citizenId = member.citizenId;

        // 1. Fetch Citizen details for snapshot
        const citizen = await Citizen.findById(citizenId).lean();

        // 2. Add to removedMembers
        family.removedMembers.push({
            citizen: {
                ...(citizen || { _id: citizenId }),
                relationshipToHead: member.relationship // Preserve relationship for history/visualization
            },
            reason: reason,
            removedAt: new Date(),
            certificatePath: certificatePath
        });

        // 3. Handle Head of Family Reallocation
        if (member.isHead || family.headCitizenId.toString() === citizenId.toString()) {
            // Set old head flag to false
            await Citizen.findByIdAndUpdate(citizenId, { headOfFamily: false });

            // Find remaining members
            const remainingMembers = family.members.filter(m => m.citizenId.toString() !== citizenId.toString());

            if (remainingMembers.length > 0) {
                // Priority 1: Spouse
                let newHeadIndex = family.members.findIndex(m =>
                    m.citizenId.toString() !== citizenId.toString() &&
                    ['Wife', 'Husband', 'Spouse'].includes(m.relationship)
                );

                // Priority 2: Eldest Member
                if (newHeadIndex === -1) {
                    const remainingIds = remainingMembers.map(m => m.citizenId);
                    const eldestCitizen = await Citizen.findOne({ _id: { $in: remainingIds } }).sort({ age: -1 });

                    if (eldestCitizen) {
                        newHeadIndex = family.members.findIndex(m => m.citizenId.toString() === eldestCitizen._id.toString());
                    }
                }

                if (newHeadIndex !== -1) {
                    // Promote New Head
                    family.members[newHeadIndex].relationship = 'Head';
                    family.members[newHeadIndex].isHead = true;
                    family.headCitizenId = family.members[newHeadIndex].citizenId;

                    // Update Citizen Flag for new head
                    await Citizen.findByIdAndUpdate(family.members[newHeadIndex].citizenId, { headOfFamily: true });
                }
            } else {
                // No members left? Schema requires headCitizenId. 
                // We might mark family as Inactive or similar, but for now lets not break schema.
                // Ideally we shouldn't allow removing the last member without deleting the family.
            }
        }

        // 3. Remove from active members
        family.members.splice(memberIndex, 1);

        await family.save();

        // 4. Return updated family logic (reusing existing population logic for consistency)
        const updatedFamily = await Family.findById(id)
            .populate('headCitizenId')
            .populate('members.citizenId')
            .populate('villageId', 'villageName')
            .lean();

        const formattedFamily = {
            ...updatedFamily,
            headOfFamily: updatedFamily.headCitizenId,
            members: updatedFamily.members.map(m => ({
                ...m.citizenId,
                relationshipToHead: m.relationship,
                _id: m.citizenId._id
            })),
            village: updatedFamily.villageId ? updatedFamily.villageId.villageName : "Unknown",
            totalAnnualIncome: 0
        };

        // Recalculate income
        let totalIncome = 0;
        if (updatedFamily.headCitizenId && updatedFamily.headCitizenId.annualIncome) totalIncome += updatedFamily.headCitizenId.annualIncome;
        if (updatedFamily.members) {
            updatedFamily.members.forEach(m => {
                if (m.citizenId && m.citizenId.annualIncome) totalIncome += m.citizenId.annualIncome;
            });
        }
        formattedFamily.totalAnnualIncome = totalIncome;

        res.status(200).json(formattedFamily);

    } catch (error) {
        console.error("Error removing family member:", error);
        res.status(500).json({ message: "Server error removing member." });
    }
};

/**
 * Bulk Upload Families from CSV
 * @route POST /api/families/upload
 */
exports.uploadFamilies = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a CSV file' });
    }

    const results = [];
    const errors = [];
    let addedCount = 0;
    let updatedCount = 0;
    const villageId = req.villageId;

    if (!villageId) {
        try { fs.unlinkSync(req.file.path); } catch (e) { }
        return res.status(400).json({ message: "Jurisdiction context missing." });
    }

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            // Cleanup file
            try { fs.unlinkSync(req.file.path); } catch (e) { }

            for (const row of results) {
                try {
                    const {
                        rationCardNumber,
                        familyName,
                        wardNumber,
                        address,
                        headCitizenUniqueId,
                        members: membersString // "ID:Rel|ID2:Rel"
                    } = row;

                    if (!rationCardNumber || !headCitizenUniqueId) {
                        errors.push({ id: rationCardNumber || 'Unknown', error: "Missing required fields (Ration Card or Head ID)" });
                        continue;
                    }

                    // 1. Find Head Citizen
                    const headCitizen = await Citizen.findOne({ uniqueId: headCitizenUniqueId });
                    if (!headCitizen) {
                        errors.push({ id: rationCardNumber, error: `Head Citizen (${headCitizenUniqueId}) not found` });
                        continue;
                    }
                    if (headCitizen.villageOfficeId.toString() !== villageId) {
                        errors.push({ id: rationCardNumber, error: `Head Citizen (${headCitizenUniqueId}) is outside jurisdiction` });
                        continue;
                    }

                    // 2. Parse Members
                    const membersList = [];
                    // Add Head as member logic is usually internal, but let's see current create logic
                    // Current create logic implicitly adds Head.

                    if (membersString && membersString.trim() !== "") {
                        const memberEntries = membersString.split('|');
                        for (const entry of memberEntries) {
                            const [mUniqueId, mRel] = entry.split(':');
                            if (!mUniqueId || !mRel) continue;

                            const mCit = await Citizen.findOne({ uniqueId: mUniqueId });
                            if (!mCit) {
                                // warning or error? Let's treat as error for data integrity
                                throw new Error(`Member ${mUniqueId} not found`);
                            }
                            if (mCit.villageOfficeId.toString() !== villageId) {
                                throw new Error(`Member ${mUniqueId} outside jurisdiction`);
                            }
                            membersList.push({
                                citizenId: mCit._id,
                                relationship: mRel,
                                isHead: false
                            });
                        }
                    }

                    // Always ensure Head is in members list with isHead: true
                    // We filter out any explicit mention of head in membersString to avoid dupe, or just rebuild it.
                    // The schema expects head in 'members' array too.

                    // Clear existing head entry from parsed list if somehow included
                    const cleanMembers = membersList.filter(m => m.citizenId.toString() !== headCitizen._id.toString());

                    cleanMembers.push({
                        citizenId: headCitizen._id,
                        relationship: 'Head',
                        isHead: true
                    });


                    // 3. Upsert Family
                    let family = await Family.findOne({ rationCardNumber: rationCardNumber });

                    if (family) {
                        // Update
                        if (family.villageId.toString() !== villageId) {
                            errors.push({ id: rationCardNumber, error: "Family belongs to another village." });
                            continue;
                        }

                        family.familyName = familyName || family.familyName;
                        family.wardNumber = wardNumber || family.wardNumber;
                        family.address = address || family.address;
                        family.headCitizenId = headCitizen._id;
                        family.members = cleanMembers;

                        await family.save();
                        updatedCount++;
                    } else {
                        // Create
                        await Family.create({
                            rationCardNumber,
                            familyName,
                            wardNumber,
                            address,
                            headCitizenId: headCitizen._id,
                            members: cleanMembers,
                            villageId: villageId,
                            createdBy: req.user.id
                        });
                        addedCount++;
                    }

                    // Sync Head Flag
                    await Citizen.findByIdAndUpdate(headCitizen._id, { headOfFamily: true });


                } catch (err) {
                    errors.push({ id: row.rationCardNumber || 'Unknown', error: err.message });
                }
            }

            res.json({
                message: "Bulk family import processing complete",
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
