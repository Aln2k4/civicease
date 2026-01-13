const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
// connectDB(); // Removed redundant call - already called in server.js

// Basic Route
app.get('/', (req, res) => {
    res.send('CivicEase API is running...');
});

// Import Routes
const authRoutes = require('./routes/auth.routes');
const citizenRoutes = require('./routes/citizen.routes');
const familyRoutes = require('./routes/family.routes');
const serviceRoutes = require('./routes/service.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

app.use('/api/auth', authRoutes);
app.use('/api/citizens', citizenRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/dashboard', dashboardRoutes);

module.exports = app;
