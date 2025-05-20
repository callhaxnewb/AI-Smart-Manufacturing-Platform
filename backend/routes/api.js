const express = require('express');
const router = express.Router();

// Import feature routes
const sensorDataRoutes = require('./sensorDataRoutes');
const equipmentRoutes = require('./equipmentRoutes');

// Mount routes
router.use('/sensor-data', sensorDataRoutes);
router.use('/equipment', equipmentRoutes);


module.exports = router;