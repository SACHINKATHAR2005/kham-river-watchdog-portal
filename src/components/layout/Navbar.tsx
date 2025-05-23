
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, BarChart2 } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <BarChart2 className="h-8 w-8 mr-2" />
              <span className="text-xl font-bold tracking-wider">Kham River Monitoring</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-blue-200 transition-colors duration-200">Home</Link>
            <Link to="/stations" className="hover:text-blue-200 transition-colors duration-200">Stations</Link>
            <Link to="/data" className="hover:text-blue-200 transition-colors duration-200">Data</Link>
            <Link to="/about" className="hover:text-blue-200 transition-colors duration-200">About</Link>
            <Link 
              to="/admin/login" 
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md transition-colors duration-200"
            >
              Admin Login
            </Link>
          </div>
          
          <div className="flex md:hidden">
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-blue-200 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/stations" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Stations
            </Link>
            <Link 
              to="/data" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Data
            </Link>
            <Link 
              to="/about" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/admin/login" 
              className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 hover:bg-blue-500"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
