const express = require('express');
const router = express.Router();
const {
  getSensorData,
  getAnalytics,
  getAnomalies,
  getMaintenancePredictions,
  importSensorData,
  getQualityScores,
  processSensorData
} = require('../controllers/sensorDataController');

// Routes for sensor data API
router.get('/', getSensorData);
router.get('/analytics', getAnalytics);
router.get('/anomalies', getAnomalies);
router.get('/maintenance', getMaintenancePredictions);
router.get('/quality', getQualityScores);
router.post('/import', importSensorData);
router.post('/process', processSensorData);

module.exports = router;