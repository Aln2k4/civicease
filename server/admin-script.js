require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, { family: 4 })
    .then(async () => {
        const Official = require('./src/models/Official');
        const admin = await Official.findOne({ username: 'admin' });
        fs.writeFileSync('admin_output.json', JSON.stringify({
            exists: !!admin,
            role: admin ? admin.role : null,
            villageOfficeId: admin ? admin.villageOfficeId : undefined
        }, null, 2));
        process.exit(0);
    })
    .catch(e => {
        fs.writeFileSync('admin_output.json', JSON.stringify({ error: e.message }));
        process.exit(1);
    });
