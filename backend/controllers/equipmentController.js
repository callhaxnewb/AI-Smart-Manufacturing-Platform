const Equipment = require('../models/equipment');

exports.getAllEquipment = async (req, res) => {
  try {
    const data = await Equipment.find();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching equipment' });
  }
};

exports.getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: equipment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching equipment' });
  }
};

exports.getEquipmentStatusSummary = async (req, res) => {
  try {
    const statusSummary = await Equipment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: statusSummary });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error getting status summary' });
  }
};

exports.getEquipmentMaintenanceHistory = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id, 'maintenanceHistory name');
    if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
    res.json({ success: true, equipment: equipment.name, history: equipment.maintenanceHistory });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching maintenance history' });
  }
};
