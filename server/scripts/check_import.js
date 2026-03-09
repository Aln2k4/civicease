const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Official = require('../src/models/Official');

dotenv.config({ path: path.join(__dirname, '../.env') });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, { family: 4 });
        const count = await Official.countDocuments({});
        console.log(`Total Officials in DB: ${count}`);

        // Check one specific sample
        const sample = await Official.findOne({ username: 'KL01KAZHA' }); // KAZHAKOOTTAM
        if (sample) {
            console.log('Sample Official Found:', sample.username, sample.email);
        } else {
            console.log('Sample Official KL01KAZHA NOT Found.');
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

check();
