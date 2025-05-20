import { useState, useEffect } from "react";
import axios from "axios";
import { ExtruderCard } from "../components/ExtruderCard";
import { StatusSummary } from "../components/StatusSummary";

export function Dashboard() {
  const [statusSummary, setStatusSummary] = useState([]);
  const [currentData, setCurrentData] = useState(null);

  useEffect(() => {
    axios.get('/api/equipment/status')
      .then(response => {
        if (response.data.success) setStatusSummary(response.data.data);
        console.log(response.data.data);

      })
      .catch(error => console.error('Error fetching status:', error));

    axios.get('/api/sensor-data?limit=1')
      .then(response => {
        if (response.data.success && response.data.data.length > 0) {
          setCurrentData(response.data.data[0]);
        console.log(response.data.data);

        }
      })
      .catch(error => console.error('Error fetching sensor data:', error));
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ExtruderCard title="Extruder A" temperature={currentData?.extruder_A_temperature} pressure={currentData?.extruder_A_pressure} />
        <ExtruderCard title="Extruder B" temperature={currentData?.extruder_B_temperature} pressure={currentData?.extruder_B_pressure} />
        <ExtruderCard title="Extruder C" temperature={currentData?.extruder_C_temperature} pressure={currentData?.extruder_C_pressure} />
      </div>
      <StatusSummary statusSummary={statusSummary} />
    </div>
  );
}