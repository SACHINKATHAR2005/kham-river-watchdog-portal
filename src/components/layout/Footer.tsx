
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-blue-900 text-white pt-8 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Kham River Monitoring</h3>
            <p className="text-blue-200">
              Monitoring and protecting our water resources for future generations.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-blue-200 hover:text-white">Home</Link></li>
              <li><Link to="/stations" className="text-blue-200 hover:text-white">Stations</Link></li>
              <li><Link to="/data" className="text-blue-200 hover:text-white">Water Quality Data</Link></li>
              <li><Link to="/about" className="text-blue-200 hover:text-white">About</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <address className="not-italic text-blue-200">
              <p>Email: contact@khamriver.org</p>
              <p>Phone: +66 123 4567</p>
              <p>Address: 123 River Road, Chiang Mai, Thailand</p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-blue-800 mt-8 pt-6 text-center text-blue-300">
          <p>© {currentYear} Kham River Watchdog Project. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
