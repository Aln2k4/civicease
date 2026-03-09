require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const VillageOffice = require('../src/models/VillageOffice');
const Official = require('../src/models/Official');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB connection error:', err));

const results = [];
const csvPath = path.join(__dirname, '../../Kerala_Villages_Usernames.csv');

fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        try {
            console.log(`Parsed ${results.length} rows. Starting upload...`);

            let addedVillages = 0;
            let addedOfficials = 0;

            for (const row of results) {
                // Determine headers used in the merged CSV
                const taluk = row['Taluk'];
                const villageName = row['Village Name'];
                const username = row['Username'];
                const password = row['Password'];

                if (!username || !password || !villageName) continue;

                // Extract state, district, and village codes from Username if possible
                let stateCode = 'KL';
                let districtCode = '00';
                let villageCode = username.slice(-5) || username;

                if (username.startsWith('KL')) {
                    districtCode = username.substring(2, 4);
                }

                // 1. Create or find VillageOffice
                let office = await VillageOffice.findOne({
                    stateCode,
                    districtCode,
                    villageCode
                });

                if (!office) {
                    // Just a dummy userId for now, since it's required but useless
                    office = new VillageOffice({
                        userId: username,
                        villageName: villageName,
                        taluk: taluk || 'Unknown',
                        district: 'Unknown', // We could try to map districtCode, but 'Unknown' is fine for now
                        stateCode: stateCode,
                        districtCode: districtCode,
                        villageCode: villageCode
                    });

                    try {
                        await office.save();
                        addedVillages++;
                    } catch (e) {
                        if (e.code !== 11000) console.error("Error creating village:", office.villageName, e.message);
                        office = await VillageOffice.findOne({ stateCode, districtCode, villageCode });
                    }
                }

                if (!office) {
                    console.log(`Skipping official ${username} - failed to resolve office.`);
                    continue;
                }

                // 2. Create or find Official
                let official = await Official.findOne({ username: username });

                if (!official) {
                    official = new Official({
                        name: `${villageName} Village Officer`,
                        username: username,
                        password: password, // The model hook will hash this
                        role: 'Revenue Officer', // Default for these accounts
                        department: 'Revenue',
                        villageOfficeId: office._id
                    });

                    try {
                        await official.save();
                        addedOfficials++;
                    } catch (e) {
                        console.error("Error creating official:", username, e.message);
                    }
                }
            }

            console.log(`Upload complete!`);
            console.log(`Added ${addedVillages} new Village Offices.`);
            console.log(`Added ${addedOfficials} new Officials.`);
            process.exit(0);
        } catch (error) {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    });
