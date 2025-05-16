// routes/api.js

const express = require('express');
const router = express.Router();

// Import feature routes
const sensorDataRoutes = require('./sensorData');

// Mount routes
router.use('/sensor-data', sensorDataRoutes);

// You can add more routes here later
// e.g., router.use('/equipment', require('./equipment'));

module.exports = router;
