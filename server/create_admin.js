require('dotenv').config();
const connectDB = require('./src/config/db');

(async () => {
    await connectDB();
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
})();
