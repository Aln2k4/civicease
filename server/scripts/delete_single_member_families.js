require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Citizen = require('../src/models/Citizen');
const Family = require('../src/models/Family');

const deleteSingleMemberFamilies = async () => {
    try {
        console.log('Connecting to database...', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, {
            family: 4
        });
        console.log('Connected.');

        // Find families with only 1 member
        const singleMemberFamilies = await Family.find({ 'members': { $size: 1 } });
        console.log(`Found ${singleMemberFamilies.length} families with only a single member.`);

        let deletedCount = 0;
        let updatedCitizenCount = 0;

        for (const family of singleMemberFamilies) {
            // Get the citizen ID
            const citizenId = family.members[0].citizenId;

            // Reset the citizen's family data
            const updateResult = await Citizen.updateOne(
                { _id: citizenId },
                {
                    $set: {
                        familyId: null,
                        headOfFamily: false,
                        familyAnnualIncome: 0,
                        relationshipToHead: null
                    }
                }
            );

            if (updateResult.modifiedCount > 0) {
                updatedCitizenCount++;
            }

            // Delete the family
            await Family.deleteOne({ _id: family._id });
            deletedCount++;

            if (deletedCount % 50 === 0) {
                console.log(`Deleted ${deletedCount} families...`);
            }
        }

        console.log(`\nProcess Complete.`);
        console.log(`Deleted ${deletedCount} single-member families.`);
        console.log(`Reset ${updatedCitizenCount} citizens to have no family.`);

    } catch (error) {
        console.error('Operation failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

deleteSingleMemberFamilies();
