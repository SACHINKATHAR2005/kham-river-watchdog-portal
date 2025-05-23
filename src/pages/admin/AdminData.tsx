
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, Search, Edit, Trash2, Check, X, CalendarIcon, 
  Upload, Database, Filter, ArrowDown 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ec: number;
  dissolved_oxygen: number | null;
  conductivity: number | null;
  measurement_date: string | null;
  measurement_time: string | null;
  collector_name: string | null;
  notes: string | null;
  station: Station;
}

const defaultReading = {
  station_id: '',
  ph_level: 7.0,
  temperature: 25,
  turbidity: 1,
  total_dissolved_solids: 100,
  ec: 150,
  dissolved_oxygen: null,
  conductivity: null,
  collector_name: '',
  notes: '',
};

const AdminData = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [readings, setReadings] = useState<WaterQualityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalReadings, setTotalReadings] = useState(0);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentReading, setCurrentReading] = useState<Partial<WaterQualityReading>>(defaultReading);
  const [readingToDelete, setReadingToDelete] = useState<WaterQualityReading | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch stations for dropdown
        const { data: stationsData } = await supabase
          .from('stations')
          .select('id, name, number')
          .order('name', { ascending: true });
          
        if (stationsData) {
          setStations(stationsData);
        }
        
        // Build query for readings
        let query = supabase
          .from('water_quality')
          .select('*, station:station_id(id, name, number)', { count: 'exact' });
          
        // Apply filters
        if (selectedStation) {
          query = query.eq('station_id', selectedStation);
        }
        
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
        
        // Execute query
        const { data: readingsData, count } = await query
          .order('timestamp', { ascending: false })
          .range(from, to);
          
        if (readingsData) {
          setReadings(readingsData);
          setTotalReadings(count || 0);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedStation, fromDate, toDate, page, pageSize]);
  
  // Filter readings based on search query
  const filteredReadings = searchQuery 
    ? readings.filter(reading => 
        reading.station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reading.station.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reading.collector_name && reading.collector_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : readings;
  
  // Calculate total pages
  const totalPages = Math.ceil(totalReadings / pageSize);
  
  // Reset filters
  const resetFilters = () => {
    setSelectedStation('');
    setFromDate(undefined);
    setToDate(undefined);
    setSearchQuery('');
    setPage(1);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement; // Type assertion
    
    setCurrentReading(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setCurrentReading(prev => ({
      ...prev,
      [name]: name === 'station_id' ? value : value
    }));
  };
  
  // Add new reading
  const handleAddReading = async () => {
    try {
      if (!currentReading.station_id) {
        toast({
          title: "Validation Error",
          description: "Please select a station.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate required numeric fields
      const requiredNumericFields = ['ph_level', 'temperature', 'turbidity', 'total_dissolved_solids', 'ec'];
      for (const field of requiredNumericFields) {
        if (currentReading[field as keyof typeof currentReading] === undefined || 
            currentReading[field as keyof typeof currentReading] === null) {
          toast({
            title: "Validation Error",
            description: `Please provide a value for ${field.replace('_', ' ')}.`,
            variant: "destructive"
          });
          return;
        }
      }
      
      // Validate pH range
      if (typeof currentReading.ph_level === 'number' && (currentReading.ph_level < 0 || currentReading.ph_level > 14)) {
        toast({
          title: "Validation Error",
          description: "pH level must be between 0 and 14.",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('water_quality')
        .insert({
          station_id: currentReading.station_id,
          ph_level: currentReading.ph_level,
          temperature: currentReading.temperature,
          turbidity: currentReading.turbidity,
          total_dissolved_solids: currentReading.total_dissolved_solids,
          ec: currentReading.ec,
          dissolved_oxygen: currentReading.dissolved_oxygen || null,
          conductivity: currentReading.conductivity || null,
          collector_name: currentReading.collector_name || null,
          notes: currentReading.notes || null,
        })
        .select('*, station:station_id(id, name, number)');
        
      if (error) throw error;
      
      if (data) {
        // Update local state to show the new reading
        setReadings([data[0], ...readings.slice(0, pageSize - 1)]);
        setTotalReadings(totalReadings + 1);
        
        setIsAddDialogOpen(false);
        setCurrentReading(defaultReading);
        
        toast({
          title: "Success",
          description: "Water quality reading added successfully.",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error('Error adding reading:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add reading. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Update reading
  const handleUpdateReading = async () => {
    try {
      if (!currentReading.id || !currentReading.station_id) {
        toast({
          title: "Validation Error",
          description: "Reading ID and station are required.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate required numeric fields
      const requiredNumericFields = ['ph_level', 'temperature', 'turbidity', 'total_dissolved_solids', 'ec'];
      for (const field of requiredNumericFields) {
        if (currentReading[field as keyof typeof currentReading] === undefined || 
            currentReading[field as keyof typeof currentReading] === null) {
          toast({
            title: "Validation Error",
            description: `Please provide a value for ${field.replace('_', ' ')}.`,
            variant: "destructive"
          });
          return;
        }
      }
      
      // Validate pH range
      if (typeof currentReading.ph_level === 'number' && (currentReading.ph_level < 0 || currentReading.ph_level > 14)) {
        toast({
          title: "Validation Error",
          description: "pH level must be between 0 and 14.",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('water_quality')
        .update({
          station_id: currentReading.station_id,
          ph_level: currentReading.ph_level,
          temperature: currentReading.temperature,
          turbidity: currentReading.turbidity,
          total_dissolved_solids: currentReading.total_dissolved_solids,
          ec: currentReading.ec,
          dissolved_oxygen: currentReading.dissolved_oxygen || null,
          conductivity: currentReading.conductivity || null,
          collector_name: currentReading.collector_name || null,
          notes: currentReading.notes || null,
        })
        .eq('id', currentReading.id)
        .select('*, station:station_id(id, name, number)');
        
      if (error) throw error;
      
      if (data) {
        setReadings(readings.map(reading => 
          reading.id === currentReading.id ? data[0] : reading
        ));
        
        setIsEditDialogOpen(false);
        setCurrentReading(defaultReading);
        
        toast({
          title: "Success",
          description: "Water quality reading updated successfully.",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error('Error updating reading:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update reading. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Delete reading
  const handleDeleteReading = async () => {
    try {
      if (!readingToDelete) return;
      
      const { error } = await supabase
        .from('water_quality')
        .delete()
        .eq('id', readingToDelete.id);
        
      if (error) throw error;
      
      setReadings(readings.filter(reading => reading.id !== readingToDelete.id));
      setTotalReadings(totalReadings - 1);
      setIsDeleteDialogOpen(false);
      setReadingToDelete(null);
      
      toast({
        title: "Success",
        description: "Water quality reading deleted successfully.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error deleting reading:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete reading. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle file import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
    }
  };
  
  // Import CSV data
  const handleImportData = async () => {
    if (!importFile) {
      toast({
        title: "Error",
        description: "Please select a file to import.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real application, this would process the CSV file
    // For simplicity here, we'll just show a success message
    toast({
      title: "Import Started",
      description: "Your data import has been initiated. This may take a few minutes to process.",
      variant: "default"
    });
    
    setIsImportDialogOpen(false);
    setImportFile(null);
  };
  
  // Open edit dialog
  const openEditDialog = (reading: WaterQualityReading) => {
    setCurrentReading({
      id: reading.id,
      station_id: reading.station_id,
      ph_level: reading.ph_level,
      temperature: reading.temperature,
      turbidity: reading.turbidity,
      total_dissolved_solids: reading.total_dissolved_solids,
      ec: reading.ec,
      dissolved_oxygen: reading.dissolved_oxygen,
      conductivity: reading.conductivity,
      collector_name: reading.collector_name,
      notes: reading.notes,
    });
    setIsEditDialogOpen(true);
  };
  
  // Open delete dialog
  const openDeleteDialog = (reading: WaterQualityReading) => {
    setReadingToDelete(reading);
    setIsDeleteDialogOpen(true);
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Water Quality Data</h1>
          <p className="text-gray-500">
            Manage water quality readings from your monitoring stations.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Reading
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="data">
        <TabsList className="mb-6">
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="import">Import/Export</TabsTrigger>
        </TabsList>
        
        <TabsContent value="data">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search by station or collector..."
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
              
              <div className="flex gap-2">
                <div className="w-1/2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fromDate ? format(fromDate, "MMM dd, yyyy") : "From"}
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
                </div>
                <div className="w-1/2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {toDate ? format(toDate, "MMM dd, yyyy") : "To"}
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
              
              <div>
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  className="w-full flex items-center"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              </div>
            </div>
            
            {/* Data Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                </div>
              ) : filteredReadings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    <Database className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No data found</h3>
                  <p className="mt-1 text-gray-500">
                    {searchQuery || selectedStation || fromDate || toDate 
                      ? 'Try adjusting your filters.' 
                      : 'Get started by adding your first water quality reading.'}
                  </p>
                  {(searchQuery || selectedStation || fromDate || toDate) && (
                    <Button variant="outline" className="mt-4" onClick={resetFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Station</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>pH</TableHead>
                      <TableHead>Temp (°C)</TableHead>
                      <TableHead>TDS (mg/L)</TableHead>
                      <TableHead>Turbidity (NTU)</TableHead>
                      <TableHead>Collector</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReadings.map((reading) => (
                      <TableRow key={reading.id}>
                        <TableCell className="font-medium">{reading.station?.name || 'Unknown'}</TableCell>
                        <TableCell>{new Date(reading.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{reading.ph_level?.toFixed(1) || '-'}</TableCell>
                        <TableCell>{reading.temperature?.toFixed(1) || '-'}</TableCell>
                        <TableCell>{reading.total_dissolved_solids || '-'}</TableCell>
                        <TableCell>{reading.turbidity?.toFixed(1) || '-'}</TableCell>
                        <TableCell>{reading.collector_name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0" 
                              onClick={() => openEditDialog(reading)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                              onClick={() => openDeleteDialog(reading)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            
            {/* Pagination */}
            {!loading && filteredReadings.length > 0 && totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page > 1 ? page - 1 : 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md"
                      >
                        <span className="sr-only">Previous</span>
                        <ArrowDown className="h-4 w-4 rotate-90" />
                      </Button>
                      
                      {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                        const pageNumber = totalPages <= 5 
                          ? idx + 1 
                          : page <= 3 
                            ? idx + 1 
                            : page >= totalPages - 2 
                              ? totalPages - 4 + idx 
                              : page - 2 + idx;
                              
                        return (
                          <Button
                            key={idx}
                            variant={page === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNumber)}
                            className="relative inline-flex items-center px-4 py-2"
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md"
                      >
                        <span className="sr-only">Next</span>
                        <ArrowDown className="h-4 w-4 -rotate-90" />
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="import">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Import Data</h2>
              <p className="text-gray-600 mb-4">
                Upload a CSV file with water quality readings. The file should have the following columns:
              </p>
              <div className="bg-gray-50 p-4 rounded mb-4">
                <code className="text-sm">
                  station_id, timestamp, ph_level, temperature, turbidity, total_dissolved_solids, 
                  ec, dissolved_oxygen, conductivity, collector_name, notes
                </code>
              </div>
              <Button onClick={() => setIsImportDialogOpen(true)} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV File
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Export Data</h2>
              <p className="text-gray-600 mb-4">
                Export water quality data to a CSV file. You can filter the data before exporting.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="export-station">Station</Label>
                  <Select defaultValue="">
                    <SelectTrigger id="export-station">
                      <SelectValue placeholder="All Stations" />
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="export-from">From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="export-from"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Select date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label htmlFor="export-to">To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="export-to"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Select date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <Button className="w-full">
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Export to CSV
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Add Reading Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Water Quality Reading</DialogTitle>
            <DialogDescription>
              Enter measurements from a monitoring station.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="station_id">Station *</Label>
              <Select 
                value={currentReading.station_id || ''}
                onValueChange={(value) => handleSelectChange('station_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  {stations.map(station => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name} ({station.number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ph_level">pH Level *</Label>
                <Input 
                  id="ph_level" 
                  name="ph_level"
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  value={currentReading.ph_level || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 7.2"
                  required
                />
              </div>
              <div>
                <Label htmlFor="temperature">Temperature (°C) *</Label>
                <Input 
                  id="temperature" 
                  name="temperature"
                  type="number"
                  step="0.1"
                  value={currentReading.temperature || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 25.5"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="turbidity">Turbidity (NTU) *</Label>
                <Input 
                  id="turbidity" 
                  name="turbidity"
                  type="number"
                  step="0.1"
                  value={currentReading.turbidity || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="total_dissolved_solids">TDS (mg/L) *</Label>
                <Input 
                  id="total_dissolved_solids" 
                  name="total_dissolved_solids"
                  type="number"
                  value={currentReading.total_dissolved_solids || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 120"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ec">Electrical Conductivity *</Label>
                <Input 
                  id="ec" 
                  name="ec"
                  type="number"
                  value={currentReading.ec || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 150"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dissolved_oxygen">Dissolved Oxygen (mg/L)</Label>
                <Input 
                  id="dissolved_oxygen" 
                  name="dissolved_oxygen"
                  type="number"
                  step="0.1"
                  value={currentReading.dissolved_oxygen || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 8.5"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="conductivity">Conductivity (μS/cm)</Label>
                <Input 
                  id="conductivity" 
                  name="conductivity"
                  type="number"
                  value={currentReading.conductivity || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 250"
                />
              </div>
              <div>
                <Label htmlFor="collector_name">Collector Name</Label>
                <Input 
                  id="collector_name" 
                  name="collector_name"
                  value={currentReading.collector_name || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., John Smith"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                name="notes"
                value={currentReading.notes || ''}
                onChange={handleInputChange}
                placeholder="Enter any additional notes or observations"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleAddReading}>
              <Check className="mr-2 h-4 w-4" />
              Add Reading
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Reading Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Water Quality Reading</DialogTitle>
            <DialogDescription>
              Update the measurements for this reading.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-station_id">Station *</Label>
              <Select 
                value={currentReading.station_id || ''}
                onValueChange={(value) => handleSelectChange('station_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  {stations.map(station => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name} ({station.number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Same input fields as Add Dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-ph_level">pH Level *</Label>
                <Input 
                  id="edit-ph_level" 
                  name="ph_level"
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  value={currentReading.ph_level || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 7.2"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-temperature">Temperature (°C) *</Label>
                <Input 
                  id="edit-temperature" 
                  name="temperature"
                  type="number"
                  step="0.1"
                  value={currentReading.temperature || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 25.5"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-turbidity">Turbidity (NTU) *</Label>
                <Input 
                  id="edit-turbidity" 
                  name="turbidity"
                  type="number"
                  step="0.1"
                  value={currentReading.turbidity || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-total_dissolved_solids">TDS (mg/L) *</Label>
                <Input 
                  id="edit-total_dissolved_solids" 
                  name="total_dissolved_solids"
                  type="number"
                  value={currentReading.total_dissolved_solids || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 120"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-ec">Electrical Conductivity *</Label>
                <Input 
                  id="edit-ec" 
                  name="ec"
                  type="number"
                  value={currentReading.ec || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 150"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-dissolved_oxygen">Dissolved Oxygen (mg/L)</Label>
                <Input 
                  id="edit-dissolved_oxygen" 
                  name="dissolved_oxygen"
                  type="number"
                  step="0.1"
                  value={currentReading.dissolved_oxygen || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 8.5"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-conductivity">Conductivity (μS/cm)</Label>
                <Input 
                  id="edit-conductivity" 
                  name="conductivity"
                  type="number"
                  value={currentReading.conductivity || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 250"
                />
              </div>
              <div>
                <Label htmlFor="edit-collector_name">Collector Name</Label>
                <Input 
                  id="edit-collector_name" 
                  name="collector_name"
                  value={currentReading.collector_name || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., John Smith"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea 
                id="edit-notes" 
                name="notes"
                value={currentReading.notes || ''}
                onChange={handleInputChange}
                placeholder="Enter any additional notes or observations"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleUpdateReading}>
              <Check className="mr-2 h-4 w-4" />
              Update Reading
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this water quality reading. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={handleDeleteReading}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with water quality readings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <Label 
                htmlFor="file-upload" 
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <span className="text-gray-600 font-medium">Click to select a file</span>
                <span className="text-gray-500 text-sm mt-1">
                  {importFile ? importFile.name : "CSV files only"}
                </span>
              </Label>
            </div>
            
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-medium text-blue-800 mb-2">CSV Format</h4>
              <p className="text-sm text-blue-700">
                Your CSV file should include these columns (in any order):
              </p>
              <ul className="text-xs text-blue-600 list-disc list-inside mt-2">
                <li>station_id (required)</li>
                <li>ph_level (required)</li>
                <li>temperature (required)</li>
                <li>turbidity (required)</li>
                <li>total_dissolved_solids (required)</li>
                <li>ec (required)</li>
                <li>dissolved_oxygen (optional)</li>
                <li>conductivity (optional)</li>
                <li>collector_name (optional)</li>
                <li>notes (optional)</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleImportData} disabled={!importFile}>
              <Check className="mr-2 h-4 w-4" />
              Import Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminData;
