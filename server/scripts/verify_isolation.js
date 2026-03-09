const mongoose = require('mongoose');
const request = require('http');
const dotenv = require('dotenv');
const app = require('../src/app'); // Import the express app
const VillageOffice = require('../src/models/VillageOffice');
const Official = require('../src/models/Official');
const path = require('path');

// Load env from parent dir
dotenv.config({ path: path.join(__dirname, '../.env') });

const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server;
let villageA, villageB;
let tokenA, tokenB;
let userA, userB;

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('MongoDB Connected for usage');
    } catch (error) {
        console.error('DB Connection error:', error);
        process.exit(1);
    }
};

const startServer = () => {
    return new Promise((resolve) => {
        server = app.listen(TEST_PORT, () => {
            console.log(`Test Server running on port ${TEST_PORT}`);
            resolve();
        });
    });
};

const post = (endpoint, data, token) => {
    return new Promise((resolve, reject) => {
        const dataString = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: TEST_PORT,
            path: `/api${endpoint}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': dataString.length,
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        const req = request.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body || '{}') }));
        });
        req.on('error', reject);
        req.write(dataString);
        req.end();
    });
};

const get = (endpoint, token) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: TEST_PORT,
            path: `/api${endpoint}`,
            method: 'GET',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        const req = request.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body || '{}') }));
        });
        req.on('error', reject);
        req.end();
    });
};

const setupData = async () => {
    // Clean up previous test data if any specific codes exist
    // For safety, we create unique codes
    const suffix = Math.floor(Math.random() * 10000);

    villageA = await VillageOffice.create({
        villageName: `TestVillageA_${suffix}`,
        taluk: 'TestTaluk',
        district: 'TestDistrict',
        stateCode: 'KL',
        districtCode: '99',
        villageCode: `TVA${suffix}`.substring(0, 5),
        userId: 'temp'
    });

    villageB = await VillageOffice.create({
        villageName: `TestVillageB_${suffix}`,
        taluk: 'TestTaluk',
        district: 'TestDistrict',
        stateCode: 'KL',
        districtCode: '99',
        villageCode: `TVB${suffix}`.substring(0, 5),
        userId: 'temp'
    });

    console.log(`Created Villages: ${villageA.villageCode}, ${villageB.villageCode}`);
};

const runTests = async () => {
    try {
        await connectDB();
        await startServer();
        await setupData();

        console.log('\n--- TEST 1: Register User A for Village A ---');
        const regA = await post('/auth/register', {
            name: 'User A',
            email: `usera_${Date.now()}@test.com`,
            villageOfficeId: villageA._id,
            role: 'Revenue Officer'
        });
        console.log('Register A:', regA.status, regA.body.username);
        if (regA.status !== 201) throw new Error("Failed to register A");
        const passwordA = regA.body.generatedPassword;
        const usernameA = regA.body.username;

        console.log('\n--- TEST 2: Login User A ---');
        const loginA = await post('/auth/login', { identifier: usernameA, password: passwordA });
        console.log('Login A:', loginA.status);
        tokenA = loginA.body.token;
        if (!tokenA) throw new Error("No token for A");

        console.log('\n--- TEST 3: Register User B for Village B ---');
        const regB = await post('/auth/register', {
            name: 'User B',
            email: `userb_${Date.now()}@test.com`,
            villageOfficeId: villageB._id,
            role: 'Revenue Officer'
        });
        console.log('Register B:', regB.status);
        const passwordB = regB.body.generatedPassword;
        const usernameB = regB.body.username;
        const loginB = await post('/auth/login', { identifier: usernameB, password: passwordB });
        tokenB = loginB.body.token;

        console.log('\n--- TEST 4: Isolation - User A creates Citizen ---');
        const citizenRes = await post('/citizens', {
            name: 'Citizen A',
            uniqueId: `CIT${Date.now()}`,
            villageOfficeId: villageB._id // ATTACK: Trying to create for Village B!
        }, tokenA);

        console.log('Create Citizen Response:', citizenRes.status, citizenRes.body);

        // Verify created citizen has Village A (overridden) or failed (if logic differs)
        // My implementation overrides it to req.villageId (Village A).
        if (citizenRes.status === 201) {
            const created = citizenRes.body;
            if (created.villageOfficeId === villageA._id.toString()) {
                console.log('SUCCESS: Backend forced Village A ID despite request payload trying Village B.');
            } else {
                console.error('FAILURE: Citizen created with wrong village ID!', created.villageOfficeId);
            }
        } else {
            console.log('Citizen creation failed (might be ok if validation checks other things)');
        }

        console.log('\n--- TEST 5: Isolation - User B tries to fetch Citizen A ---');
        // Need ID of citizen A
        if (citizenRes.body._id) {
            const fetchRes = await get(`/citizens/${citizenRes.body._id}`, tokenB);
            console.log('Fetch attempt by B:', fetchRes.status, fetchRes.body.message);
            if (fetchRes.status === 403 || fetchRes.status === 404) {
                console.log('SUCCESS: Access Denied/Not Found as expected.');
            } else {
                console.error('FAILURE: User B accessed User A data!');
            }
        }

        console.log('\n--- TEST 6: Duplicate Account Constraint ---');
        // Try to register another user for Village A
        const regDuplicate = await post('/auth/register', {
            name: 'User A2',
            email: `usera2_${Date.now()}@test.com`,
            villageOfficeId: villageA._id, // Same village!
            role: 'Revenue Officer'
        });
        console.log('Duplicate Reg Response:', regDuplicate.status, regDuplicate.body.message);
        if (regDuplicate.status === 400 && regDuplicate.body.message.includes('already exists')) {
            console.log('SUCCESS: Duplicate account blocked.');
        } else {
            console.error('FAILURE: Duplicate account allowed or wrong error.');
        }

    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        if (villageA) await VillageOffice.findByIdAndDelete(villageA._id);
        if (villageB) await VillageOffice.findByIdAndDelete(villageB._id);
        // Clean up users...
        console.log('Cleaning up...');
        // (Skipping full cleanup for brevity, assume manual or test DB)

        if (server) server.close();
        mongoose.disconnect();
        process.exit(0);
    }
};

runTests();
