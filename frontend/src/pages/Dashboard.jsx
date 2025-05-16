import { useState, useEffect } from 'react';
import axios from 'axios';
import MetricCard from '../components/MetricCard.jsx';
import LineChart from '../components/LineChart.jsx';

function Dashboard() {
  const [sensorData, setSensorData] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('extruder_A_pressure');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch latest sensor data (up to 10 records)
        const sensorResponse = await axios.get('http://localhost:5000/api/sensor-data', {
          params: { limit: 10 },
        });
        // Fetch analytics data
        const analyticsResponse = await axios.get('http://localhost:5000/api/sensor-data/analytics', {
          params: { timeframe: '24h' },
        });

        setSensorData(sensorResponse.data.data);
        setAnalytics(analyticsResponse.data.analytics);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (!sensorData.length || !analytics) {
    return <div className="container mx-auto p-4">No data available</div>;
  }

  // Prepare chart data based on selected metric
  const chartLabels = sensorData.map(data => new Date(data.timestamp).toLocaleTimeString()).slice().reverse();
  const chartData = sensorData.map(data => data[selectedMetric]).slice().reverse();

  // Human-readable titles for metrics
  const metricTitles = {
    extruder_A_pressure: 'Extruder A Pressure (bar)',
    extruder_B_pressure: 'Extruder B Pressure (bar)',
    extruder_C_pressure: 'Extruder C Pressure (bar)',
    extruder_A_temperature: 'Extruder A Temperature (°C)',
    extruder_B_temperature: 'Extruder B Temperature (°C)',
    extruder_C_temperature: 'Extruder C Temperature (°C)',
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Manufacturing Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
        {/* Extruder A Metrics */}
        <MetricCard
          title="Extruder A Pressure"
          value={sensorData[0].extruder_A_pressure}
          unit="bar"
          status="operational"
        />
        <MetricCard
          title="Extruder A Temperature"
          value={sensorData[0].extruder_A_temperature}
          unit="°C"
          status="operational"
        />
        {/* Extruder B Metrics */}
        <MetricCard
          title="Extruder B Pressure"
          value={sensorData[0].extruder_B_pressure}
          unit="bar"
          status="operational"
        />
        <MetricCard
          title="Extruder B Temperature"
          value={sensorData[0].extruder_B_temperature}
          unit="°C"
          status="operational"
        />
        {/* Extruder C Metrics */}
        <MetricCard
          title="Extruder C Pressure"
          value={sensorData[0].extruder_C_pressure}
          unit="bar"
          status="operational"
        />
        <MetricCard
          title="Extruder C Temperature"
          value={sensorData[0].extruder_C_temperature}
          unit="°C"
          status="operational"
        />
        {/* Other Metrics */}
        <MetricCard
          title="Efficiency"
          value={sensorData[0].efficiency}
          unit="%"
          status={sensorData[0].maintenance_prediction.risk_level}
        />
        <MetricCard
          title="Average Output"
          value={analytics.avgTotalOutput?.toFixed(2) || 0}
          unit="units"
        />
        <MetricCard
          title="Anomaly Count"
          value={analytics.anomalyCount || 0}
          unit="events"
        />
        <MetricCard
          title="Critical Risk Count"
          value={analytics.criticalRiskCount || 0}
          unit="events"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="metric-select" className="mr-2 text-gray-700">Select Metric:</label>
        <select
          id="metric-select"
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="extruder_A_pressure">Extruder A Pressure</option>
          <option value="extruder_B_pressure">Extruder B Pressure</option>
          <option value="extruder_C_pressure">Extruder C Pressure</option>
          <option value="extruder_A_temperature">Extruder A Temperature</option>
          <option value="extruder_B_temperature">Extruder B Temperature</option>
          <option value="extruder_C_temperature">Extruder C Temperature</option>
        </select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[400px]">
        <LineChart
          title={metricTitles[selectedMetric]}
          labels={chartLabels}
          data={chartData}
        />
      </div>
    </div>
  );
}

export default Dashboard;