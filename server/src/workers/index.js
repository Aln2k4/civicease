require('dotenv').config();
const mongoose = require('mongoose');

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicease');
        console.log('MongoDB Connected for Worker');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();

// Build Models (ensure they are registered if not required inside worker)
require('../models/Official');
require('../models/VillageOffice');
require('../models/Citizen');
require('../models/Family');
require('../models/UploadSession');
require('../models/UploadError');

// Start Worker
// require('./uploadWorker');
