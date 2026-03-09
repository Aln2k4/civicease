require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Citizen = require('../src/models/Citizen');
const Family = require('../src/models/Family');

const inferRelationships = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI, { family: 4 });
        console.log('Connected to DB.');

        const families = await Family.find({ status: 'Active' });
        console.log(`Processing ${families.length} families...`);

        let updatedCitizens = 0;
        let updatedFamilies = 0;

        for (const family of families) {
            // Get full citizen details for all members
            const memberIds = family.members.map(m => m.citizenId);
            const citizens = await Citizen.find({ _id: { $in: memberIds } });

            const head = citizens.find(c => c._id.equals(family.headCitizenId));
            if (!head) continue;

            let familyChanged = false;

            for (const member of family.members) {
                if (member.isHead) {
                    member.relationship = 'Head';
                    continue;
                }

                const cit = citizens.find(c => c._id.equals(member.citizenId));
                if (!cit) continue;

                let inferredRel = 'Member';

                // Infer relationship to Head
                // 1. Spouse
                if (cit.spouseName === head.name || head.spouseName === cit.name) {
                    inferredRel = cit.gender === 'Female' ? 'Wife' : 'Husband';
                }
                // 2. Head is Father/Mother -> Citizen is Son/Daughter
                else if (cit.fatherName === head.name || cit.motherName === head.name) {
                    inferredRel = cit.gender === 'Female' ? 'Daughter' : 'Son';
                }
                // 3. Citizen is Father/Mother to Head -> Citizen is Father/Mother
                else if (head.fatherName === cit.name) {
                    inferredRel = 'Father';
                }
                else if (head.motherName === cit.name) {
                    inferredRel = 'Mother';
                }
                // 4. Siblings (Share Parents)
                else if ((cit.fatherName && cit.fatherName === head.fatherName) || (cit.motherName && cit.motherName === head.motherName)) {
                    inferredRel = cit.gender === 'Female' ? 'Sister' : 'Brother';
                }

                if (inferredRel !== 'Member' && member.relationship !== inferredRel) {
                    member.relationship = inferredRel;
                    familyChanged = true;

                    // Update Citizen document
                    await Citizen.updateOne({ _id: cit._id }, { $set: { relationshipToHead: inferredRel } });
                    updatedCitizens++;
                }
            }

            if (familyChanged) {
                await family.save();
                updatedFamilies++;
            }
        }

        console.log(`\nProcess Complete.`);
        console.log(`Inferred relationships for ${updatedCitizens} citizens across ${updatedFamilies} families.`);

    } catch (error) {
        console.error('Operation failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

inferRelationships();
