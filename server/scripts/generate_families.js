require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Citizen = require('../src/models/Citizen');
const Family = require('../src/models/Family');
const VillageOffice = require('../src/models/VillageOffice');

const generateFamilies = async () => {
    try {
        console.log('Connecting to database...', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, {
            family: 4
        });
        console.log('Connected.');

        // 1. Group citizens by ration card number and village office
        // Only target citizens without a familyId
        const citizens = await Citizen.find({ familyId: null, rationCardNumber: { $exists: true, $ne: "" } });
        console.log(`Found ${citizens.length} citizens without a family.`);

        const groupedByRation = {};
        for (const citizen of citizens) {
            const key = `${citizen.rationCardNumber}_${citizen.villageOfficeId.toString()}`;
            if (!groupedByRation[key]) {
                groupedByRation[key] = [];
            }
            groupedByRation[key].push(citizen);
        }

        let createdCount = 0;
        let updatedCount = 0;
        let existingFamilyCount = 0;

        const keys = Object.keys(groupedByRation);
        console.log(`Processing ${keys.length} family groups...`);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (i % 10 === 0) console.log(`Progress: ${i}/${keys.length} groups processed...`);

            const group = groupedByRation[key];
            const rationCardNumber = group[0].rationCardNumber;
            const villageId = group[0].villageOfficeId;

            // Check if Family already exists for this ration card
            let family = await Family.findOne({ rationCardNumber, villageId });

            if (!family) {
                // Determine Head of Family
                let head = group.find(c => c.headOfFamily === true || c.relationshipToHead === 'Head');

                // If no specific head, pick the oldest
                if (!head) {
                    group.sort((a, b) => {
                        const ageA = a.age || 0;
                        const ageB = b.age || 0;
                        return ageB - ageA; // Descending age
                    });
                    head = group[0];
                }

                const familyName = `${head.name}'s Family`;
                const wardNumber = parseInt(head.ward, 10) || 1;
                const address = `${head.houseName || ''} ${head.place || ''} ${head.pinCode || ''}`.trim() || 'Address Not Provided';

                // Calculate total annual income
                const familyIncome = group.reduce((sum, c) => sum + (c.annualIncome || 0), 0);

                const members = group.map(c => ({
                    citizenId: c._id,
                    relationship: c._id.equals(head._id) ? 'Head' : (c.relationshipToHead || 'Member'),
                    isHead: c._id.equals(head._id)
                }));

                family = new Family({
                    familyName,
                    villageId,
                    wardNumber,
                    address,
                    rationCardNumber,
                    headCitizenId: head._id,
                    members,
                    status: 'Active'
                });

                await family.save();
                createdCount++;
            } else {
                existingFamilyCount++;
                // Update family members if it already exists?
                // For simplicity, assuming if it exists, it's already generated.
            }

            // Update all citizens in the group
            const familyIncome = group.reduce((sum, c) => sum + (c.annualIncome || 0), 0);
            for (const c of group) {
                const updateData = {
                    familyId: family._id,
                    familyAnnualIncome: familyIncome
                };

                // Sync Head status if we assigned it dynamically
                if (c._id.equals(family.headCitizenId)) {
                    updateData.headOfFamily = true;
                    if (!c.relationshipToHead) updateData.relationshipToHead = 'Head';
                }

                await Citizen.updateOne({ _id: c._id }, { $set: updateData });
                updatedCount++;
            }
        }

        console.log(`Process Complete.`);
        console.log(`Created ${createdCount} families.`);
        console.log(`Skipped ${existingFamilyCount} existing families.`);
        console.log(`Updated ${updatedCount} citizens with family IDs.`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

generateFamilies();
