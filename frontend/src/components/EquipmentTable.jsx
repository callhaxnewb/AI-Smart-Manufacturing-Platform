export function EquipmentTable({ equipment, onViewDetails, onViewMaintenance }) {
    return (
      <table className="w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Location</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map(item => (
            <tr key={item._id} className="border-t">
              <td className="p-3">{item.name}</td>
              <td className="p-3">{item.type}</td>
              <td className="p-3">{item.location}</td>
              <td className="p-3 capitalize">{item.status}</td>
              <td className="p-3">
                <button
                  onClick={() => onViewDetails(item._id)}
                  className="text-blue-600 hover:underline mr-2"
                >
                  Details
                </button>
                <button
                  onClick={() => onViewMaintenance(item._id)}
                  className="text-blue-600 hover:underline"
                >
                  Maintenance
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }