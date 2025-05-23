
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, Download, Filter, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from "date-fns";

interface Station {
  id: string;
  name: string;
  number: string;
}

interface WaterQualityReading {
  id: string;
  station_id: string;
  timestamp: string;
  ph_level: number;
  temperature: number;
  turbidity: number;
  total_dissolved_solids: number;
  dissolved_oxygen: number | null;
  conductivity: number | null;
  collector_name: string | null;
  station: Station;
}

const Data = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [readings, setReadings] = useState<WaterQualityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalReadings, setTotalReadings] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch stations
        const { data: stationsData } = await supabase
          .from('stations')
          .select('id, name, number')
          .order('name', { ascending: true });
          
        if (stationsData) {
          setStations(stationsData);
        }

        // Fetch water quality data with filters
        let query = supabase
          .from('water_quality')
          .select('*, station:station_id(id, name, number)', { count: 'exact' });

        // Apply station filter
        if (selectedStation) {
          query = query.eq('station_id', selectedStation);
        }
        
        // Apply date filters
        if (fromDate) {
          const fromDateStr = fromDate.toISOString().split('T')[0];
          query = query.gte('timestamp', `${fromDateStr}T00:00:00`);
        }
        
        if (toDate) {
          const toDateStr = toDate.toISOString().split('T')[0];
          query = query.lte('timestamp', `${toDateStr}T23:59:59`);
        }

        // Apply pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        const { data: readingsData, count } = await query
          .order('timestamp', { ascending: false })
          .range(from, to);
          
        if (readingsData) {
          setReadings(readingsData);
          setTotalReadings(count || 0);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [page, pageSize, selectedStation, fromDate, toDate]);

  // Filter readings based on search query
  const filteredReadings = searchQuery 
    ? readings.filter(reading => 
        reading.station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reading.station.number.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : readings;
  
  // Reset filters
  const resetFilters = () => {
    setSelectedStation('');
    setFromDate(undefined);
    setToDate(undefined);
    setPage(1);
  };
  
  // Download CSV
  const downloadCSV = () => {
    if (!filteredReadings.length) return;
    
    const headers = [
      'Station', 'Station ID', 'Date', 'Time', 'pH Level', 'Temperature (°C)', 'Turbidity (NTU)',
      'TDS (mg/L)', 'Conductivity (μS/cm)', 'Dissolved Oxygen (mg/L)', 'Collector'
    ];
    
    const rows = filteredReadings.map(reading => [
      reading.station.name,
      reading.station.number,
      new Date(reading.timestamp).toLocaleDateString(),
      new Date(reading.timestamp).toLocaleTimeString(),
      reading.ph_level,
      reading.temperature,
      reading.turbidity,
      reading.total_dissolved_solids,
      reading.conductivity || '',
      reading.dissolved_oxygen || '',
      reading.collector_name || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'water-quality-data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalReadings / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Water Quality Data</h1>
      <p className="text-gray-600 mb-8 max-w-3xl">
        Comprehensive water quality data collected from our monitoring stations across the Kham River basin.
        Use the filters to narrow down your search or download the data for further analysis.
      </p>
      
      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search by station..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Select value={selectedStation} onValueChange={setSelectedStation}>
              <SelectTrigger>
                <SelectValue placeholder="Select station" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Stations</SelectItem>
                {stations.map(station => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "MMM dd, yyyy") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "MMM dd, yyyy") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="flex-1 flex items-center"
            >
              <Filter className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button 
              onClick={downloadCSV}
              className="flex-1 flex items-center"
              disabled={filteredReadings.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>
      
      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
          ) : filteredReadings.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Filter className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No data found</h3>
              <p className="mt-1 text-gray-500">
                Try adjusting your filters or search criteria.
              </p>
              <Button onClick={resetFilters} variant="outline" className="mt-4">
                Reset Filters
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead>Station ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>pH</TableHead>
                  <TableHead>Temp (°C)</TableHead>
                  <TableHead>Turbidity</TableHead>
                  <TableHead>TDS (mg/L)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReadings.map(reading => (
                  <TableRow key={reading.id}>
                    <TableCell>
                      <Link 
                        to={`/station/${reading.station_id}`} 
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {reading.station?.name || 'Unknown Station'}
                      </Link>
                    </TableCell>
                    <TableCell>{reading.station?.number || '-'}</TableCell>
                    <TableCell>{new Date(reading.timestamp).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(reading.timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell>{reading.ph_level?.toFixed(1) || '-'}</TableCell>
                    <TableCell>{reading.temperature?.toFixed(1) || '-'}</TableCell>
                    <TableCell>{reading.turbidity?.toFixed(1) || '-'}</TableCell>
                    <TableCell>{reading.total_dissolved_solids || '-'}</TableCell>
                    <TableCell>
                      <Link 
                        to={`/station/${reading.station_id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{Math.min((page - 1) * pageSize + 1, totalReadings)}</span> to{' '}
                  <span className="font-medium">{Math.min(page * pageSize, totalReadings)}</span> of{' '}
                  <span className="font-medium">{totalReadings}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(page > 1 ? page - 1 : 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {/* Pagination numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                    const pageNumber = totalPages <= 5 
                      ? idx + 1 
                      : page <= 3 
                        ? idx + 1 
                        : page >= totalPages - 2 
                          ? totalPages - 4 + idx 
                          : page - 2 + idx;
                          
                    return (
                      <button
                        key={idx}
                        onClick={() => setPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNumber
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Data;
