import { useState,useEffect} from 'react';
import axios from 'axios';
import { LineChart } from '../components/LineChart';
import { BarChart } from '../components/barChart';

export function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [anomalyBreakdown, setAnomalyBreakdown] = useState([]);
  const [timeframe, setTimeframe] = useState('24h');

  useEffect(() => {
    axios.get(`/api/sensor-data/analytics?timeframe=${timeframe}`)
      .then(response => {
        if (response.data.success) setAnalyticsData(response.data);
      })
      .catch(error => console.error('Error fetching analytics:', error));

    axios.get('/api/sensor-data/anomalies/breakdown')
      .then(response => {
        if (response.data.success) setAnomalyBreakdown(response.data.breakdown);
      })
      .catch(error => console.error('Error fetching anomaly breakdown:', error));
  }, [timeframe]);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Analytics</h2>
      <div className="mb-6">
        <label className="mr-2">Timeframe:</label>
        <select
          value={timeframe}
          onChange={e => setTimeframe(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LineChart
            data={analyticsData.data || []}
            title="Extruder A Temperature"
            dataKey="extruder_A_temperature"
            label="Temperature (°C)"
          />
          <LineChart
            data={analyticsData.data || []}
            title="Extruder A Pressure"
            dataKey="extruder_A_pressure"
            label="Pressure (bar)"
          />
          <BarChart
            data={anomalyBreakdown}
            title="Anomaly Breakdown by Parameter"
          />
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold">Summary</h3>
            <p>Avg Quality Score: {analyticsData.analytics.avgQualityScore || 'N/A'}</p>
            <p>Anomaly Count: {analyticsData.analytics.anomalyCount || 0}</p>
            <p>High Risk Count: {analyticsData.analytics.highRiskCount || 0}</p>
            <p>Critical Risk Count: {analyticsData.analytics.criticalRiskCount || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}

