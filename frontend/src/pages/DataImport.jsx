import { useState} from 'react';
import axios from 'axios';

export function DataImport() {
  const [message, setMessage] = useState('');

  const handleImport = async () => {
    try {
      const response = await axios.post('/api/sensor-data/import');
      if (response.data.success) {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage('Error importing data');
      console.error('Error importing data:', error);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Data Import</h2>
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="mb-4">Click below to simulate importing sensor data.</p>
        <button
          onClick={handleImport}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Import Data
        </button>
        {message && <p className="mt-4">{message}</p>}
      </div>
    </div>
  );
}