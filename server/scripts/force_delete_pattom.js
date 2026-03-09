const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Citizen = require('../src/models/Citizen');
const VillageOffice = require('../src/models/VillageOffice');

const logFile = path.join(__dirname, 'delete_log.txt');

const log = (msg) => {
    console.log(msg);
    try {
        fs.appendFileSync(logFile, msg + '\n');
    } catch (e) {
        console.error("Log write failed:", e);
    }
};

const forceDelete = async () => {
    try {
        fs.writeFileSync(logFile, `Starting Deletion Script at ${new Date().toISOString()}\n`);
        await mongoose.connect(process.env.MONGO_URI);
        log("MongoDB Connected");

        // 1. Find ALL villages matching 'Pattom' to be sure
        const villages = await VillageOffice.find({ 
            villageName: { $regex: /pattom/i } 
        });

        log(`Found ${villages.length} villages matching 'Pattom':`);
        villages.forEach(v => log(` - ${v.villageName} (${v._id})`));

        if (villages.length === 0) {
            log("No village found. Exiting.");
            process.exit(0);
        }

        const targetVillage = villages[0];
        log(`Targeting Village: ${targetVillage.villageName} (${targetVillage._id})`);

        // 2. Count before delete
        const count = await Citizen.countDocuments({ villageOfficeId: targetVillage._id });
        log(`Found ${count} citizens in this village.`);

        // 3. Delete
        const result = await Citizen.deleteMany({ villageOfficeId: targetVillage._id });
        log(`DELETED ${result.deletedCount} citizens.`);

        process.exit(0);
    } catch (error) {
        log("Error: " + error);
        process.exit(1);
    }
};

forceDelete();
