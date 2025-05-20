export function MaintenanceHistory({ history }) {
    if (!history) return null;
  
    return (
      <div className="bg-white p-4 rounded-lg shadow mt-6">
        <h3 className="text-xl font-semibold mb-4">Maintenance History for {history.equipment}</h3>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Technician</th>
              <th className="p-3 text-left">Cost</th>
            </tr>
          </thead>
          <tbody>
            {history.history.map(record => (
              <tr key={record._id} className="border-t">
                <td className="p-3">{new Date(record.date).toLocaleDateString()}</td>
                <td className="p-3">{record.type}</td>
                <td className="p-3">{record.description}</td>
                <td className="p-3">{record.technician}</td>
                <td className="p-3">{record.cost ? `$${record.cost}` : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }