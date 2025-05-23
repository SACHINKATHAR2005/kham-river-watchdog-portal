
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, MapPin, Info, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Station {
  id: string;
  name: string;
  number: string;
  frequency: string;
  status: string;
  description: string;
  latitude: number;
  longitude: number;
  contact_person: string;
  installation_date: string;
}

const Stations = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const { data, error } = await supabase
          .from('stations')
          .select('*')
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          setStations(data);
          setFilteredStations(data);
        }
      } catch (error) {
        console.error('Error fetching stations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStations();
  }, []);
  
  useEffect(() => {
    const filtered = stations.filter(station => 
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStations(filtered);
  }, [searchQuery, stations]);
  
  // Helper function to get station status badge style
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return { color: 'bg-green-100 text-green-800', icon: <Activity className="h-4 w-4 mr-1" /> };
      case 'inactive':
        return { color: 'bg-red-100 text-red-800', icon: <Activity className="h-4 w-4 mr-1" /> };
      case 'maintenance':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <Activity className="h-4 w-4 mr-1" /> };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <Info className="h-4 w-4 mr-1" /> };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Monitoring Stations</h1>
      <p className="text-gray-600 mb-8 max-w-3xl">
        Our network of monitoring stations across the Kham River basin continuously collects 
        water quality data. Click on any station to view detailed information and recent readings.
      </p>
      
      <div className="mb-8 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search stations by name or ID..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : (
        <>
          {filteredStations.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Info className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No stations found</h3>
              <p className="mt-1 text-gray-500">
                Try adjusting your search query or check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStations.map(station => {
                const statusStyle = getStatusBadge(station.status);
                
                return (
                  <Link 
                    key={station.id} 
                    to={`/station/${station.id}`}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">{station.name}</h2>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.color}`}>
                          {statusStyle.icon}
                          {station.status || 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                          <span className="text-gray-600">
                            {station.latitude && station.longitude 
                              ? `${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}`
                              : 'Location data not available'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Station ID:</span>
                          <span className="font-medium">{station.number}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Frequency:</span>
                          <span className="font-medium">{station.frequency}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Installed:</span>
                          <span className="font-medium">
                            {station.installation_date 
                              ? new Date(station.installation_date).toLocaleDateString() 
                              : 'Unknown'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <span className="inline-flex items-center text-blue-600 text-sm font-medium">
                          View station details
                          <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Stations;
