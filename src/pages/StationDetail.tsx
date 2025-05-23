
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, Phone, Calendar, Info, ArrowLeft, 
  Download, Thermometer, Droplets, Waves
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";

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

interface WaterQualityReading {
  id: string;
  station_id: string;
  timestamp: string;
  ph_level: number;
  temperature: number;
  turbidity: number;
  total_dissolved_solids: number;
  ec: number;
  conductivity: number;
  dissolved_oxygen: number;
  measurement_date: string;
  measurement_time: string;
  collector_name: string;
  notes: string;
}

const StationDetail = () => {
  const { stationId } = useParams<{ stationId: string }>();
  const [station, setStation] = useState<Station | null>(null);
  const [readings, setReadings] = useState<WaterQualityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataTimeframe, setDataTimeframe] = useState('7d'); // 7d, 30d, 90d
  
  useEffect(() => {
    const fetchStationData = async () => {
      if (!stationId) return;
      
      try {
        // Fetch station details
        const { data: stationData, error: stationError } = await supabase
          .from('stations')
          .select('*')
          .eq('id', stationId)
          .single();
          
        if (stationError) throw stationError;
        setStation(stationData);
        
        // Calculate date range based on timeframe
        const endDate = new Date();
        const startDate = new Date();
        
        switch (dataTimeframe) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
          default:
            startDate.setDate(endDate.getDate() - 7);
        }
        
        // Fetch water quality readings
        const { data: readingsData, error: readingsError } = await supabase
          .from('water_quality')
          .select('*')
          .eq('station_id', stationId)
          .gte('timestamp', startDate.toISOString())
          .lte('timestamp', endDate.toISOString())
          .order('timestamp', { ascending: false });
          
        if (readingsError) throw readingsError;
        setReadings(readingsData || []);
        
      } catch (error) {
        console.error('Error fetching station data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStationData();
  }, [stationId, dataTimeframe]);
  
  // Format data for charts
  const formatChartData = () => {
    return [...readings]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(reading => ({
        date: new Date(reading.timestamp).toLocaleDateString(),
        ph: reading.ph_level,
        temp: reading.temperature,
        turbidity: reading.turbidity,
        tds: reading.total_dissolved_solids,
        conductivity: reading.conductivity,
        oxygen: reading.dissolved_oxygen,
      }));
  };
  
  // Download data as CSV
  const downloadCSV = () => {
    if (!readings.length || !station) return;
    
    const headers = [
      'Date', 'Time', 'pH Level', 'Temperature (°C)', 'Turbidity (NTU)',
      'TDS (mg/L)', 'Conductivity (μS/cm)', 'Dissolved Oxygen (mg/L)', 'Collector', 'Notes'
    ];
    
    const rows = readings.map(reading => [
      new Date(reading.timestamp).toLocaleDateString(),
      new Date(reading.timestamp).toLocaleTimeString(),
      reading.ph_level,
      reading.temperature,
      reading.turbidity,
      reading.total_dissolved_solids,
      reading.conductivity,
      reading.dissolved_oxygen,
      reading.collector_name,
      reading.notes
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${station.name}-data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Helper function to get latest reading
  const getLatestReading = () => {
    if (!readings.length) return null;
    return readings[0]; // Readings are already sorted by timestamp desc
  };
  
  // Helper function to get water quality status
  const getWaterQualityStatus = (reading: WaterQualityReading) => {
    const ph = reading.ph_level;
    
    if (ph >= 6.5 && ph <= 8.0) {
      return { status: 'Good', color: 'text-green-600', bg: 'bg-green-100' };
    } else if ((ph >= 6.0 && ph < 6.5) || (ph > 8.0 && ph <= 8.5)) {
      return { status: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else {
      return { status: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }
  
  if (!station) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <Info className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Station Not Found</h2>
        <p className="mb-8">The monitoring station you're looking for doesn't exist or may have been removed.</p>
        <Button asChild>
          <Link to="/stations">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Stations
          </Link>
        </Button>
      </div>
    );
  }
  
  const latestReading = getLatestReading();
  const chartData = formatChartData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link to="/stations" className="inline-flex items-center text-blue-600 hover:underline mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Stations
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{station.name}</h1>
            <div className="flex items-center mt-2 text-gray-500">
              <MapPin className="h-5 w-5 mr-1" />
              <span>Station ID: {station.number}</span>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button onClick={downloadCSV} variant="outline" className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Download Data
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Station Information */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Station Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                    ${station.status === 'active' ? 'bg-green-100 text-green-800' :
                    station.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'}`
                  }>
                    {station.status || 'Unknown'}
                  </span>
                </dd>
              </div>
              
              {station.latitude && station.longitude && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-1" />
                    {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                  </dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Frequency</dt>
                <dd className="mt-1 text-sm text-gray-900">{station.frequency}</dd>
              </div>
              
              {station.installation_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Installation Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-1" />
                    {new Date(station.installation_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
              
              {station.contact_person && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-1" />
                    {station.contact_person}
                  </dd>
                </div>
              )}
              
              {station.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{station.description}</dd>
                </div>
              )}
            </dl>
            
            {/* Map View (placeholder) */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Station Location</h4>
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-md flex items-center justify-center">
                <span className="text-gray-500 text-sm">Map view will be displayed here</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Current Water Quality */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Current Water Quality</CardTitle>
            {latestReading && (
              <div className="text-sm text-gray-500">
                Last updated: {new Date(latestReading.timestamp).toLocaleString()}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {latestReading ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  {/* Status indicator */}
                  {latestReading && (
                    <div className="col-span-full">
                      <div className="text-sm font-medium text-gray-500 mb-2">Overall Water Quality</div>
                      <div className={`p-4 rounded-md ${getWaterQualityStatus(latestReading).bg}`}>
                        <div className="flex items-center">
                          <div className={`text-2xl font-bold ${getWaterQualityStatus(latestReading).color}`}>
                            {getWaterQualityStatus(latestReading).status}
                          </div>
                          <div className="ml-auto">
                            <Button asChild variant="outline" size="sm">
                              <Link to="/data">Compare with other stations</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* pH Level */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <Droplets className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-500">pH Level</span>
                    </div>
                    <div className="text-3xl font-bold">{latestReading.ph_level.toFixed(1)}</div>
                    <div className="mt-2 text-xs text-gray-500">Normal range: 6.5-8.5</div>
                  </div>
                  
                  {/* Temperature */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <Thermometer className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-sm font-medium text-gray-500">Temperature</span>
                    </div>
                    <div className="text-3xl font-bold">{latestReading.temperature.toFixed(1)}°C</div>
                    <div className="mt-2 text-xs text-gray-500">Normal range: 20-30°C</div>
                  </div>
                  
                  {/* Turbidity */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <Waves className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-500">Turbidity</span>
                    </div>
                    <div className="text-3xl font-bold">{latestReading.turbidity.toFixed(1)} NTU</div>
                    <div className="mt-2 text-xs text-gray-500">Good: Less than 5 NTU</div>
                  </div>
                  
                  {/* TDS */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <Droplets className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="text-sm font-medium text-gray-500">Total Dissolved Solids</span>
                    </div>
                    <div className="text-3xl font-bold">{latestReading.total_dissolved_solids} mg/L</div>
                    <div className="mt-2 text-xs text-gray-500">Good: Less than 500 mg/L</div>
                  </div>
                  
                  {latestReading.conductivity && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-medium text-gray-500">Conductivity</span>
                      </div>
                      <div className="text-3xl font-bold">{latestReading.conductivity} μS/cm</div>
                      <div className="mt-2 text-xs text-gray-500">Normal range: 100-2000 μS/cm</div>
                    </div>
                  )}
                  
                  {latestReading.dissolved_oxygen && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-medium text-gray-500">Dissolved Oxygen</span>
                      </div>
                      <div className="text-3xl font-bold">{latestReading.dissolved_oxygen} mg/L</div>
                      <div className="mt-2 text-xs text-gray-500">Good: Above 6 mg/L</div>
                    </div>
                  )}
                </div>
                
                {latestReading.collector_name && (
                  <div className="text-sm text-gray-500">
                    Data collected by: <span className="font-medium">{latestReading.collector_name}</span>
                  </div>
                )}
                
                {latestReading.notes && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-500">Notes:</h4>
                    <p className="text-sm text-gray-900">{latestReading.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <Info className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No data available</h3>
                <p className="mt-1 text-gray-500">
                  There are no water quality readings for this station.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Historical Data Section */}
      {readings.length > 0 && (
        <div className="mb-12">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <CardTitle>Historical Water Quality Data</CardTitle>
                <div className="mt-4 md:mt-0">
                  <div className="inline-flex items-center rounded-md border border-gray-200">
                    <button
                      onClick={() => setDataTimeframe('7d')}
                      className={`px-4 py-2 text-sm ${dataTimeframe === '7d' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      7 Days
                    </button>
                    <button
                      onClick={() => setDataTimeframe('30d')}
                      className={`px-4 py-2 text-sm border-l ${dataTimeframe === '30d' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      30 Days
                    </button>
                    <button
                      onClick={() => setDataTimeframe('90d')}
                      className={`px-4 py-2 text-sm border-l ${dataTimeframe === '90d' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      90 Days
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="charts">
                <TabsList className="mb-6">
                  <TabsTrigger value="charts">Charts</TabsTrigger>
                  <TabsTrigger value="table">Data Table</TabsTrigger>
                </TabsList>
                
                <TabsContent value="charts" className="space-y-6">
                  {/* pH Chart */}
                  <div>
                    <h4 className="text-base font-medium mb-4">pH Level over Time</h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[5, 9]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="ph" 
                            name="pH Level"
                            stroke="#3b82f6" 
                            activeDot={{ r: 8 }} 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Temperature Chart */}
                  <div>
                    <h4 className="text-base font-medium mb-4">Temperature over Time (°C)</h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="temp" 
                            name="Temperature" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Turbidity & TDS Chart */}
                  <div>
                    <h4 className="text-base font-medium mb-4">Turbidity & TDS over Time</h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="turbidity" 
                            name="Turbidity (NTU)" 
                            stroke="#10b981" 
                            strokeWidth={2}
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="tds" 
                            name="TDS (mg/L)" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {chartData.some(data => data.oxygen) && (
                    <div>
                      <h4 className="text-base font-medium mb-4">Dissolved Oxygen over Time (mg/L)</h4>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="oxygen" 
                              name="Dissolved Oxygen" 
                              stroke="#06b6d4" 
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="table">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>pH</TableHead>
                          <TableHead>Temperature (°C)</TableHead>
                          <TableHead>Turbidity (NTU)</TableHead>
                          <TableHead>TDS (mg/L)</TableHead>
                          {readings.some(r => r.dissolved_oxygen) && (
                            <TableHead>Dissolved Oxygen (mg/L)</TableHead>
                          )}
                          {readings.some(r => r.conductivity) && (
                            <TableHead>Conductivity (μS/cm)</TableHead>
                          )}
                          <TableHead>Collector</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {readings.map(reading => (
                          <TableRow key={reading.id}>
                            <TableCell>
                              {new Date(reading.timestamp).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(reading.timestamp).toLocaleTimeString()}
                            </TableCell>
                            <TableCell>{reading.ph_level?.toFixed(1) || '-'}</TableCell>
                            <TableCell>{reading.temperature?.toFixed(1) || '-'}</TableCell>
                            <TableCell>{reading.turbidity?.toFixed(1) || '-'}</TableCell>
                            <TableCell>{reading.total_dissolved_solids || '-'}</TableCell>
                            {readings.some(r => r.dissolved_oxygen) && (
                              <TableCell>{reading.dissolved_oxygen?.toFixed(1) || '-'}</TableCell>
                            )}
                            {readings.some(r => r.conductivity) && (
                              <TableCell>{reading.conductivity || '-'}</TableCell>
                            )}
                            <TableCell>{reading.collector_name || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StationDetail;
