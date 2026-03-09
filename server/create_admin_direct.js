const mongoose = require('mongoose');

const uri = "mongodb+srv://admin:project%402025@civicease.0k2i0cp.mongodb.net/civicease?retryWrites=true&w=majority";

mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 5000 }).then(async () => {
    const Official = require('./src/models/Official');
    try {
        let admin = await Official.findOne({ username: 'admin' });
        if (!admin) {
            admin = new Official({
                name: 'System Admin',
                username: 'admin',
                email: 'admin@civicease.gov.in',
                password: '11223344',
                role: 'Admin',
                department: 'Administration'
            });
            await admin.save();
            console.log('\nSUCCESS: Admin user successfully created.');
        } else {
            admin.password = '11223344';
            await admin.save();
            console.log('\nSUCCESS: Admin user existed, password updated.');
        }
    } catch (err) {
        console.error('\nERROR saving admin:', err.message);
    }
    process.exit(0);
}).catch(e => {
    console.error('Connection error:', e.message);
    process.exit(1);
});
