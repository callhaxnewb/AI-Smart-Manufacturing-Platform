const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const SensorData = require('../models/SensorData');
const { 
  anomalyDetection, 
  maintenancePrediction, 
  qualityScoring 
} = require('../ml');  // This points to your ml/index.js
const Equipment = require('../models/equipment');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();


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

// Create or get default equipment for maintenance prediction
async function getDefaultEquipment() {
  try {
    let equipment = await Equipment.findOne({ name: "Default Main Extruder" });
    
    if (!equipment) {
      equipment = new Equipment({
        name: "Default Main Extruder",
        type: "extruder",
        location: "Production Line 1",
        serialNumber: "DEFAULT-001",
        installationDate: new Date('2020-01-01'),
        lastMaintenanceDate: new Date('2024-01-01'),
        specifications: {
          manufacturer: "ManufacturingCorp",
          model: "EXT-1000",
          powerRating: 100,
          maxOperatingTemp: 300,
          maxPressure: 150,
        },
        sensors: [
          {
            name: "Pressure Sensor",
            type: "pressure",
            unit: "bar",
            normalRange: { min: 50, max: 150 }
          },
          {
            name: "Temperature Sensor", 
            type: "temperature",
            unit: "Celsius",
            normalRange: { min: 100, max: 250 }
          }
        ]
      });
      await equipment.save();
    }
    
    return equipment;
  } catch (error) {
    console.error('Error getting default equipment:', error);
    // Return a mock equipment object if database fails
    return {
      _id: 'default-equipment-id',
      name: "Default Main Extruder",
      type: "extruder",
      installationDate: new Date('2020-01-01'),
      lastMaintenanceDate: new Date('2024-01-01'),
      sensors: [
        {
          name: "Pressure Sensor",
          type: "pressure", 
          unit: "bar",
          normalRange: { min: 50, max: 150 }
        }
      ]
    };
  }
}

/**
 * Import CSV data into MongoDB
 * @param {string} filePath - Path to the CSV file
 * @param {function} callback - Callback function to execute after import completes
 */

const importCsvToMongo = async (filePath, callback) => {
  const results = [];
  const executionId = Math.random().toString(36).substring(2, 8);
  console.log(`Starting CSV import from ${filePath} (execution ${executionId})`);
  const stream = fs.createReadStream(filePath);
  let isEndTriggered = false;
  let allProcessedData = []; // Store all processed records

  stream
    .pipe(csv({
      separator: ',',
      skipEmptyLines: true,
      strict: false,
      trim: true
    }))
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      if (isEndTriggered) {
        console.warn(`Warning: CSV stream "end" event triggered multiple times (execution ${executionId})`);
        return;
      }
      isEndTriggered = true;

      console.log(`CSV file read complete. Found ${results.length} records (execution ${executionId}).`);
      const batchSize = 20;
      let processed = 0;
      let failedRecords = 0;

      for (let i = 0; i < results.length; i += batchSize) {
        const batchNumber = Math.floor(i / batchSize) + 1;
        console.log(`Processing batch ${batchNumber}/${Math.ceil(results.length / batchSize)} (execution ${executionId}, index ${i})`);

        const batch = results.slice(i, i + batchSize);
        console.log(`Batch ${batchNumber} contains ${batch.length} records (execution ${executionId})`);
        let docs = batch.map(mapCsvToSchema).filter(doc => {
          if (!doc.timestamp || isNaN(doc.timestamp.getTime())) {
            console.warn(`Invalid timestamp in batch ${batchNumber} (execution ${executionId})`);
            failedRecords++;
            return false;
          }
          return true;
        });

        if (docs.length === 0) {
          console.log(`No valid documents in batch ${batchNumber} (execution ${executionId}), skipping...`);
          continue;
        }

        // Anomaly Detection
        console.log(`  - Running anomaly detection for batch ${batchNumber} (execution ${executionId})...`);
        try {
          docs = await anomalyDetection.processBatch(docs, allProcessedData);
          console.log(`  - Anomaly detection completed for batch ${batchNumber}. Found ${docs.filter(d => d.is_anomaly).length} anomalies (execution ${executionId}).`);
          allProcessedData.push(...docs); // Add processed docs to historical data
          allProcessedData = allProcessedData.slice(-200); // Limit to 200 records
        } catch (error) {
          console.error(`Error in anomaly detection for batch ${batchNumber} (execution ${executionId}):`, error);
          docs = docs.map(doc => ({
            ...doc,
            anomaly_score: 0,
            is_anomaly: false,
            anomaly_parameters: [],
            anomaly_method: 'none'
          }));
        }

        // Quality Scoring
        console.log(`  - Running quality assessment for batch ${batchNumber} (execution ${executionId})...`);
        try {
          docs = await qualityScoring.processQualityBatch(docs);
          console.log(`  - Quality scoring completed for batch ${batchNumber}. Average quality: ${(docs.reduce((sum, d) => sum + d.quality_score, 0) / docs.length).toFixed(2)} (execution ${executionId})`);
        } catch (error) {
          console.error(`Error in quality scoring for batch ${batchNumber} (execution ${executionId}):`, error);
          docs = docs.map(doc => ({
            ...doc,
            quality_score: 0,
            quality_details: {},
            process_capability: {
              thickness: { Cp: 0, Cpk: 0 },
              throughput: { Cp: 0, Cpk: 0 }
            }
          }));
        }

        // Maintenance Prediction
        console.log(`  - Running maintenance prediction for batch ${batchNumber} (execution ${executionId})...`);
        try {
          const defaultEquipment = await getDefaultEquipment();
          const sensorDataMap = {};
          docs.forEach(doc => {
            sensorDataMap[defaultEquipment._id] = {
              extruder_A_pressure: doc.extruder_A_pressure,
              extruder_A_temperature: doc.extruder_A_temperature,
              total_output: doc.total_output
            };
          });

          const maintenanceResults = maintenancePrediction.processBatch([defaultEquipment], sensorDataMap);
          const maintenanceResult = maintenanceResults[0];

          docs = docs.map(doc => ({
            ...doc,
            maintenance_prediction: maintenanceResult?.maintenance_prediction || {
              days_to_maintenance: 30,
              risk_level: 'low',
              next_maintenance_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              confidence: 0.7
            },
            healthScore: maintenanceResult?.healthScore || 8
          }));

          console.log(`  - Maintenance prediction completed for batch ${batchNumber} (execution ${executionId}).`);
        } catch (error) {
          console.error(`Error in maintenance prediction for batch ${batchNumber} (execution ${executionId}):`, error);
          docs = docs.map(doc => ({
            ...doc,
            maintenance_prediction: {
              days_to_maintenance: 30,
              risk_level: 'low',
              next_maintenance_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              confidence: 0.7
            },
            healthScore: 8
          }));
        }

        // Insert documents
        if (docs.length > 0) {
          try {
            await SensorData.insertMany(docs, { ordered: false });
            processed += docs.length;
            console.log(`  - Inserted ${docs.length} documents for batch ${batchNumber} (execution ${executionId}).`);
            allProcessedData.push(...docs); // Moved after insertion
            allProcessedData = allProcessedData.slice(-200);
          } catch (insertError) {
            console.error(`Error inserting documents for batch ${batchNumber} (execution ${executionId}):`, insertError);
            failedRecords += docs.length;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`CSV import completed successfully (execution ${executionId})`);
      console.log(`Total records: ${results.length}, Failed: ${failedRecords}, Imported: ${results.length - failedRecords} (execution ${executionId})`);
      callback(null, {
        success: true,
        count: results.length - failedRecords,
        failed: failedRecords
      });
    })
    .on('error', (error) => {
      console.error(`Error reading CSV file (execution ${executionId}):`, error);
      callback(error);
    });
};

/**
 * Command-line script to import CSV data
 * Usage: node importCsv.js <path-to-csv-file>
 */
const runImport = async () => {
  const executionId = Math.random().toString(36).substring(2, 8); // Unique ID for this execution
  console.log(`Starting import with execution ID: ${executionId}`);
  if (require.main === module) {
    const filePath = process.argv[2];
    if (!filePath) {
      console.error(`Please provide a CSV file path (execution ${executionId}): node importCsv.js <path-to-csv-file>`);
      process.exit(1);
    }

    try {
      if (mongoose.connection.readyState === 0) { // Only connect if not already connected
        await mongoose.connect("mongodb://localhost:27017/smart-manufacturing", {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        console.log(`MongoDB Connected (execution ${executionId})`);
      }

      importCsvToMongo(filePath, (err, result) => {
        if (err) {
          console.error(`Import failed (execution ${executionId}):`, err);
          process.exit(1);
        }
        console.log(`Import completed (execution ${executionId}): ${result.count} records imported (${result.failed} records failed)`);
        process.exit(0);
      });
    } catch (err) {
      console.error(`MongoDB connection error (execution ${executionId}):`, err);
      process.exit(1);
    }
  }
};

runImport();

module.exports = {
  importCsvToMongo,
  mapCsvToSchema
};