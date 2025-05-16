import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-blue-600 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">Smart Manufacturing Analytics</h1>
        <div className="space-x-4">
          <Link to="/" className="text-white hover:text-blue-200">Dashboard</Link>
          <Link to="/equipment" className="text-white hover:text-blue-200">Equipment</Link>
          <Link to="/analytics" className="text-white hover:text-blue-200">Analytics</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;