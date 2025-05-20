export function StatusSummary({ statusSummary }) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Equipment Status Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          {statusSummary.map(status => (
            <div key={status._id} className="p-2 bg-gray-100 rounded">
              <span className="font-medium capitalize">{status._id}:</span> {status.count}
            </div>
          ))}
        </div>
      </div>
    );
  }