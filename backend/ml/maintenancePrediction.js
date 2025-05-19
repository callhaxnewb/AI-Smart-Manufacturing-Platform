// backend/ml/maintenancePrediction.js
// Uses historical data patterns and equipment operating parameters to predict maintenance needs

/**
 * Calculate equipment health score based on operational parameters and time factors
 * @param {Object} equipment - Equipment data with specifications and history
 * @param {Object} currentSensorData - Current sensor readings for the equipment
 * @returns {Object} - Health score and maintenance prediction
 */
function calculateHealthScore(equipment, currentSensorData) {
    // Start with a perfect health score of 100
    let healthScore = 100;
    const today = new Date();
    
    // FACTOR 1: Time since last maintenance (25% weight)
    if (equipment.lastMaintenanceDate) {
      const daysSinceLastMaintenance = Math.floor(
        (today - new Date(equipment.lastMaintenanceDate)) / (1000 * 60 * 60 * 24)
      );
      
      // Penalize based on days since last maintenance (more days = lower score)
      // Assume 180 days (6 months) is a reasonable maintenance interval
      const maintenanceInterval = equipment.specifications?.powerRating < 100 ? 365 : 180;
      const maintenanceAgeFactor = Math.min(daysSinceLastMaintenance / maintenanceInterval, 1) * 0.5; // Soften penalty
      healthScore -= maintenanceAgeFactor * 25;
    }
    
    // FACTOR 2: Age of equipment (15% weight)
    if (equipment.installationDate) {
      const ageInDays = Math.floor(
        (today - new Date(equipment.installationDate)) / (1000 * 60 * 60 * 24)
      );
      const ageInYears = ageInDays / 365;
      
      // Assume 10-year lifespan for equipment
      const ageFactor = Math.min(ageInYears / 10, 1);
      healthScore -= ageFactor * 15;
    }
    
    // FACTOR 3: Maintenance history severity (20% weight)
    if (equipment.maintenanceHistory && equipment.maintenanceHistory.length > 0) {
      // Calculate a severity score based on maintenance history
      let severityScore = 0;
      const pastYear = new Date();
      pastYear.setFullYear(pastYear.getFullYear() - 1);
      
      const recentMaintenance = equipment.maintenanceHistory.filter(record => 
        new Date(record.date) >= pastYear
      );
      
      // More weight to emergency maintenance
      const emergencyCount = recentMaintenance.filter(record => 
        record.type === 'emergency'
      ).length;
      
      // Less weight to corrective maintenance
      const correctiveCount = recentMaintenance.filter(record => 
        record.type === 'corrective'
      ).length;
      
      // Calculate severity (emergency issues are 3x more severe)
      severityScore = (emergencyCount * 3 + correctiveCount) / (recentMaintenance.length || 1);
      healthScore -= Math.min(severityScore * 10, 20);
    }
    
    // FACTOR 4: Current sensor readings compared to normal ranges (40% weight)
    if (currentSensorData && equipment.sensors) {
      let sensorScore = 0;
      let sensorsChecked = 0;
      
      // For each sensor, check if we have corresponding current data
      equipment.sensors.forEach(sensor => {
        // Find the corresponding sensor data (may need to match based on your data structure)
        let sensorValue = null;
        if (sensor.type === 'pressure') {
        sensorValue = equipment.type === 'blower' ? currentSensorData.blower_load_1 :
                        equipment.type === 'extruder' ? currentSensorData.extruder_A_pressure : null;
        } else if (sensor.type === 'temperature') {
        sensorValue = currentSensorData.extruder_A_temperature;
        } else if (sensor.type === 'flow') {
        sensorValue = currentSensorData.total_output ? currentSensorData.total_output * 5 : null; // Adjust scaling
        } else if (sensor.type === 'vibration') {
        sensorValue = null; // No vibration data in CSV, skip
        }
                
        if (sensorValue !== null && sensor.normalRange) {
          sensorsChecked++;
          
          // Check if value is outside normal range
          if (sensorValue < sensor.normalRange.min || sensorValue > sensor.normalRange.max) {
            // Calculate deviation as percentage of range
            const range = sensor.normalRange.max - sensor.normalRange.min;
            let deviation;
            
            if (sensorValue < sensor.normalRange.min) {
                deviation = ((sensor.normalRange.min - sensorValue) / range) * 0.5; // Soften penalty
            } else {
            deviation = ((sensorValue - sensor.normalRange.max) / range) * 0.5;
            }
        
            // Cap deviation at 100%
            deviation = Math.min(deviation, 1);
            sensorScore += deviation;
          }
        }
      });
      
      // Calculate average sensor deviation
      if (sensorsChecked > 0) {
        const avgDeviation = sensorScore / sensorsChecked;
        healthScore -= avgDeviation * 40;
      }
    }
    
    // Ensure health score stays between 0-100
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    // Convert health score to a 0-10 scale for easier interpretation
    const normalizedHealthScore = Math.round((healthScore / 100) * 10 * 1.5) / 1.5; // Adjust scaling
    
    // Predict days until maintenance is needed based on health score
    // Health score of 100 = 180 days (6 months), 0 = immediate maintenance
    const daysToMaintenance = Math.round((healthScore / 100) * 180);
    
    // Determine risk level
    let riskLevel;
    if (healthScore >= 80) {
      riskLevel = 'low';
    } else if (healthScore >= 60) {
      riskLevel = 'moderate';
    } else if (healthScore >= 40) {
      riskLevel = 'high';
    } else {
      riskLevel = 'critical';
    }
    
    return {
      healthScore: normalizedHealthScore,
      maintenance_prediction: {
        days_to_maintenance: daysToMaintenance,
        risk_level: riskLevel,
        next_maintenance_date: new Date(today.getTime() + (daysToMaintenance * 24 * 60 * 60 * 1000)),
        confidence: calculateConfidenceScore(equipment, currentSensorData)
      }
    };
  }
  
  /**
   * Calculate confidence score for the maintenance prediction
   * @param {Object} equipment - Equipment data
   * @param {Object} sensorData - Current sensor readings
   * @returns {Number} - Confidence score between 0-1
   */
  function calculateConfidenceScore(equipment, sensorData) {
    let confidenceScore = 0.7; // Start with a baseline confidence
    
    // More maintenance history = higher confidence
    if (equipment.maintenanceHistory && equipment.maintenanceHistory.length > 0) {
      confidenceScore += Math.min(equipment.maintenanceHistory.length * 0.02, 0.1);
    }
    
    // More sensors with data = higher confidence
    if (equipment.sensors && sensorData) {
      const sensorDataPoints = Object.keys(sensorData).length;
      confidenceScore += Math.min(sensorDataPoints * 0.005, 0.1);
    }
    
    // Older equipment has more predictable maintenance patterns
    if (equipment.installationDate) {
      const ageInYears = (new Date() - new Date(equipment.installationDate)) / (1000 * 60 * 60 * 24 * 365);
      confidenceScore += Math.min(ageInYears * 0.01, 0.1);
    }
    
    // Cap at 1.0
    return Math.min(confidenceScore, 1.0);
  }
  
  /**
   * Process equipment data to generate maintenance predictions
   * @param {Object} equipmentData - Equipment data object
   * @param {Object} sensorData - Latest sensor readings
   * @returns {Object} - Equipment data with maintenance predictions
   */
  function predictMaintenance(equipmentData, sensorData) {
    if (!equipmentData) {
      return null;
    }
    
    const healthAssessment = calculateHealthScore(equipmentData, sensorData);
    
    return {
      ...equipmentData,
      healthScore: healthAssessment.healthScore,
      maintenance_prediction: healthAssessment.maintenance_prediction
    };
  }
  
  /**
   * Process batch of equipment data with corresponding sensor readings
   * @param {Array} equipmentBatch - Array of equipment objects
   * @param {Object} sensorDataMap - Map of equipment ID to sensor data
   * @returns {Array} - Processed equipment data with maintenance predictions
   */
  function processBatch(equipmentBatch, sensorDataMap = {}) {
    return equipmentBatch.map(equipment => {
      const relevantSensorData = sensorDataMap[equipment._id] || {};
      return predictMaintenance(equipment, relevantSensorData);
    });
  }
  
  module.exports = {
    predictMaintenance,
    processBatch,
    calculateHealthScore
  };