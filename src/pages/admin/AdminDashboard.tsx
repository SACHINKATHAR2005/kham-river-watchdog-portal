
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, LineChart, PieChart, Users, 
  AlertCircle, MapPin, Database, ArrowRight,
  Activity, ThermometerSun, Droplet
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
} from 'recharts';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStations: 0,
    activeStations: 0,
    totalReadings: 0,
    recentReadings: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [stationChartData, setStationChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get stations count
        const { count: stationCount } = await supabase
          .from('stations')
          .select('*', { count: 'exact' });
          
        // Get active stations count
        const { count: activeStationCount } = await supabase
          .from('stations')
          .select('*', { count: 'exact' })
          .eq('status', 'active');
          
        // Get readings count
        const { count: readingsCount } = await supabase
          .from('water_quality')
          .select('*', { count: 'exact' });
          
        // Get recent readings (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: recentReadingsCount } = await supabase
          .from('water_quality')
          .select('*', { count: 'exact' })
          .gte('timestamp', sevenDaysAgo.toISOString());
          
        // Get recent activity
        const { data: recentData } = await supabase
          .from('water_quality')
          .select('*, station:station_id(name, number)')
          .order('timestamp', { ascending: false })
          .limit(10);
          
        if (recentData) {
          setRecentActivity(recentData);
        }
        
        // Generate chart data - daily readings for the past 14 days
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        
        const { data: timeseriesData } = await supabase
          .from('water_quality')
          .select('timestamp')
          .gte('timestamp', fourteenDaysAgo.toISOString())
          .order('timestamp', { ascending: true });
          
        if (timeseriesData) {
          // Group readings by day
          const dailyReadings: Record<string, number> = {};
          
          timeseriesData.forEach(reading => {
            const day = new Date(reading.timestamp).toLocaleDateString();
            dailyReadings[day] = (dailyReadings[day] || 0) + 1;
          });
          
          const chartDataArray = Object.entries(dailyReadings).map(([date, count]) => ({
            date,
            readings: count
          }));
          
          setChartData(chartDataArray);
        }
        
        // Get readings count by station
        const { data: stations } = await supabase
          .from('stations')
          .select('id, name, number')
          .limit(5);
          
        if (stations) {
          const stationDataPromises = stations.map(async (station) => {
            const { count } = await supabase
              .from('water_quality')
              .select('*', { count: 'exact' })
              .eq('station_id', station.id);
              
            return {
              name: station.name,
              readings: count || 0
            };
          });
          
          const stationData = await Promise.all(stationDataPromises);
          setStationChartData(stationData);
        }
        
        setStats({
          totalStations: stationCount || 0,
          activeStations: activeStationCount || 0,
          totalReadings: readingsCount || 0,
          recentReadings: recentReadingsCount || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">
            Welcome to the Kham River monitoring system administration portal.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/stations">
              Manage Stations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/data">
              Manage Data
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
            <MapPin className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : stats.totalStations}</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {loading ? '...' : stats.activeStations} active stations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Water Quality Readings</CardTitle>
            <Database className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : stats.totalReadings}</div>
            <p className="text-xs text-muted-foreground">
              All time data points collected
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Readings</CardTitle>
            <BarChart className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '...' : stats.recentReadings}</div>
            <p className="text-xs text-muted-foreground">
              In the last 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <AlertCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              All Systems Operational
            </div>
            <p className="text-xs text-muted-foreground">
              Last checked: {new Date().toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Readings Over Time</CardTitle>
            <CardDescription>
              Number of water quality measurements per day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="readings"
                      name="Readings"
                      stroke="#3b82f6"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Readings by Station</CardTitle>
            <CardDescription>
              Total water quality measurements per monitoring station
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={stationChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="readings" name="Readings" fill="#3b82f6" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Latest Readings & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest water quality readings from monitoring stations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                      <Database className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No recent activity</h3>
                    <p className="mt-1 text-gray-500">
                      There are no recent water quality readings.
                    </p>
                  </div>
                ) : (
                  recentActivity.map((reading) => (
                    <div key={reading.id} className="flex items-start">
                      <div className="mr-4">
                        <div className="flex h-10 w-10 rounded-full bg-blue-100 items-center justify-center">
                          <ThermometerSun className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link 
                              to={`/station/${reading.station_id}`} 
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {reading.station?.name || 'Unknown Station'}
                            </Link>
                            <span className="text-gray-500"> • </span>
                            <span className="text-gray-500">{reading.station?.number || ''}</span>
                          </div>
                          <time className="text-sm text-gray-500">
                            {new Date(reading.timestamp).toLocaleString()}
                          </time>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          <span className="flex items-center">
                            <Droplet className="mr-1 h-4 w-4 text-blue-500" />
                            pH: {reading.ph_level?.toFixed(1)}
                          </span>
                          <span className="flex items-center">
                            <ThermometerSun className="mr-1 h-4 w-4 text-red-500" />
                            Temp: {reading.temperature?.toFixed(1)}°C
                          </span>
                          <span className="flex items-center">
                            TDS: {reading.total_dissolved_solids} mg/L
                          </span>
                          <span className="flex items-center">
                            Turbidity: {reading.turbidity?.toFixed(1)} NTU
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                <div className="pt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/admin/data">
                      View All Data
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button asChild className="w-full justify-start">
                <Link to="/admin/stations/new">
                  <MapPin className="mr-2 h-4 w-4" />
                  Add New Station
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/admin/data/new">
                  <Database className="mr-2 h-4 w-4" />
                  Add Water Quality Data
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/admin/data/import">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Import Data
                </Link>
              </Button>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-md">
              <h4 className="font-medium text-blue-800 mb-2">System Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Service</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Data Ingestion</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Operational
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
