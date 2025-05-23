
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, ChevronDown, LogOut, User, BarChart2 } from 'lucide-react';

interface AdminNavbarProps {
  onMenuToggle: () => void;
}

const AdminNavbar = ({ onMenuToggle }: AdminNavbarProps) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-blue-800 text-white shadow-md">
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={onMenuToggle} 
            className="p-2 rounded hover:bg-blue-700 mr-2"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <Link to="/admin/dashboard" className="flex items-center">
            <BarChart2 className="h-6 w-6 mr-2" />
            <span className="text-lg font-bold">Kham River Admin</span>
          </Link>
        </div>

        <div className="relative">
          <button 
            className="flex items-center p-2 rounded hover:bg-blue-700"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <User className="h-5 w-5 mr-1" />
            <span className="mr-1">{user?.email}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {userMenuOpen && (
            <div 
              className="absolute right-0 mt-2 w-48 bg-white text-gray-700 rounded-md shadow-lg py-1 z-10"
              onClick={() => setUserMenuOpen(false)}
            >
              <button
                className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
