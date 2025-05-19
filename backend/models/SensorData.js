const mongoose = require('mongoose');

const SensorDataSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    index: true // Index for faster queries by timestamp
  },
  
  // Extruder Performance Metrics
  extruder_A_pressure: Number,
  extruder_B_pressure: Number,
  extruder_C_pressure: Number,
  extruder_A_temperature: Number,
  extruder_B_temperature: Number,
  extruder_C_temperature: Number,
  
  // Heating Zone Data (simplified for key zones)
  heating_zones: {
    extruder_A: {
      zone_1: {
        setpoint: Number,    // Regler_X
        actual: Number,      // Regler_Y
        power: Number        // ActEffectPower
      },
      zone_3: {
        setpoint: Number,
        actual: Number,
        power: Number
      },
      zone_5: {
        setpoint: Number,
        actual: Number,
        power: Number
      },
      zone_7: {
        setpoint: Number,
        actual: Number,
        power: Number
      }
    },
    extruder_B: {
      zone_1: {
        setpoint: Number,
        actual: Number,
        power: Number
      },
      zone_3: {
        setpoint: Number,
        actual: Number,
        power: Number
      },
      zone_5: {
        setpoint: Number,
        actual: Number,
        power: Number
      },
      zone_7: {
        setpoint: Number,
        actual: Number,
        power: Number
      }
    },
    extruder_C: {
      zone_1: {
        setpoint: Number,
        actual: Number,
        power: Number
      },
      zone_3: {
        setpoint: Number,
        actual: Number,
        power: Number
      },
      zone_5: {
        setpoint: Number,
        actual: Number,
        power: Number
      },
      zone_7: {
        setpoint: Number,
        actual: Number,
        power: Number
      }
    }
  },
  
  // Production Output Metrics
  total_output: Number,
  target_output: Number,
  actual_thickness: Number,
  target_thickness: Number,
  
  // Material Composition Data (Simplified format)
  materials: {
    extruder_A: [
      {
        component: Number, // Component number
        actual_ratio: Number,
        target_ratio: Number,
        density: Number
      }
    ],
    extruder_B: [
      {
        component: Number,
        actual_ratio: Number,
        target_ratio: Number,
        density: Number
      }
    ],
    extruder_C: [
      {
        component: Number,
        actual_ratio: Number,
        target_ratio: Number,
        density: Number
      }
    ]
  },
  
  // Equipment Utilization
  blower_load_1: Number,
  blower_load_2: Number,
  blower_exhaust_actual: Number,
  blower_exhaust_setpoint: Number,
  
  // Winder Data
  winder_1_length: Number,
  winder_2_length: Number,
  winder_1_remaining_time: Number,
  winder_2_remaining_time: Number,
  
  // Calculated fields for analytics
  efficiency: Number, // Can be calculated during data import
  quality_score: Number, // Can be derived from measurements
  anomaly_score: { // For ML anomaly detection
    type: Number,
    default: 0
  },
  is_anomaly: {
    type: Boolean,
    default: false
  },
  anomaly_parameters: [String],
  anomaly_method: {
    type: String,
    default: 'none'
  },
  quality_details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  process_capability: {
    thickness: {
      Cp: { type: Number, default: 0 },
      Cpk: { type: Number, default: 0 }
    },
    throughput: {
      Cp: { type: Number, default: 0 },
      Cpk: { type: Number, default: 0 }
    }
  },
  healthScore: {
    type: Number,
    default: 8
  },
  maintenance_prediction: {
    risk_level: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    days_to_maintenance: Number
  }
}, {
  timestamps: true,
  collection: 'sensor_data'
});

// Create indexes for common queries
SensorDataSchema.index({ timestamp: 1 });
SensorDataSchema.index({ 'anomaly_score': -1 });
SensorDataSchema.index({ 'maintenance_prediction.risk_level': 1 });

module.exports = mongoose.model('SensorData', SensorDataSchema);