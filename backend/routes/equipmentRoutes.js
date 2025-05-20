// equipment.js (in routes)
const express = require('express');
const router = express.Router();
const {
  getAllEquipment,
  getEquipmentById,
  getEquipmentStatusSummary,
  getEquipmentMaintenanceHistory
} = require('../controllers/equipmentController');

router.get('/', getAllEquipment);
router.get('/status', getEquipmentStatusSummary);
router.get('/:id', getEquipmentById);
router.get('/:id/maintenance', getEquipmentMaintenanceHistory);

module.exports = router;
