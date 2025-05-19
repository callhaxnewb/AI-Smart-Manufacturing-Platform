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
 * Calculate deviation score for a single parameter
 * @param {Number} actual - Actual measured value
 * @param {Number} target - Target value
 * @param {Object} tolerance - Tolerance range { min, max }
 * @returns {Number} - Deviation score (0-1, where 1 is within tolerance)
 */
function calculateDeviationScore(actual, target, tolerance) {
  if (actual === undefined || target === undefined || isNaN(actual) || isNaN(target)) {
    return 0;
  }

  const deviation = Math.abs(actual - target);
  const toleranceRange = tolerance.max - tolerance.min;
  if (toleranceRange === 0) return 0;

  if (deviation <= (toleranceRange / 2)) {
    return 1;
  } else {
    const excessDeviation = deviation - (toleranceRange / 2);
    return Math.max(0, 1 - (excessDeviation / (toleranceRange / 2)));
  }
}

/**
 * Calculate process capability indices (Cp, Cpk)
 * @param {Array} data - Array of values for a parameter
 * @param {Object} specLimits - Specification limits { LSL, USL }
 * @returns {Object} - Cp and Cpk values
 */
function calculateProcessCapability(data, specLimits) {
  if (!data || data.length < 10 || !specLimits || specLimits.USL <= specLimits.LSL) {
    return { Cp: 0, Cpk: 0 };
  }

  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (data.length - 1);
  const stdDev = Math.sqrt(variance);

  const USL = specLimits.USL;
  const LSL = specLimits.LSL;
  const Cp = stdDev === 0 ? 0 : (USL - LSL) / (6 * stdDev);
  const Cpu = stdDev === 0 ? 0 : (USL - mean) / (3 * stdDev);
  const Cpl = stdDev === 0 ? 0 : (mean - LSL) / (3 * stdDev);
  const Cpk = Math.min(Cpu, Cpl);

  return { Cp, Cpk: Math.max(Cpk, 0) }; // Prevent negative Cpk
}

/**
 * Calculate quality score for sensor data
 * @param {Object} sensorData - Single sensor data object
 * @param {Object} tolerances - Tolerance ranges for parameters
 * @param {Array} allProcessedData - Previously processed data in this import
 * @returns {Object} - Quality score and details
 */
async function calculateQualityScore(sensorData, tolerances = {}, allProcessedData = []) {
  const criticalParameters = [
    'actual_thickness',
    'total_output',
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

  const targetParameters = {
    'actual_thickness': 'target_thickness',
    'total_output': 'target_output',
    'materials.extruder_A[0].actual_ratio': 'materials.extruder_A[0].target_ratio',
    'materials.extruder_A[1].actual_ratio': 'materials.extruder_A[1].target_ratio',
    'materials.extruder_A[2].actual_ratio': 'materials.extruder_A[2].target_ratio',
    'materials.extruder_A[3].actual_ratio': 'materials.extruder_A[3].target_ratio',
    'materials.extruder_B[0].actual_ratio': 'materials.extruder_B[0].target_ratio',
    'materials.extruder_B[1].actual_ratio': 'materials.extruder_B[1].target_ratio',
    'materials.extruder_B[2].actual_ratio': 'materials.extruder_B[2].target_ratio',
    'materials.extruder_B[3].actual_ratio': 'materials.extruder_B[3].target_ratio',
    'materials.extruder_C[0].actual_ratio': 'materials.extruder_C[0].target_ratio',
    'materials.extruder_C[1].actual_ratio': 'materials.extruder_C[1].target_ratio',
    'materials.extruder_C[2].actual_ratio': 'materials.extruder_C[2].target_ratio',
    'materials.extruder_C[3].actual_ratio': 'materials.extruder_C[3].target_ratio'
  };

  const defaultTolerances = {
    'actual_thickness': { min: -0.5, max: 0.5 },
    'total_output': { min: -20, max: 20 }, // Widened from ±10
    'materials.extruder_A[0].actual_ratio': { min: -0.2, max: 0.2 }, // Widened from ±0.1
    'materials.extruder_A[1].actual_ratio': { min: -0.2, max: 0.2 },
    'materials.extruder_A[2].actual_ratio': { min: -0.2, max: 0.2 },
    'materials.extruder_A[3].actual_ratio': { min: -0.2, max: 0.2 },
    'materials.extruder_B[0].actual_ratio': { min: -0.2, max: 0.2 },
    'materials.extruder_B[1].actual_ratio': { min: -0.2, max: 0.2 },
    'materials.extruder_B[2].actual_ratio': { min: -0.2, max: 0.2 },
    'materials.extruder_B[3].actual_ratio': { min: -0.2, max: 0.2 },
    'materials.extruder_C[0].actual_ratio': { min: -0.2, max: 0.2 },
    'materials.extruder_C[1].actual_ratio': { min: -0.2, max: 0.2 },
    'materials.extruder_C[2].actual_ratio': { min: -0.2, max: 0.2 },
    'materials.extruder_C[3].actual_ratio': { min: -0.2, max: 0.2 }
  };

  const effectiveTolerances = { ...defaultTolerances, ...tolerances };

  let totalScore = 0;
  let paramCount = 0;
  const details = {};

  criticalParameters.forEach(param => {
    const targetParam = targetParameters[param];
    const actual = getNestedValue(sensorData, param);
    const target = getNestedValue(sensorData, targetParam);

    if (actual !== undefined && target !== undefined && !isNaN(actual) && !isNaN(target)) {
      const score = calculateDeviationScore(actual, target, effectiveTolerances[param]);
      totalScore += score;
      paramCount++;
      details[param] = { actual, target, score };
    }
  });

  const deviationScore = paramCount > 0 ? (totalScore / paramCount) * 50 : 0;

  // Fetch and validate historical data (100 records, 50 from MongoDB)
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

  // Deduplicate with allProcessedData
  const mongoTimestamps = new Set(historicalData.map(d => d.timestamp?.toISOString()));
  const uniqueProcessedData = allProcessedData.filter(d => {
    const totalOutput = getNestedValue(d, 'total_output');
    return !mongoTimestamps.has(d.timestamp?.toISOString()) && totalOutput !== undefined && !isNaN(totalOutput) && totalOutput > 0 && totalOutput <= 1000;
  });
  historicalData = [...historicalData, ...uniqueProcessedData].slice(-100);
  processedCount = uniqueProcessedData.length;

  const specLimits = {
    'actual_thickness': { 
      LSL: getNestedValue(sensorData, 'target_thickness') - 0.5, 
      USL: getNestedValue(sensorData, 'target_thickness') + 0.5 
    },
    'total_output': { 
      LSL: getNestedValue(sensorData, 'target_output') - 20, 
      USL: getNestedValue(sensorData, 'target_output') + 20 
    }
  };

  try {
    const thicknessData = historicalData
      .map(d => getNestedValue(d, 'actual_thickness'))
      .filter(v => v !== undefined && !isNaN(v));
    const throughputData = historicalData
      .map(d => getNestedValue(d, 'total_output'))
      .filter(v => v !== undefined && !isNaN(v) && v > 0 && v <= 1000);

    const thicknessCapability = calculateProcessCapability(thicknessData, specLimits['actual_thickness']);
    const throughputCapability = calculateProcessCapability(throughputData, specLimits['total_output']);

    const cpkToScore = cpk => Math.min(Math.max((cpk - 0.67) / (1.33 - 0.67) * 50, 0), 50);
    const capabilityScore = (cpkToScore(thicknessCapability.Cpk) + cpkToScore(throughputCapability.Cpk)) / 2;

    const qualityScore = Math.round(deviationScore + capabilityScore);

    return {
      qualityScore,
      deviationScore,
      capabilityScore,
      details,
      processCapability: {
        thickness: thicknessCapability,
        throughput: throughputCapability
      }
    };
  } catch (error) {
    console.error(`Error in quality score calculation: ${error.message}`);
    return {
      qualityScore: 0,
      deviationScore: 0,
      capabilityScore: 0,
      details,
      processCapability: { thickness: { Cp: 0, Cpk: 0 }, throughput: { Cp: 0, Cpk: 0 } }
    };
  }
}

/**
 * Process a batch of sensor data for quality scoring
 * @param {Array} sensorDataBatch - Array of sensor data objects
 * @param {Array} allProcessedData - Previously processed data in this import
 * @returns {Array} - Array of data with quality scores
 */
async function processQualityBatch(sensorDataBatch, allProcessedData = []) {
  if (!Array.isArray(sensorDataBatch)) {
    console.error('Error: sensorDataBatch is not an array:', sensorDataBatch);
    return [];
  }

  const results = [];
  for (const data of sensorDataBatch) {
    try {
      const totalOutput = getNestedValue(data, 'total_output');
      if (totalOutput === undefined || isNaN(totalOutput) || totalOutput <= 0 || totalOutput > 1000) {
        results.push({
          ...data,
          quality_score: 0,
          quality_details: {},
          process_capability: { thickness: { Cp: 0, Cpk: 0 }, throughput: { Cp: 0, Cpk: 0 } }
        });
        continue;
      }
      const qualityResult = await calculateQualityScore(data, {}, allProcessedData);
      results.push({
        ...data,
        quality_score: qualityResult.qualityScore,
        quality_details: qualityResult.details,
        process_capability: qualityResult.processCapability
      });
    } catch (error) {
      console.error(`Error processing quality score: ${error.message}`);
      results.push({
        ...data,
        quality_score: 0,
        quality_details: {},
        process_capability: { thickness: { Cp: 0, Cpk: 0 }, throughput: { Cp: 0, Cpk: 0 } }
      });
    }
  }
  return results;
}

module.exports = {
  calculateQualityScore,
  processQualityBatch,
  calculateDeviationScore,
  calculateProcessCapability
};