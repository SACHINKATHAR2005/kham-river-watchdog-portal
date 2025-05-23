
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart2, Droplets, MapPin, AlertCircle } from 'lucide-react';

const Home = () => {
  const [stats, setStats] = useState({
    totalStations: 0,
    recentReadings: 0,
  });
  const [latestReadings, setLatestReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total stations
        const { count: stationCount } = await supabase
          .from('stations')
          .select('*', { count: 'exact' });
        
        // Get recent readings count
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        
        const { count: readingsCount } = await supabase
          .from('water_quality')
          .select('*', { count: 'exact' })
          .gte('created_at', threeDaysAgo.toISOString());
        
        // Get latest readings for each station
        const { data: stations } = await supabase
          .from('stations')
          .select('id, name, number')
          .eq('status', 'active')
          .limit(4);
          
        if (stations) {
          const latestData = await Promise.all(stations.map(async (station) => {
            const { data } = await supabase
              .from('water_quality')
              .select('*')
              .eq('station_id', station.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
              
            return {
              station: station,
              reading: data
            };
          }));
          
          setLatestReadings(latestData.filter(item => item.reading));
        }
        
        setStats({
          totalStations: stationCount || 0,
          recentReadings: readingsCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // Helper function to classify water quality
  const getWaterQuality = (reading: any) => {
    if (!reading) return { status: 'unknown', color: 'gray' };

    const ph = reading.ph_level;
    
    if (ph >= 6.5 && ph <= 8.0) {
      return { status: 'Good', color: 'green' };
    } else if ((ph >= 6.0 && ph < 6.5) || (ph > 8.0 && ph <= 8.5)) {
      return { status: 'Moderate', color: 'yellow' };
    } else {
      return { status: 'Poor', color: 'red' };
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-800 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl font-bold mb-6">Kham River Water Quality Monitoring</h1>
              <p className="text-xl mb-8">
                Real-time monitoring and analysis of water quality parameters across the Kham River basin. 
                Protecting our water resources through data and community action.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/stations" 
                  className="inline-flex items-center bg-white text-blue-800 px-6 py-3 rounded-md font-medium hover:bg-blue-100 transition-colors"
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  View Monitoring Stations
                </Link>
                <Link 
                  to="/data" 
                  className="inline-flex items-center bg-transparent border border-white text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  <BarChart2 className="mr-2 h-5 w-5" />
                  Explore Data
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img 
                src="https://images.unsplash.com/photo-1496387314164-18b0105f7553?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cmVzZWFyY2glMjBsYWJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60" 
                alt="Water quality monitoring"
                className="rounded-lg shadow-2xl max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Monitoring System Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg shadow-md flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-800 mr-4">
                <MapPin className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-semibold">ACTIVE MONITORING STATIONS</p>
                <p className="text-3xl font-bold">{loading ? '...' : stats.totalStations}</p>
                <p className="text-sm text-gray-600">Across the Kham River basin</p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg shadow-md flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-800 mr-4">
                <Droplets className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-semibold">RECENT MEASUREMENTS</p>
                <p className="text-3xl font-bold">{loading ? '...' : stats.recentReadings}</p>
                <p className="text-sm text-gray-600">In the last 3 days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Readings Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-6">Latest Water Quality Readings</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Real-time water quality data from our monitoring stations. Click on any station to view detailed information and historical trends.
          </p>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {latestReadings.length > 0 ? (
                latestReadings.map((item) => {
                  const quality = getWaterQuality(item.reading);
                  return (
                    <Link 
                      to={`/station/${item.station.id}`} 
                      key={item.station.id}
                      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold">{item.station.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${quality.color === 'green' ? 'bg-green-100 text-green-800' : 
                          quality.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          quality.color === 'red' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`
                        }>
                          {quality.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">pH Level:</span>
                          <span className="font-semibold">{item.reading?.ph_level?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Temperature:</span>
                          <span className="font-semibold">{item.reading?.temperature?.toFixed(1) || 'N/A'}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Turbidity:</span>
                          <span className="font-semibold">{item.reading?.turbidity?.toFixed(1) || 'N/A'} NTU</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                          Last updated: {item.reading?.created_at ? new Date(item.reading.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="col-span-full flex flex-col items-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 text-center">No data available at the moment. Please check back later.</p>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-12 text-center">
            <Link 
              to="/data" 
              className="inline-flex items-center bg-blue-700 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-800 transition-colors"
            >
              View All Water Quality Data
              <svg className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
