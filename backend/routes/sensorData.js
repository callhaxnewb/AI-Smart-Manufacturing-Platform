
const express = require('express');
const router = express.Router();
const {
  getSensorData,
  getAnalytics,
  getAnomalies,
  getMaintenancePredictions,
  importSensorData
} = require('../controllers/sensorDataController');

// Routes for sensor data API
router.get('/', getSensorData);
router.get('/analytics', getAnalytics);
router.get('/anomalies', getAnomalies);
router.get('/maintenance', getMaintenancePredictions);
router.post('/import', importSensorData);

module.exports = router;