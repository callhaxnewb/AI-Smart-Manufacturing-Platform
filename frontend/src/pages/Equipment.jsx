import { useState,  useEffect} from 'react';
import axios from 'axios';
import { EquipmentTable } from '../components/EquipmentTable';
import { MaintenanceHistory } from '../components/MaintenanceHistory';

export function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState(null);

  useEffect(() => {
    axios.get('/api/equipment')
      .then(response => {
        if (response.data.success) setEquipment(response.data.data);
      })
      .catch(error => console.error('Error fetching equipment:', error));
  }, []);

  const handleViewDetails = async (id) => {
    try {
      const response = await axios.get(`/api/equipment/${id}`);
      if (response.data.success) setSelectedEquipment(response.data.data);
    } catch (error) {
      console.error('Error fetching equipment details:', error);
    }
  };

  const handleViewMaintenance = async (id) => {
    try {
      const response = await axios.get(`/api/equipment/${id}/maintenance`);
      if (response.data.success) setMaintenanceHistory(response.data);
    } catch (error) {
      console.error('Error fetching maintenance history:', error);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Equipment List</h2>
      <EquipmentTable equipment={equipment} onViewDetails={handleViewDetails} onViewMaintenance={handleViewMaintenance} />
      {selectedEquipment && (
        <div className="bg-white p-4 rounded-lg shadow mt-6">
          <h3 className="text-xl font-semibold">Details for {selectedEquipment.name}</h3>
          <p>Type: {selectedEquipment.type}</p>
          <p>Location: {selectedEquipment.location}</p>
          <p>Serial Number: {selectedEquipment.serialNumber || 'N/A'}</p>
          <p>Status: {selectedEquipment.status}</p>
          <p>Health Score: {selectedEquipment.healthScore}</p>
          {selectedEquipment.specifications && (
            <div>
              <p>Manufacturer: {selectedEquipment.specifications.manufacturer || 'N/A'}</p>
              <p>Model: {selectedEquipment.specifications.model || 'N/A'}</p>
              <p>Power Rating: {selectedEquipment.specifications.powerRating || 'N/A'} kW</p>
            </div>
          )}
        </div>
      )}
      <MaintenanceHistory history={maintenanceHistory} />
    </div>
  );
}