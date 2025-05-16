const SensorData = require('../models/SensorData');

// @desc    Get all sensor data with pagination
// @route   GET /api/sensor-data
// @access  Public
exports.getSensorData = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    
    // Build the query
    let query = {};
    
    // Add date range if provided
    if (startDate && endDate) {
      query.timestamp = {
        $gte: startDate,
        $lte: endDate
      };
    } else if (startDate) {
      query.timestamp = { $gte: startDate };
    } else if (endDate) {
      query.timestamp = { $lte: endDate };
    }
    
    // Get total count for pagination
    const total = await SensorData.countDocuments(query);
    
    // Fetch data with pagination
    const data = await SensorData.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    res.json({
      success: true,
      count: data.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data
    });
  } catch (error) {
    console.error(`Error fetching sensor data: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get analytics and summary stats
// @route   GET /api/sensor-data/analytics
// @access  Public
exports.getAnalytics = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '24h'; // Default to last 24 hours
    
    let startDate = new Date();
    // Calculate the start date based on the timeframe
    switch(timeframe) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setHours(startDate.getHours() - 24);
    }
    
    // Get average values for key metrics
    const aggregatedData = await SensorData.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgExtruderA_Pressure: { $avg: '$extruder_A_pressure' },
          avgExtruderB_Pressure: { $avg: '$extruder_B_pressure' },
          avgExtruderC_Pressure: { $avg: '$extruder_C_pressure' },
          avgExtruderA_Temperature: { $avg: '$extruder_A_temperature' },
          avgExtruderB_Temperature: { $avg: '$extruder_B_temperature' },
          avgExtruderC_Temperature: { $avg: '$extruder_C_temperature' },
          avgTotalOutput: { $avg: '$total_output' },
          avgTargetOutput: { $avg: '$target_output' },
          efficiencyAvg: { $avg: '$efficiency' },
          recordCount: { $sum: 1 },
          anomalyCount: { 
            $sum: { 
              $cond: [{ $gt: ['$anomaly_score', 0.7] }, 1, 0] 
            }
          },
          highRiskCount: {
            $sum: {
              $cond: [{ $eq: ['$maintenance_prediction.risk_level', 'high'] }, 1, 0]
            }
          },
          criticalRiskCount: {
            $sum: {
              $cond: [{ $eq: ['$maintenance_prediction.risk_level', 'critical'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // Get recent anomalies
    const recentAnomalies = await SensorData.find({ 
      anomaly_score: { $gt: 0.7 },
      timestamp: { $gte: startDate }
    })
    .sort({ anomaly_score: -1 })
    .limit(5);
    
    // Get current status - most recent reading
    const currentStatus = await SensorData.findOne()
      .sort({ timestamp: -1 })
      .limit(1);
    
    res.json({
      success: true,
      timeframe,
      analytics: aggregatedData[0] || {},
      recentAnomalies,
      currentStatus,
      timestamp: new Date()
    });
  } catch (error) {
    console.error(`Error fetching analytics: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get anomaly data
// @route   GET /api/sensor-data/anomalies
// @access  Public
exports.getAnomalies = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const threshold = parseFloat(req.query.threshold) || 0.7;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const anomalies = await SensorData.find({
      timestamp: { $gte: startDate },
      anomaly_score: { $gt: threshold }
    })
    .sort({ anomaly_score: -1 })
    .limit(100);
    
    res.json({
      success: true,
      count: anomalies.length,
      data: anomalies
    });
  } catch (error) {
    console.error(`Error fetching anomalies: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get maintenance predictions
// @route   GET /api/sensor-data/maintenance
// @access  Public
exports.getMaintenancePredictions = async (req, res) => {
  try {
    const riskLevel = req.query.risk || 'all';
    
    let query = {};
    
    if (riskLevel !== 'all') {
      query['maintenance_prediction.risk_level'] = riskLevel;
    }
    
    const predictions = await SensorData.find(query)
      .sort({ 'maintenance_prediction.days_to_maintenance': 1 })
      .limit(20);
    
    res.json({
      success: true,
      count: predictions.length,
      data: predictions
    });
  } catch (error) {
    console.error(`Error fetching maintenance predictions: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Import sensor data (for initial data loading)
// @route   POST /api/sensor-data/import
// @access  Private
exports.importSensorData = async (req, res) => {
  try {
    // This would typically process uploaded CSV file
    // For now we'll just have a placeholder
    res.json({
      success: true,
      message: 'Data import endpoint ready. Upload functionality will be implemented soon.'
    });
  } catch (error) {
    console.error(`Error importing data: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};