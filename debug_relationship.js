const mongoose = require('mongoose');
const Citizen = require('./server/src/models/Citizen');

// Connect to MongoDB (adjust URI if needed, checking start_app.bat or .env would be good, but guessing standard local)
// Actually, I'll try to read .env first or guess. Usually mongodb://localhost:27017/civicease
// Let's assume standard local for now or try to finding connection string from existing files.

require('dotenv').config({ path: './server/.env' });

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicease');
        console.log('Connected to MongoDB');

        const citizens = await Citizen.find({ relationshipToHead: { $exists: true } });
        console.log(`Found ${citizens.length} citizens with relationshipToHead`);

        if (citizens.length > 0) {
            console.log('Sample:', citizens[0].name, citizens[0].relationshipToHead);
        } else {
            // Check if any citizens exist at all
            const allDocs = await Citizen.countDocuments();
            console.log(`Total citizens in DB: ${allDocs}`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

checkData();
