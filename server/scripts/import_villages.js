const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Models (assuming paths)
const VillageOffice = require('../src/models/VillageOffice');
const Official = require('../src/models/Official');

const csvPath = path.join(__dirname, '../../Kerala_Villages_Usernames.csv');

const DISTRICT_MAP = {
    '01': 'Thiruvananthapuram',
    '02': 'Kollam',
    '03': 'Pathanamthitta',
    '04': 'Alappuzha',
    '05': 'Kottayam',
    '06': 'Idukki',
    '07': 'Ernakulam',
    '08': 'Thrissur',
    '09': 'Palakkad',
    '10': 'Malappuram',
    '11': 'Kozhikode',
    '12': 'Wayanad',
    '13': 'Kannur',
    '14': 'Kasaragod'
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, { family: 4 });
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('DB Connection error:', error);
        process.exit(1);
    }
};

const importData = async () => {
    await connectDB();

    try {
        const fileContent = fs.readFileSync(csvPath, 'utf8');
        const lines = fileContent.split(/\r?\n/);

        // Skip header
        const dataLines = lines.slice(1).filter(l => l.trim().length > 0);

        console.log(`Found ${dataLines.length} villages to process.`);

        let successCount = 0;
        let errorCount = 0;

        for (const line of dataLines) {
            // CSV Format: Sl. No.,Taluk,Village Name,Username,Password
            // Note: Some village names might contain commas? Assuming simple csv for now based on glimpse
            const parts = line.split(',');
            if (parts.length < 5) continue;

            // Handle potential commas in fields (naive implementation, but works for standard simple CSV)
            // If strictly formatted as given:
            const slNo = parts[0];
            const taluk = parts[1];
            const villageName = parts[2];
            const username = parts[3];
            const password = parts[4];

            if (!username || !password) continue;

            const districtCode = username.substring(2, 4); // KL01... -> 01
            const villageSuffix = username.substring(4); // KL01ANDOO -> ANDOO
            const districtName = DISTRICT_MAP[districtCode] || 'Unknown District';

            try {
                let villageOfficeId = null;

                // Create/Update VillageOffice only if not admin
                if (username !== 'admin') {
                    // 1. Create/Update VillageOffice
                    // Unique key: villageCode (we'll use the suffix or full username part as code)
                    const villageData = {
                        villageName: villageName.trim(),
                        taluk: taluk.trim(),
                        district: districtName,
                        stateCode: 'KL',
                        districtCode: districtCode,
                        villageCode: villageSuffix, // Using the code part from username
                        userId: username // Linking by username for now
                    };

                    let villageOffice = await VillageOffice.findOne({
                        stateCode: 'KL',
                        districtCode: districtCode,
                        villageCode: villageSuffix
                    });

                    if (villageOffice) {
                        villageOffice = await VillageOffice.findOneAndUpdate(
                            { _id: villageOffice._id },
                            villageData,
                            { new: true }
                        );
                    } else {
                        villageOffice = await VillageOffice.create(villageData);
                    }
                    villageOfficeId = villageOffice._id;
                }

                // 2. Create/Update Official
                // Ensure password hash
                // Note: Official model auto-hashes on save if modified.
                // If checking existence, we need to be careful not to double-hash if we just update

                let official = await Official.findOne({ username: username });

                if (!official) {
                    // Create new
                    official = new Official({
                        name: username === 'admin' ? 'System Admin' : `Officer ${villageName}`,
                        username: username,
                        email: `${username.toLowerCase()}@civicease.gov.in`, // Generate unique email to satisfy unique index
                        password: password, // Will be hashed by pre-save
                        role: username === 'admin' ? 'Admin' : 'Revenue Officer',
                        department: username === 'admin' ? 'Administration' : 'Revenue',
                        villageOfficeId: villageOfficeId
                    });
                    await official.save();
                } else {
                    // Update existing?
                    // If we want to reset password from CSV:
                    // official.password = password; 
                    // official.villageOfficeId = villageOffice._id;
                    // await official.save();

                    // For now, let's skip updating password to avoid re-hashing issues if we don't track raw vs hash
                    // But user specifically provided passwords. Let's assume reset.
                    official.name = username === 'admin' ? 'System Admin' : `Officer ${villageName}`;
                    official.villageOfficeId = villageOfficeId;
                    official.role = username === 'admin' ? 'Admin' : 'Revenue Officer';
                    official.department = username === 'admin' ? 'Administration' : 'Revenue';
                    official.password = password; // Trigger re-hash
                    await official.save();
                }

                successCount++;
                if (successCount % 10 === 0) process.stdout.write('.');

            } catch (err) {
                console.error(`\nError processing ${villageName} (${username}):`, err.message);
                errorCount++;
            }
        }

        console.log(`\nImport Completed. Success: ${successCount}, Errors: ${errorCount}`);
        process.exit(0);

    } catch (error) {
        console.error('Import Failed:', error);
        process.exit(1);
    }
};

importData();
