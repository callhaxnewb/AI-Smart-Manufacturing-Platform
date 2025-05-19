const SensorData = require('../models/SensorData');

/**
 * Safely access nested properties in an object using a dot-notation string
 * @param {Object} obj - Object to access
 * @param {String} path - Dot-notation path (e.g., 'materials.extruder_A[0].actual_ratio')
 * @returns {*} - Value at the specified path or undefined
 */
function getNestedValue(obj, path) {
  try {
    return path.split('.').reduce((current, key) => {
      if (key.includes('[')) {
        const [arrayKey, index] = key.split(/\[|\]/).filter(Boolean);
        return current[arrayKey][parseInt(index)];
      }
      return current[key];
    }, obj);
  } catch (error) {
    return undefined;
  }
}

/**
 * Calculate z-scores for a dataset to identify outliers
 * @param {Array} data - Array of numerical values
 * @returns {Array} - Array of z-scores corresponding to each data point
 */
function calculateZScores(data) {
  const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
  const squaredDifferences = data.map(value => Math.pow(value - mean, 2));
  const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / data.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return data.map(() => 0);
  return data.map(value => (value - mean) / stdDev);
}

/**
 * Calculate Median Absolute Deviation (MAD) with outlier trimming
 * @param {Array} data - Array of numerical values
 * @returns {Array} - Array of MAD scores
 */
function calculateMAD(data) {
  const sortedData = [...data].sort((a, b) => a - b);
  const median = sortedData[Math.floor(sortedData.length / 2)];
  const absoluteDeviations = data.map(value => Math.abs(value - median));
  const sortedDeviations = [...absoluteDeviations].sort((a, b) => a - b);
  const trimPercent = 0.05;
  const trimCount = Math.floor(sortedDeviations.length * trimPercent);
  const trimmedDeviations = sortedDeviations.slice(trimCount, sortedDeviations.length - trimCount);
  const mad = trimmedDeviations[Math.floor(trimmedDeviations.length / 2)] || sortedDeviations[Math.floor(sortedDeviations.length / 2)];
  const consistencyConstant = 1.4826;
  return absoluteDeviations.map(deviation => (mad === 0) ? 0 : (deviation / (mad * consistencyConstant)));
}

/**
 * Detect anomalies in sensor data using multiple methods
 * @param {Object} sensorData - Object containing sensor readings
 * @param {Array} sensitiveParams - Array of parameters to monitor
 * @param {Array} historicalData - Cached historical data for parameters
 * @param {Number} zScoreThreshold - Threshold for z-score method
 * @param {Number} madThreshold - Threshold for MAD method
 * @returns {Object} - Anomaly detection results
 */
function detectAnomalies(sensorData, sensitiveParams = [], historicalData = [], zScoreThreshold = 3, madThreshold = 3.5) {
  const results = {
    isAnomaly: false,
    anomalyScore: 0,
    anomalyParameters: [],
    method: '',
    details: {}
  };

  if (!sensorData || typeof sensorData !== 'object' || Object.keys(sensorData).length === 0) {
    return results;
  }

  const parameters = sensitiveParams.length > 0 ? sensitiveParams : [
    'total_output',
    'extruder_A_pressure',
    'extruder_B_pressure',
    'extruder_C_pressure',
    'extruder_A_temperature',
    'extruder_B_temperature',
    'extruder_C_temperature',
    'blower_load_1',
    'blower_load_2',
    'blower_exhaust_actual',
    'actual_thickness',
    'heating_zones.extruder_A.zone_1.actual',
    'heating_zones.extruder_A.zone_3.actual',
    'heating_zones.extruder_A.zone_5.actual',
    'heating_zones.extruder_A.zone_7.actual',
    'heating_zones.extruder_B.zone_1.actual',
    'heating_zones.extruder_B.zone_3.actual',
    'heating_zones.extruder_B.zone_5.actual',
    'heating_zones.extruder_B.zone_7.actual',
    'heating_zones.extruder_C.zone_1.actual',
    'heating_zones.extruder_C.zone_3.actual',
    'heating_zones.extruder_C.zone_5.actual',
    'heating_zones.extruder_C.zone_7.actual',
    'materials.extruder_A[0].actual_ratio',
    'materials.extruder_A[1].actual_ratio',
    'materials.extruder_A[2].actual_ratio',
    'materials.extruder_A[3].actual_ratio',
    'materials.extruder_B[0].actual_ratio',
    'materials.extruder_B[1].actual_ratio',
    'materials.extruder_B[2].actual_ratio',
    'materials.extruder_B[3].actual_ratio',
    'materials.extruder_C[0].actual_ratio',
    'materials.extruder_C[1].actual_ratio',
    'materials.extruder_C[2].actual_ratio',
    'materials.extruder_C[3].actual_ratio'
  ];

  const paramScores = {};
  let maxZScore = 0;
  let maxMADScore = 0;
  let outlierCount = 0;

  for (const param of parameters) {
    const value = getNestedValue(sensorData, param);
    if (value === undefined || isNaN(value)) continue;

    const historicalValues = Array.isArray(historicalData) ?
      historicalData.map(d => {
        const val = getNestedValue(d, param);
        return (val !== undefined && !isNaN(val)) ? Number(val) : undefined;
      }).filter(v => v !== undefined) :
      [];

    if (historicalValues.length < 10) {
      let normalRange;
      if (param.includes('pressure')) {
        normalRange = { min: 300, max: 600 };
      } else if (param.includes('temperature')) {
        normalRange = { min: 180, max: 220 };
      } else if (param.includes('blower_load')) {
        normalRange = { min: 0, max: 150 };
      } else if (param === 'total_output') {
        normalRange = { min: 310, max: 330 };
      } else if (param === 'actual_thickness') {
        normalRange = { min: (getNestedValue(sensorData, 'target_thickness') || 25) - 2, max: (getNestedValue(sensorData, 'target_thickness') || 25) + 2 };
      } else if (param.includes('actual_ratio')) {
        const targetParam = param.replace('actual_ratio', 'target_ratio');
        normalRange = { min: (getNestedValue(sensorData, targetParam) || 0) - 0.5, max: (getNestedValue(sensorData, targetParam) || 0) + 0.5 };
      } else if (param.includes('blower_exhaust_actual')) {
        normalRange = { min: (getNestedValue(sensorData, 'blower_exhaust_setpoint') || 30) - 10, max: (getNestedValue(sensorData, 'blower_exhaust_setpoint') || 30) + 10 };
      } else if (param.includes('heating_zones')) {
        const setpointParam = param.replace('actual', 'setpoint');
        normalRange = { min: (getNestedValue(sensorData, setpointParam) || 0) - 30, max: (getNestedValue(sensorData, setpointParam) || 0) + 30 };
      } else {
        normalRange = { min: value * 0.7, max: value * 1.3 };
      }

      const rangeWidth = normalRange.max - normalRange.min;
      const rangeCenter = (normalRange.max + normalRange.min) / 2;
      const distance = Math.abs(value - rangeCenter);
      const zScore = (rangeWidth === 0) ? 0 : (distance / (rangeWidth / 6));
      const madScore = (value < normalRange.min) ? 
        (normalRange.min - value) / ((normalRange.min - (normalRange.min * 0.5)) || 1) :
        (value > normalRange.max) ? 
        (value - normalRange.max) / ((normalRange.max * 1.5 - normalRange.max) || 1) : 0;

      paramScores[param] = {
        value,
        normalRange,
        zScore,
        madScore,
        isOutlier: zScore > zScoreThreshold || madScore > madThreshold
      };
    } else {
      const zScores = calculateZScores(historicalValues.concat(value));
      const madScores = calculateMAD(historicalValues.concat(value));
      const zScore = zScores[zScores.length - 1];
      const madScore = madScores[zScores.length - 1];

      paramScores[param] = {
        value,
        zScore,
        madScore,
        isOutlier: Math.abs(zScore) > zScoreThreshold || madScore > madThreshold
      };
    }

    if (paramScores[param].isOutlier) {
      outlierCount++;
    }
    maxZScore = Math.max(maxZScore, Math.abs(paramScores[param].zScore));
    maxMADScore = Math.max(maxMADScore, paramScores[param].madScore);
  }

  const anomalousParams = Object.keys(paramScores).filter(param => paramScores[param].isOutlier);
  const zScoreNormalized = Math.min(maxZScore / (zScoreThreshold * 4), 1);
  const madScoreNormalized = Math.min(maxMADScore / (madThreshold * 4), 1);
  const finalScore = (zScoreNormalized + madScoreNormalized) / 2;

  results.isAnomaly = anomalousParams.length >= 3;
  results.anomalyScore = finalScore;
  results.anomalyParameters = anomalousParams;
  results.method = maxZScore > maxMADScore ? 'Z-Score' : 'MAD';
  results.details = paramScores;

  return results;
}

/**
 * Process a batch of sensor data to find anomalies
 * @param {Array} sensorDataBatch - Array of sensor data objects
 * @param {Array} allProcessedData - Array of all previously processed data in this import
 * @returns {Array} - Array of processed data with anomaly scores
 */
async function processBatch(sensorDataBatch, allProcessedData = []) {
  if (!Array.isArray(sensorDataBatch)) {
    console.error('Error: sensorDataBatch is not an array:', sensorDataBatch);
    return [];
  }

  const criticalParameters = [
    'total_output',
    'extruder_A_pressure',
    'extruder_B_pressure',
    'extruder_C_pressure',
    'extruder_A_temperature',
    'extruder_B_temperature',
    'extruder_C_temperature',
    'blower_load_1',
    'blower_load_2',
    'blower_exhaust_actual',
    'actual_thickness',
    'heating_zones.extruder_A.zone_1.actual',
    'heating_zones.extruder_A.zone_3.actual',
    'heating_zones.extruder_A.zone_5.actual',
    'heating_zones.extruder_A.zone_7.actual',
    'heating_zones.extruder_B.zone_1.actual',
    'heating_zones.extruder_B.zone_3.actual',
    'heating_zones.extruder_B.zone_5.actual',
    'heating_zones.extruder_B.zone_7.actual',
    'heating_zones.extruder_C.zone_1.actual',
    'heating_zones.extruder_C.zone_3.actual',
    'heating_zones.extruder_C.zone_5.actual',
    'heating_zones.extruder_C.zone_7.actual',
    'materials.extruder_A[0].actual_ratio',
    'materials.extruder_A[1].actual_ratio',
    'materials.extruder_A[2].actual_ratio',
    'materials.extruder_A[3].actual_ratio',
    'materials.extruder_B[0].actual_ratio',
    'materials.extruder_B[1].actual_ratio',
    'materials.extruder_B[2].actual_ratio',
    'materials.extruder_B[3].actual_ratio',
    'materials.extruder_C[0].actual_ratio',
    'materials.extruder_C[1].actual_ratio',
    'materials.extruder_C[2].actual_ratio',
    'materials.extruder_C[3].actual_ratio'
  ];

  // Validate sensor data before processing
  const validatedBatch = sensorDataBatch.map(data => {
    const totalOutput = getNestedValue(data, 'total_output');
    if (totalOutput === undefined || isNaN(totalOutput) || totalOutput <= 0 || totalOutput > 1000) {
      return { ...data, anomaly_score: 0, is_anomaly: false, anomaly_parameters: [], anomaly_method: 'none' };
    }
    return data;
  });

  // Combine MongoDB data and allProcessedData without duplication
  let historicalData = [];
  let mongoCount = 0;
  let processedCount = 0;
  try {
    const dbData = await SensorData.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    if (Array.isArray(dbData)) {
      historicalData = dbData.filter(d => {
        const totalOutput = getNestedValue(d, 'total_output');
        return totalOutput !== undefined && !isNaN(totalOutput) && totalOutput > 0 && totalOutput <= 1000;
      });
      mongoCount = historicalData.length;
    }
  } catch (error) {
    console.error(`Error fetching historical data: ${error.message}`);
  }
  const mongoTimestamps = new Set(historicalData.map(d => d.timestamp?.toISOString()));
  const uniqueProcessedData = allProcessedData.filter(d => {
    const totalOutput = getNestedValue(d, 'total_output');
    return !mongoTimestamps.has(d.timestamp?.toISOString()) && totalOutput !== undefined && !isNaN(totalOutput) && totalOutput > 0 && totalOutput <= 1000;
  });
  historicalData = [...historicalData, ...uniqueProcessedData].slice(-100);
  processedCount = uniqueProcessedData.length;

  // Calculate adaptive thresholds based on historical data
  let zScoreThreshold = 3;
  let madThreshold = 3.5;
  if (historicalData.length >= 20) {
    const sampleValues = historicalData
      .map(d => {
        const val = getNestedValue(d, criticalParameters[0]);
        return (val !== undefined && !isNaN(val)) ? Number(val) : undefined;
      })
      .filter(v => v !== undefined);
    if (sampleValues.length > 0) {
      try {
        const zScores = calculateZScores(sampleValues);
        const madScores = calculateMAD(sampleValues);
        const validZScores = zScores.filter(v => typeof v === 'number' && !isNaN(v));
        const validMadScores = madScores.filter(v => typeof v === 'number' && !isNaN(v));
        if (validZScores.length > 0 && validMadScores.length > 0) {
          zScoreThreshold = Math.max(3, Math.percentile(validZScores, 95));
          madThreshold = Math.max(3.5, Math.percentile(validMadScores, 95));
          madThreshold = Math.min(madThreshold, 10);
        }
      } catch (error) {
        console.error(`Error calculating adaptive thresholds: ${error.message}`);
      }
    }
  }

  const results = [];
  for (const data of validatedBatch) {
    try {
      if (data.anomaly_score !== undefined) {
        results.push(data);
        continue;
      }
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid sensor data object');
      }
      const anomalyResults = await detectAnomalies(data, criticalParameters, historicalData, zScoreThreshold, madThreshold);
      results.push({
        ...data,
        anomaly_score: anomalyResults.anomalyScore || 0,
        is_anomaly: anomalyResults.isAnomaly || false,
        anomaly_parameters: anomalyResults.anomalyParameters || [],
        anomaly_method: anomalyResults.method || 'none'
      });
    } catch (error) {
      console.error(`Error processing anomaly detection: ${error.message}`);
      results.push({
        ...(data || {}),
        anomaly_score: 0,
        is_anomaly: false,
        anomaly_parameters: [],
        anomaly_method: 'none'
      });
    }
  }
  return results;
}

/**
 * Calculate percentile of an array
 * @param {Array} arr - Array of numerical values
 * @param {Number} p - Percentile (0-100)
 * @returns {Number} - Value at the specified percentile
 */
Math.percentile = function(arr, p) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const validArr = arr.filter(v => typeof v === 'number' && !isNaN(v));
  if (validArr.length === 0) return 0;
  validArr.sort((a, b) => a - b);
  const index = Math.ceil(p / 100 * validArr.length) - 1;
  return validArr[index] || validArr[validArr.length - 1];
};

module.exports = {
  detectAnomalies,
  processBatch,
  calculateZScores,
  calculateMAD
};