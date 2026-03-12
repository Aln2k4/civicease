const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
const certificateRoutes = require('./routes/certificate.routes');
const uploadRoutes = require('./routes/upload.routes');
const searchRoutes = require('./routes/search.routes');

app.use('/api/auth', authRoutes);
app.use('/api/citizens', citizenRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);

module.exports = app;
