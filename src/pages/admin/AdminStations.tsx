
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Pencil, Trash2, Check, X, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogTrigger,
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

interface Station {
  id: string;
  name: string;
  number: string;
  frequency: string;
  status: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_person: string | null;
  installation_date: string | null;
  created_at: string;
  updated_at: string | null;
}

const defaultStation = {
  name: '',
  number: '',
  frequency: '',
  status: 'active',
  description: '',
  latitude: null,
  longitude: null,
  contact_person: '',
  installation_date: null,
};

const AdminStations = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentStation, setCurrentStation] = useState<Partial<Station>>(defaultStation);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);
  
  // Fetch stations
  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('stations')
          .select('*')
          .order('name', { ascending: true });
          
        if (error) throw error;
        if (data) setStations(data);
      } catch (error) {
        console.error('Error fetching stations:', error);
        toast({
          title: "Error",
          description: "Failed to load stations. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStations();
  }, []);
  
  // Filter stations based on search query
  const filteredStations = searchQuery 
    ? stations.filter(station => 
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (station.description && station.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : stations;
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentStation(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setCurrentStation(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Add new station
  const handleAddStation = async () => {
    try {
      if (!currentStation.name || !currentStation.number || !currentStation.frequency) {
        toast({
          title: "Validation Error",
          description: "Please fill out all required fields.",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('stations')
        .insert({
          name: currentStation.name,
          number: currentStation.number,
          frequency: currentStation.frequency,
          status: currentStation.status || 'active',
          description: currentStation.description || null,
          latitude: currentStation.latitude || null,
          longitude: currentStation.longitude || null,
          contact_person: currentStation.contact_person || null,
          installation_date: currentStation.installation_date || null,
        })
        .select();
        
      if (error) throw error;
      
      if (data) {
        setStations([...stations, data[0]]);
        setIsAddDialogOpen(false);
        setCurrentStation(defaultStation);
        toast({
          title: "Success",
          description: "Station added successfully.",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error('Error adding station:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add station. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Update station
  const handleUpdateStation = async () => {
    try {
      if (!currentStation.id || !currentStation.name || !currentStation.number || !currentStation.frequency) {
        toast({
          title: "Validation Error",
          description: "Please fill out all required fields.",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('stations')
        .update({
          name: currentStation.name,
          number: currentStation.number,
          frequency: currentStation.frequency,
          status: currentStation.status || 'active',
          description: currentStation.description || null,
          latitude: currentStation.latitude || null,
          longitude: currentStation.longitude || null,
          contact_person: currentStation.contact_person || null,
          installation_date: currentStation.installation_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentStation.id)
        .select();
        
      if (error) throw error;
      
      if (data) {
        setStations(stations.map(station => 
          station.id === currentStation.id ? data[0] : station
        ));
        setIsEditDialogOpen(false);
        setCurrentStation(defaultStation);
        toast({
          title: "Success",
          description: "Station updated successfully.",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error('Error updating station:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update station. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Delete station
  const handleDeleteStation = async () => {
    try {
      if (!stationToDelete) return;
      
      // Check if the station has associated water quality readings
      const { count } = await supabase
        .from('water_quality')
        .select('*', { count: 'exact' })
        .eq('station_id', stationToDelete.id);
        
      if (count && count > 0) {
        toast({
          title: "Cannot Delete",
          description: `This station has ${count} water quality readings associated with it. Delete the readings first.`,
          variant: "destructive"
        });
        setIsDeleteDialogOpen(false);
        setStationToDelete(null);
        return;
      }
      
      const { error } = await supabase
        .from('stations')
        .delete()
        .eq('id', stationToDelete.id);
        
      if (error) throw error;
      
      setStations(stations.filter(station => station.id !== stationToDelete.id));
      setIsDeleteDialogOpen(false);
      setStationToDelete(null);
      toast({
        title: "Success",
        description: "Station deleted successfully.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error deleting station:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete station. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Open edit dialog
  const openEditDialog = (station: Station) => {
    setCurrentStation({
      id: station.id,
      name: station.name,
      number: station.number,
      frequency: station.frequency,
      status: station.status,
      description: station.description || '',
      latitude: station.latitude,
      longitude: station.longitude,
      contact_person: station.contact_person || '',
      installation_date: station.installation_date,
    });
    setIsEditDialogOpen(true);
  };
  
  // Open delete dialog
  const openDeleteDialog = (station: Station) => {
    setStationToDelete(station);
    setIsDeleteDialogOpen(true);
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoring Stations</h1>
          <p className="text-gray-500">
            Manage your water quality monitoring stations.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => {
            setCurrentStation(defaultStation);
            setIsAddDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Station
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search stations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No stations found</h3>
              <p className="mt-1 text-gray-500">
                {searchQuery ? 'Try adjusting your search query.' : 'Get started by adding your first monitoring station.'}
              </p>
              {searchQuery && (
                <Button variant="outline" className="mt-4" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Station ID</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStations.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">{station.name}</TableCell>
                    <TableCell>{station.number}</TableCell>
                    <TableCell>{station.frequency}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${station.status === 'active' ? 'bg-green-100 text-green-800' :
                        station.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                        station.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`
                      }>
                        {station.status || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {station.latitude && station.longitude 
                        ? `${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}`
                        : 'Not specified'}
                    </TableCell>
                    <TableCell>
                      {station.contact_person || 'Not specified'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => openEditDialog(station)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                          onClick={() => openDeleteDialog(station)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          asChild
                        >
                          <Link to={`/station/${station.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
      
      {/* Add Station Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Station</DialogTitle>
            <DialogDescription>
              Create a new monitoring station for water quality data collection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Station Name *</Label>
                <Input 
                  id="name" 
                  name="name"
                  value={currentStation.name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter station name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="number">Station ID *</Label>
                  <Input 
                    id="number" 
                    name="number"
                    value={currentStation.number || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., KHAM001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Input 
                    id="frequency" 
                    name="frequency"
                    value={currentStation.frequency || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 102.5 MHz"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input 
                    id="latitude" 
                    name="latitude"
                    type="number"
                    step="0.0001"
                    value={currentStation.latitude || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 19.8563"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input 
                    id="longitude" 
                    name="longitude"
                    type="number"
                    step="0.0001"
                    value={currentStation.longitude || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 99.1234"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={currentStation.status || 'active'}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input 
                  id="contact_person" 
                  name="contact_person"
                  value={currentStation.contact_person || ''}
                  onChange={handleInputChange}
                  placeholder="Enter contact person's name"
                />
              </div>
              
              <div>
                <Label htmlFor="installation_date">Installation Date</Label>
                <Input 
                  id="installation_date" 
                  name="installation_date"
                  type="date"
                  value={currentStation.installation_date || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  name="description"
                  value={currentStation.description || ''}
                  onChange={handleInputChange}
                  placeholder="Enter station description"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleAddStation}>
              <Check className="mr-2 h-4 w-4" />
              Add Station
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Station Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Station</DialogTitle>
            <DialogDescription>
              Update the details for this monitoring station.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="edit-name">Station Name *</Label>
                <Input 
                  id="edit-name" 
                  name="name"
                  value={currentStation.name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter station name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-number">Station ID *</Label>
                  <Input 
                    id="edit-number" 
                    name="number"
                    value={currentStation.number || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., KHAM001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-frequency">Frequency *</Label>
                  <Input 
                    id="edit-frequency" 
                    name="frequency"
                    value={currentStation.frequency || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 102.5 MHz"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-latitude">Latitude</Label>
                  <Input 
                    id="edit-latitude" 
                    name="latitude"
                    type="number"
                    step="0.0001"
                    value={currentStation.latitude || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 19.8563"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-longitude">Longitude</Label>
                  <Input 
                    id="edit-longitude" 
                    name="longitude"
                    type="number"
                    step="0.0001"
                    value={currentStation.longitude || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 99.1234"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={currentStation.status || 'active'}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-contact_person">Contact Person</Label>
                <Input 
                  id="edit-contact_person" 
                  name="contact_person"
                  value={currentStation.contact_person || ''}
                  onChange={handleInputChange}
                  placeholder="Enter contact person's name"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-installation_date">Installation Date</Label>
                <Input 
                  id="edit-installation_date" 
                  name="installation_date"
                  type="date"
                  value={currentStation.installation_date || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input 
                  id="edit-description" 
                  name="description"
                  value={currentStation.description || ''}
                  onChange={handleInputChange}
                  placeholder="Enter station description"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleUpdateStation}>
              <Check className="mr-2 h-4 w-4" />
              Update Station
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
              This will permanently delete the monitoring station
              {stationToDelete?.name && <span className="font-medium"> "{stationToDelete.name}"</span>}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={handleDeleteStation}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminStations;
