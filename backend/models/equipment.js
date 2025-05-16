const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['extruder', 'blower', 'winder', 'heater', 'sensor', 'other'],
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  serialNumber: {
    type: String,
    trim: true,
  },
  installationDate: {
    type: Date,
  },
  lastMaintenanceDate: {
    type: Date,
  },
  nextScheduledMaintenance: {
    type: Date,
  },
  specifications: {
    manufacturer: String,
    model: String,
    powerRating: Number, // in kW
    maxOperatingTemp: Number, // in Celsius
    maxPressure: Number, // in bar
    capacity: Number, // varies by equipment type
  },
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'fault', 'offline'],
    default: 'operational',
  },
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  maintenanceHistory: [
    {
      date: Date,
      type: {
        type: String,
        enum: ['preventive', 'corrective', 'emergency', 'inspection'],
      },
      description: String,
      technician: String,
      parts: [String],
      cost: Number,
    },
  ],
  sensors: [
    {
      type: new mongoose.Schema({
        name: String,
        dataPointId: String,
        type: String,
        unit: String,
        normalRange: {
          min: Number,
          max: Number,
        }
      }, { _id: false }) // Use _id: false to prevent automatic _id for subdocuments
    }
  ],
  
}, {
  timestamps: true,
});

module.exports = mongoose.model('Equipment', EquipmentSchema);