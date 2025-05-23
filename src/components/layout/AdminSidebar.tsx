
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MapPin, Database, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  isOpen: boolean;
}

const AdminSidebar = ({ isOpen }: AdminSidebarProps) => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Stations', path: '/admin/stations', icon: <MapPin className="h-5 w-5" /> },
    { name: 'Data Management', path: '/admin/data', icon: <Database className="h-5 w-5" /> },
    { name: 'Users', path: '/admin/users', icon: <Users className="h-5 w-5" /> },
  ];

  return (
    <aside className={cn(
      "bg-white shadow-md transition-all duration-300 ease-in-out",
      isOpen ? "w-64" : "w-0 md:w-16"
    )}>
      <div className="h-full overflow-y-auto">
        <nav className="pt-5 px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-4 py-3 mb-2 rounded-lg transition-colors",
                location.pathname === item.path
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100",
                !isOpen && "justify-center"
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className={cn("ml-3", !isOpen && "hidden md:hidden")}>
                {item.name}
              </span>
            </Link>
          ))}
        </nav>
        
        <div className="mt-8 px-6">
          <Link to="/" className={cn(
            "block text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors",
            !isOpen && "md:mx-auto md:p-2"
          )}>
            {isOpen ? "View Public Site" : ""}
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
