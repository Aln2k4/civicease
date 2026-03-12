require('dotenv').config();
const mongoose = require('mongoose');
const Citizen = require('../src/models/Citizen');
const VillageOffice = require('../src/models/VillageOffice');
const ServiceRecord = require('../src/models/ServiceRecord');
const Official = require('../src/models/Official');

const CERTIFICATE_TYPES = [
    'Income Certificate',
    'Caste Certificate',
    'Community Certificate',
    'Nativity Certificate',
    'Possession Certificate',
    'Dependency Certificate',
    'Legal Heir Certificate',
    'Valuation Certificate',
    'Family Membership'
];

const STATUSES = ['Draft', 'Validated', 'Under Review', 'Approved', 'Rejected', 'Issued'];

const generateServiceData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Generating Services...');

        const villages = await VillageOffice.find({});
        console.log(`Found ${villages.length} villages.`);

        let totalCreated = 0;

        for (const village of villages) {
            // Find an official for this village to act as the issuing officer
            const official = await Official.findOne({ villageOfficeId: village._id });
            if (!official) {
                console.log(`Skipping village ${village.villageName} - No official found.`);
                continue;
            }

            // Find citizens in this village
            const citizens = await Citizen.find({ villageOfficeId: village._id });
            if (citizens.length === 0) {
                console.log(`Skipping village ${village.villageName} - No citizens found. You might need to generate citizens first.`);
                continue;
            }

            console.log(`Generating services for ${village.villageName}...`);
            let count = 0;

            // Generate at least 30 random certificates per village
            const targetCount = 35; // slightly above 30
            for (let i = 0; i < targetCount; i++) {
                // Pick random citizen
                const applicant = citizens[Math.floor(Math.random() * citizens.length)];

                // Pick random certificate type and status
                const serviceName = CERTIFICATE_TYPES[Math.floor(Math.random() * CERTIFICATE_TYPES.length)];
                const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

                // Determine history based on status
                const history = [];
                const now = new Date();

                // Construct a timeline of statuses to make it realistic
                if (['Draft', 'Validated', 'Under Review', 'Approved', 'Rejected', 'Issued'].includes(status)) {
                    history.push({ status: 'Draft', timestamp: new Date(now.getTime() - 86400000 * 5), officerId: official._id, note: 'Initial application' });
                }
                if (['Validated', 'Under Review', 'Approved', 'Rejected', 'Issued'].includes(status)) {
                    history.push({ status: 'Validated', timestamp: new Date(now.getTime() - 86400000 * 4), officerId: official._id, note: 'Auto-validated' });
                }
                if (['Under Review', 'Approved', 'Rejected', 'Issued'].includes(status)) {
                    history.push({ status: 'Under Review', timestamp: new Date(now.getTime() - 86400000 * 3), officerId: official._id, note: 'Clerk verification passed' });
                }
                if (['Approved', 'Issued'].includes(status)) {
                    history.push({ status: 'Approved', timestamp: new Date(now.getTime() - 86400000 * 2), officerId: official._id, note: 'Approved by RO' });
                }
                if (status === 'Rejected') {
                    history.push({ status: 'Rejected', timestamp: new Date(now.getTime() - 86400000 * 2), officerId: official._id, note: 'Incomplete documentation' });
                }
                if (status === 'Issued') {
                    history.push({ status: 'Issued', timestamp: new Date(now.getTime() - 86400000), officerId: official._id, note: 'Certificate digitally issued' });
                }

                const newService = new ServiceRecord({
                    serviceName,
                    applicant: applicant._id,
                    officialId: official._id,
                    status,
                    villageId: village._id,
                    remarks: `Testing generic remarks for ${serviceName}`,
                    statusHistory: history,
                    rejectionReason: status === 'Rejected' ? 'Incomplete documentation' : undefined,
                    approvingOfficer: ['Approved', 'Issued'].includes(status) ? official._id : undefined,
                    issueDate: status === 'Issued' ? new Date(now.getTime() - 86400000) : undefined
                });

                await newService.save();
                count++;
                totalCreated++;
            }
            console.log(`Generated ${count} service records for ${village.villageName}`);
        }

        console.log(`\nSuccess! Generated a total of ${totalCreated} service records across the database.`);
        process.exit(0);

    } catch (error) {
        console.error('Error generating data:', error);
        process.exit(1);
    }
};

generateServiceData();
