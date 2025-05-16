const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const SensorData = require('../models/SensorData');


function parseCustomDate(dateStr) {
    // Handle the date format like "25.06.2018 4:42"
    if (!dateStr) return null;
    
    try {
        const [datePart, timePart] = dateStr.split(' ');
        if (!datePart || !timePart) return null;
        
        const [day, month, year] = datePart.split('.');
        if (!day || !month || !year) return null;
        
        // Format time properly - ensure it has leading zeros if needed
        let formattedTime = timePart;
        if (timePart.split(':').length === 2) {
            const [hours, minutes] = timePart.split(':');
            if (hours.length === 1) {
                formattedTime = `0${hours}:${minutes}`;
            }
        }
        
        // Create date string in format YYYY-MM-DDThh:mm:ss
        const isoDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${formattedTime}:00`;
        const date = new Date(isoDateStr);
        
        // Validate the date is valid
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date created from: ${dateStr}, resulted in: ${date}`);
            return null;
        }
        
        return date;
    } catch (error) {
        console.error(`Error parsing date ${dateStr}:`, error);
        return null;
    }
}


// Function to map CSV column names to MongoDB schema fields
const mapCsvToSchema = (row) => {
  // Map the CSV columns to our schema fields
  try {
    const parsedDate = parseCustomDate(row.Datum);
    if (!parsedDate) {
      console.warn(`Failed to parse date from: ${row.Datum}`);
    }
    
    return {
      timestamp: parsedDate,
      
      // Extruder Performance Metrics
      extruder_A_pressure: parseFloat(row.ST110_VARExtr_1_druck_1_IstP) || 0,
      extruder_B_pressure: parseFloat(row.ST110_VARExtr_2_druck_1_IstP) || 0,
      extruder_C_pressure: parseFloat(row.ST110_VARExtr_3_druck_1_IstP) || 0,
      extruder_A_temperature: parseFloat(row.ST110_VARExtr_1_Massetemperatur) || 0,
      extruder_B_temperature: parseFloat(row.ST110_VARExtr_2_Massetemperatur) || 0,
      extruder_C_temperature: parseFloat(row.ST110_VARExtr_3_Massetemperatur) || 0,
      
      // Heating Zone Data
      heating_zones: {
        extruder_A: {
          zone_1: {
            setpoint: parseFloat(row.ST110_VARExtr_1_HeizungZone_1_Regler_X) || 0,
            actual: parseFloat(row.ST110_VARExtr_1_HeizungZone_1_Regler_Y) || 0,
            power: parseFloat(row.ST110_VARExtr_1_HeizungZone_1_ActEffectPower) || 0
          },
          zone_3: {
            setpoint: parseFloat(row.ST110_VARExtr_1_HeizungZone_3_Regler_X) || 0,
            actual: parseFloat(row.ST110_VARExtr_1_HeizungZone_3_Regler_Y) || 0,
            power: parseFloat(row.ST110_VARExtr_1_HeizungZone_3_ActEffectPower) || 0
          },
          zone_5: {
            setpoint: parseFloat(row.ST110_VARExtr_1_HeizungZone_5_Regler_X) || 0,
            actual: parseFloat(row.ST110_VARExtr_1_HeizungZone_5_Regler_Y) || 0,
            power: parseFloat(row.ST110_VARExtr_1_HeizungZone_5_ActEffectPower) || 0
          },
          zone_7: {
            setpoint: parseFloat(row.ST110_VARExtr_1_HeizungZone_7_Regler_X) || 0,
            actual: parseFloat(row.ST110_VARExtr_1_HeizungZone_7_Regler_Y) || 0,
            power: parseFloat(row.ST110_VARExtr_1_HeizungZone_7_ActEffectPower) || 0
          }
        },
        extruder_B: {
          zone_1: {
            setpoint: parseFloat(row.ST110_VARExtr_2_HeizungZone_1_Regler_X) || 0,
            actual: parseFloat(row.ST110_VARExtr_2_HeizungZone_1_Regler_Y) || 0,
            power: parseFloat(row.ST110_VARExtr_2_HeizungZone_1_ActEffectPower) || 0
          },
          zone_3: {
            setpoint: parseFloat(row.ST110_VARExtr_2_HeizungZone_3_Regler_X) || 0,
            actual: parseFloat(row.ST110_VARExtr_2_HeizungZone_3_Regler_Y) || 0,
            power: parseFloat(row.ST110_VARExtr_2_HeizungZone_3_ActEffectPower) || 0
          },
          zone_5: {
            setpoint: parseFloat(row.ST110_VARExtr_2_HeizungZone_5_Regler_X) || 0,
            actual: parseFloat(row.ST110_VARExtr_2_HeizungZone_5_Regler_Y) || 0,
            power: parseFloat(row.ST110_VARExtr_2_HeizungZone_5_ActEffectPower) || 0
          },
          zone_7: {
            setpoint: parseFloat(row.ST110_VARExtr_2_HeizungZone_7_Regler_X) || 0,
            actual: parseFloat(row.ST110_VARExtr_2_HeizungZone_7_Regler_Y) || 0,
            power: parseFloat(row.ST110_VARExtr_2_HeizungZone_7_ActEffectPower) || 0
          }
        },
        extruder_C: {
          zone_1: {
            setpoint: parseFloat(row.ST110_VARExtr_3_HeizungZone_1_Regler_X) || 0,
            actual: parseFloat(row.ST110_VARExtr_3_HeizungZone_1_Regler_Y) || 0,
            power: parseFloat(row.ST110_VARExtr_3_HeizungZone_1_ActEffectPower) || 0
          },
          zone_3: {
            setpoint: parseFloat(row.ST110_VARExtr_3_HeizungZone_3_Regler_X) || 0,
            actual: parseFloat(row.ST110_VARExtr_3_HeizungZone_3_Regler_Y) || 0,
            power: parseFloat(row.ST110_VARExtr_3_HeizungZone_3_ActEffectPower) || 0
          },
          zone_5: {
            setpoint: parseFloat(row.ST110_VARExtr_3_HeizungZone_5_Regler_X) || 0,
            actual: parseFloat(row.ST110_VARExtr_3_HeizungZone_5_Regler_Y) || 0,
            power: parseFloat(row.ST110_VARExtr_3_HeizungZone_5_ActEffectPower) || 0
          },
          zone_7: {
            setpoint: parseFloat(row.ST110_VARExtr_3_HeizungZone_7_Regler_X) || 0,
            actual: parseFloat(row.ST110_VARExtr_3_HeizungZone_7_Regler_Y) || 0,
            power: parseFloat(row.ST110_VARExtr_3_HeizungZone_7_ActEffectPower) || 0
          }
        }
      },
      materials: {
          extruder_A: [
              {
              component: 2,
              actual_ratio: parseFloat(row.ST110_VAREx_1_Dos_2_IstAnteil) || 0,
              target_ratio: parseFloat(row.ST110_VAREx_1_Dos_2_SollAnteil) || 0,
              density: parseFloat(row.ST110_VAREx_1_Dos_2_SollDichte) || 0
              },
              {
              component: 3,
              actual_ratio: parseFloat(row.ST110_VAREx_1_Dos_3_IstAnteil) || 0,
              target_ratio: parseFloat(row.ST110_VAREx_1_Dos_3_SollAnteil) || 0,
              density: parseFloat(row.ST110_VAREx_1_Dos_3_SollDichte) || 0
              },
              {
                  component: 4,
                  actual_ratio: parseFloat(row.ST110_VAREx_1_Dos_4_IstAnteil) || 0,
                  target_ratio: parseFloat(row.ST110_VAREx_1_Dos_4_SollAnteil) || 0,
                  density: parseFloat(row.ST110_VAREx_1_Dos_4_SollDichte) || 0
              },
              {
                  component: 5,
                  actual_ratio: parseFloat(row.ST110_VAREx_1_Dos_5_IstAnteil) || 0,
                  target_ratio: parseFloat(row.ST110_VAREx_1_Dos_5_SollAnteil) || 0,
                  density: parseFloat(row.ST110_VAREx_1_Dos_5_SollDichte) || 0
              }
          ],
          extruder_B: [
              {
              component: 2,
              actual_ratio: parseFloat(row.ST110_VAREx_2_Dos_2_IstAnteil) || 0,
              target_ratio: parseFloat(row.ST110_VAREx_2_Dos_2_SollAnteil) || 0,
              density: parseFloat(row.ST110_VAREx_2_Dos_2_SollDichte) || 0
              },
              {
                  component: 3,
                  actual_ratio: parseFloat(row.ST110_VAREx_2_Dos_3_IstAnteil) || 0,
                  target_ratio: parseFloat(row.ST110_VAREx_2_Dos_3_SollAnteil) || 0,
                  density: parseFloat(row.ST110_VAREx_2_Dos_3_SollDichte) || 0
              },
              {
                  component: 4,
                  actual_ratio: parseFloat(row.ST110_VAREx_2_Dos_4_IstAnteil) || 0,
                  target_ratio: parseFloat(row.ST110_VAREx_2_Dos_4_SollAnteil) || 0,
                  density: parseFloat(row.ST110_VAREx_2_Dos_4_SollDichte) || 0
              },
              {
                  component: 5,
                  actual_ratio: parseFloat(row.ST110_VAREx_2_Dos_5_IstAnteil) || 0,
                  target_ratio: parseFloat(row.ST110_VAREx_2_Dos_5_SollAnteil) || 0,
                  density: parseFloat(row.ST110_VAREx_2_Dos_5_SollDichte) || 0
              }
          ],
          extruder_C: [
              {
              component: 2,
              actual_ratio: parseFloat(row.ST110_VAREx_3_Dos_2_IstAnteil) || 0,
              target_ratio: parseFloat(row.ST110_VAREx_3_Dos_2_SollAnteil) || 0,
              density: parseFloat(row.ST110_VAREx_3_Dos_2_SollDichte) || 0
              },
              // repeat for component 3 to 5
              {
                  component: 3,
                  actual_ratio: parseFloat(row.ST110_VAREx_3_Dos_3_IstAnteil) || 0,
                  target_ratio: parseFloat(row.ST110_VAREx_3_Dos_3_SollAnteil) || 0,
                  density: parseFloat(row.ST110_VAREx_3_Dos_3_SollDichte) || 0
              },
              {
                  component: 4,
                  actual_ratio: parseFloat(row.ST110_VAREx_3_Dos_4_IstAnteil) || 0,
                  target_ratio: parseFloat(row.ST110_VAREx_3_Dos_4_SollAnteil) || 0,
                  density: parseFloat(row.ST110_VAREx_3_Dos_4_SollDichte) || 0
              },
              {
                  component: 5,
                  actual_ratio: parseFloat(row.ST110_VAREx_3_Dos_5_IstAnteil) || 0,
                  target_ratio: parseFloat(row.ST110_VAREx_3_Dos_5_SollAnteil) || 0,
                  density: parseFloat(row.ST110_VAREx_3_Dos_5_SollDichte) || 0
              }
          ]
      },
      
      // Production Output Metrics
      total_output: parseFloat(row.ST110_VAREx_0_GesamtDS) || 0,
      target_output: parseFloat(row.ST110_VAREx_0_SollDS) || 0,
      actual_thickness: parseFloat(row.ST110_VAREx_0_SDickeIst) || 0,
      target_thickness: parseFloat(row.ST110_VAREx_0_SDickeSoll) || 0,
      
      // Equipment Utilization
      blower_load_1: parseFloat(row.ST110_VARGeblaese_1_Auslastung) || 0,
      blower_load_2: parseFloat(row.ST110_VARGeblaese_2_Auslastung) || 0,
      blower_exhaust_actual: parseFloat(row.ST110_VARIBC_1_Ist_n_Calc) || 0,
      blower_exhaust_setpoint: parseFloat(row.ST110_VARIBC_1_Soll_n_Visu) || 0,
      
      // Winder Data
      winder_1_length: parseFloat(row.ST113_VARActLen) || 0,
      winder_2_length: parseFloat(row.ST114_VARActLen) || 0,
      winder_1_remaining_time: parseFloat(row.ST113_VARRemainingTimeVis) || 0,
      winder_2_remaining_time: parseFloat(row.ST114_VARRemainingTimeVis) || 0,
      
      // Calculate derived fields
      efficiency: calculateEfficiency(row),
      
      // Mock fields for demo purposes
      quality_score: mockQualityScore(row),
      anomaly_score: mockAnomalyScore(row),
      maintenance_prediction: mockMaintenancePrediction(row)
    };
  } catch (error) {
    console.error('Error mapping CSV row to schema:', error);
    // Return a minimal valid object with just a timestamp
    return {
      timestamp: new Date(),
      efficiency: 0,
      quality_score: 0,
      anomaly_score: 0,
      maintenance_prediction: { risk_level: 'low', days_to_maintenance: 30 }
    };
  }
};

// Calculate efficiency from output metrics
function calculateEfficiency(row) {
  const totalOutput = parseFloat(row.ST110_VAREx_0_GesamtDS) || 0;
  const targetOutput = parseFloat(row.ST110_VAREx_0_SollDS) || 1; // Avoid division by zero
  
  let efficiency = (totalOutput / targetOutput) * 100;
  if (efficiency > 100) efficiency = 100; // Cap at 100%
  
  return parseFloat(efficiency.toFixed(2));
}

// Mock quality score for demo purposes
function mockQualityScore(row) {
  // This would be replaced with actual quality calculations
  const thicknessDiff = Math.abs(
    parseFloat(row.ST110_VAREx_0_SDickeIst || 0) - 
    parseFloat(row.ST110_VAREx_0_SDickeSoll || 0)
  );
  
  // Higher when thickness is close to target
  let qualityScore = 100 - (thicknessDiff * 10);
  if (qualityScore < 0) qualityScore = 0;
  if (qualityScore > 100) qualityScore = 100;
  
  return parseFloat(qualityScore.toFixed(2));
}

// Mock anomaly score for demo purposes
function mockAnomalyScore(row) {
  // This would be replaced with actual ML-based anomaly detection
  // For now, we'll use a simple rule: flag if pressure is too high
  const pressure = parseFloat(row.ST110_VARExtr_1_druck_1_IstP || 0);
  
  // Random fluctuations with occasional spikes
  let anomalyScore = Math.random() * 0.3; // Base noise
  
  if (pressure > 85) {
    anomalyScore += 0.5; // High pressure indicates potential issue
  }
  
  return parseFloat(anomalyScore.toFixed(2));
}

// Mock maintenance prediction for demo purposes
function mockMaintenancePrediction(row) {
  // This would be replaced with actual ML-based prediction
  // For now, we'll use a simple heuristic based on temperature and pressure
  const temperature = parseFloat(row.ST110_VARExtr_1_Massetemperatur || 0);
  const pressure = parseFloat(row.ST110_VARExtr_1_druck_1_IstP || 0);
  
  let riskLevel = 'low';
  let daysToMaintenance = 30;
  
  if (temperature > 200 && pressure > 80) {
    riskLevel = 'critical';
    daysToMaintenance = Math.floor(Math.random() * 3) + 1;
  } else if (temperature > 180 && pressure > 70) {
    riskLevel = 'high';
    daysToMaintenance = Math.floor(Math.random() * 7) + 3;
  } else if (temperature > 160 && pressure > 60) {
    riskLevel = 'medium';
    daysToMaintenance = Math.floor(Math.random() * 10) + 10;
  }
  
  return {
    risk_level: riskLevel,
    days_to_maintenance: daysToMaintenance
  };
}

/**
 * Import CSV data into MongoDB
 * @param {string} filePath - Path to the CSV file
 * @param {function} callback - Callback function to execute after import completes
 */
const importCsvToMongo = (filePath, callback) => {
  const results = [];
  console.log(`Starting CSV import from ${filePath}`);
  
  fs.createReadStream(filePath)
    .pipe(csv({
      // Add options to make parsing more robust
      separator: ',',
      skipEmptyLines: true,
      strict: false,
      trim: true
    }))
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        console.log(`CSV file read complete. Found ${results.length} records.`);
        
        // Process in batches to avoid memory issues with large files
        const batchSize = 100;
        let processed = 0;
        let failedRecords = 0;
        
        for (let i = 0; i < results.length; i += batchSize) {
          const batch = results.slice(i, i + batchSize);
          const documents = batch.map(mapCsvToSchema).filter(doc => {
            // Skip documents without a valid timestamp
            if (!doc.timestamp || isNaN(doc.timestamp.getTime())) {
              failedRecords++;
              return false;
            }
            return true;
          });
          
          // Only insert if we have valid documents
          if (documents.length > 0) {
            await SensorData.insertMany(documents, { ordered: false });
          }
          
          processed += batch.length;
          console.log(`Imported ${processed}/${results.length} records (${failedRecords} failed)`);
        }
        
        console.log('CSV import completed successfully');
        console.log(`Total records: ${results.length}, Failed: ${failedRecords}, Imported: ${results.length - failedRecords}`);
        callback(null, { success: true, count: results.length - failedRecords, failed: failedRecords });
      } catch (error) {
        console.error('Error importing CSV data:', error);
        callback(error);
      }
    })
    .on('error', (error) => {
      console.error('Error reading CSV file:', error);
      callback(error);
    });
};

/**
 * Command-line script to import CSV data
 * Usage: node importCsv.js <path-to-csv-file>
 */
const runImport = () => {
  // Check if script is being run directly
  if (require.main === module) {
    const filePath = process.argv[2];
    
    if (!filePath) {
      console.error('Please provide a CSV file path: node importCsv.js <path-to-csv-file>');
      process.exit(1);
    }
    
    // Connect to MongoDB
    const mongoose = require('mongoose');
    const dotenv = require('dotenv');
    
    dotenv.config();
    
    mongoose.connect("mongodb://localhost:27017/smart-manufacturing", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => {
      console.log('MongoDB Connected');
      
      importCsvToMongo(filePath, (err, result) => {
        if (err) {
          console.error('Import failed:', err);
          process.exit(1);
        }
        
        console.log(`Import completed: ${result.count} records imported (${result.failed} records failed)`);
        process.exit(0);
      });
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
  }
};

// Run the import if this file is executed directly
runImport();

module.exports = {
  importCsvToMongo,
  mapCsvToSchema
};