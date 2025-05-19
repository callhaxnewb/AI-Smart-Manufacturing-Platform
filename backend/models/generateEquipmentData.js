const mongoose = require('mongoose');
const Equipment = require('./equipment.js'); 
require('dotenv').config();

// Connect to MongoDB using the provided MONGO_URI
mongoose.connect('mongodb://localhost:27017/smart-manufacturing', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB')).catch(err => console.error('MongoDB connection error:', err));

// Sample data arrays for randomization
const names = ['Main Extruder', 'Cooling Blower', 'Film Winder', 'Mold Heater', 'Pressure Sensor', 'Auxiliary Unit'];
const locations = ['Plant A', 'Plant B', 'Assembly Line 1', 'Production Floor', 'Warehouse'];
const manufacturers = ['TechMach', 'Industro', 'ManuCorp', 'EquipPro', 'DynaTech'];
const models = ['X-100', 'B-500', 'W-300', 'H-200', 'S-50', 'Z-900'];
const types = ['extruder', 'blower', 'winder', 'heater', 'sensor', 'other'];
const statuses = ['operational', 'maintenance', 'fault', 'offline'];
const maintenanceTypes = ['preventive', 'corrective', 'emergency', 'inspection'];

// Function to generate random date within a range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Function to generate a single equipment document
const generateEquipment = () => {
  // Ensure at least one of each critical type across generated records
  const criticalTypes = ['extruder', 'blower'];
  const typeIndex = equipments.length % criticalTypes.length;
  const type = equipments.length < criticalTypes.length ? criticalTypes[typeIndex] : types[Math.floor(Math.random() * types.length)];
  const sensorCount = Math.floor(Math.random() * 3) + 1;
  const sensorTypes = ['temperature', 'pressure', 'vibration', 'flow'];
  
  // Generate sensors array with proper structure matching the updated schema
  const sensors = [];
  for (let i = 0; i < sensorCount; i++) {
    const sensorType = sensorTypes[Math.floor(Math.random() * sensorTypes.length)];
    const sensorUnit = sensorType === 'temperature' ? 'Celsius' : 
                      sensorType === 'pressure' ? 'bar' : 
                      sensorType === 'vibration' ? 'mm/s' : 'L/min';
                      
    sensors.push({
      name: `Sensor-${i + 1}`,
      dataPointId: `DP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      type: sensorType,
      unit: sensorUnit,
      normalRange: {
        min: sensorType === 'pressure' ? Math.floor(Math.random() * 20) :
               sensorType === 'temperature' ? Math.floor(Math.random() * 50) + 50 :
               sensorType === 'flow' ? Math.floor(Math.random() * 50) + 100 :
               sensorType === 'vibration' ? Math.floor(Math.random() * 5) : 0,
        max: sensorType === 'pressure' ? Math.floor(Math.random() * 80) + 20 :
               sensorType === 'temperature' ? Math.floor(Math.random() * 100) + 100 :
               sensorType === 'flow' ? Math.floor(Math.random() * 100) + 200 :
               sensorType === 'vibration' ? Math.floor(Math.random() * 10) + 5 : 10,
      }
    });
  }
  
  return {
    name: names[Math.floor(Math.random() * names.length)] + `-${Math.floor(Math.random() * 100)}`,
    type: type,
    location: locations[Math.floor(Math.random() * locations.length)],
    serialNumber: `SN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    installationDate: randomDate(new Date(2018, 0, 1), new Date(2023, 0, 1)),
    lastMaintenanceDate: randomDate(new Date(2023, 0, 1), new Date(2025, 4, 1)),
    nextScheduledMaintenance: randomDate(new Date(2025, 4, 1), new Date(2026, 0, 1)),
    specifications: {
      manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
      model: models[Math.floor(Math.random() * models.length)],
      powerRating: Math.floor(Math.random() * 50) + 10, // 10-60 kW
      maxOperatingTemp: Math.floor(Math.random() * 200) + 50, // 50-250°C
      maxPressure: type === 'extruder' ? Math.floor(Math.random() * 100) + 50 : null, // 50-150 bar for extruders
      capacity: Math.floor(Math.random() * 1000) + 100, // 100-1100 units
    },
    status: statuses[Math.floor(Math.random() * statuses.length)],
    healthScore: Math.floor(Math.random() * 101), // 0-100
    maintenanceHistory: Array.from({ length: Math.floor(Math.random() * 5) }, () => ({
      date: randomDate(new Date(2020, 0, 1), new Date(2025, 4, 1)),
      type: maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)],
      description: `Maintenance performed: ${Math.random().toString(36).substring(2, 10)}`,
      technician: `Tech-${Math.floor(Math.random() * 100)}`,
      parts: ['Filter', 'Gasket', 'Bearing'].slice(0, Math.floor(Math.random() * 3)),
      cost: Math.floor(Math.random() * 5000) + 100, // $100-$5100
    })),
    sensors: sensors,
  };
};

// Function to insert sample data
const insertSampleData = async (count) => {
  try {
    // Generate equipment data
    const equipments = [];
    for (let i = 0; i < count; i++) {
      equipments.push(generateEquipment());
    }
    
    // Insert to database
    await Equipment.insertMany(equipments);
    console.log(`${count} equipment records inserted successfully`);
  } catch (error) {
    console.error('Error inserting equipment data:', error);
    // Print more details about the error if available
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`Field "${key}" error:`, error.errors[key].message);
      });
    }
  } finally {
    mongoose.connection.close();
  }
};

// Generate 10 sample equipment records
insertSampleData(10);