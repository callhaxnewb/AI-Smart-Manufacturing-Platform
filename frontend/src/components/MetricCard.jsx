function MetricCard({ title, value, unit, status }) {
    const statusColor = {
      operational: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      fault: 'bg-red-100 text-red-800',
      offline: 'bg-gray-100 text-gray-800',
    }[status] || 'bg-gray-100 text-gray-800';
  
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value} {unit}</p>
        {status && (
          <span className={`inline-block mt-2 px-2 py-1 text-sm rounded ${statusColor}`}>
            {status}
          </span>
        )}
      </div>
    );
  }
  
  export default MetricCard;