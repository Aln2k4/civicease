const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

console.log("Script starting...");
// Load env vars
const envPath = path.join(__dirname, '../.env');
console.log("Loading env from:", envPath);
dotenv.config({ path: envPath });

console.log("MONGO_URI present:", !!process.env.MONGO_URI);

const deletePattomCitizens = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        // 1. Find Pattom Village Office
        const pattomOffice = await VillageOffice.findOne({
            villageName: { $regex: new RegExp('^PATTOM$', 'i') }
        });

        if (!pattomOffice) {
            console.error("Village 'Pattom' not found!");
            process.exit(1);
        }

        console.log(`Found Village: ${pattomOffice.villageName} (ID: ${pattomOffice._id})`);

        // 2. Delete Citizens
        const result = await Citizen.deleteMany({ villageOfficeId: pattomOffice._id });

        console.log(`Successfully deleted ${result.deletedCount} citizens from Pattom.`);

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

deletePattomCitizens();
