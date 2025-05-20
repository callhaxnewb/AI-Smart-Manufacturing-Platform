export function Sidebar({ activePage, setActivePage }) {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'equipment', label: 'Equipment' },
      { id: 'analytics', label: 'Analytics' },
      { id: 'import', label: 'Data Import' },
    ];
  
    return (
      <div className="w-64 bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold mb-6">Equipment Monitor</h1>
        <nav>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full text-left py-2 px-4 mb-2 rounded ${activePage === item.id ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    );
  }