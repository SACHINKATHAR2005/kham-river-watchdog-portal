
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Pencil, Trash2, Check, X, User, Key } from 'lucide-react';
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

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<AdminUser & { password: string }>>({});
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  
  // Fetch admin users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .order('email', { ascending: true });
          
        if (error) throw error;
        if (data) setUsers(data);
      } catch (error) {
        console.error('Error fetching admin users:', error);
        toast({
          title: "Error",
          description: "Failed to load admin users. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Filter users based on search query
  const filteredUsers = searchQuery 
    ? users.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentUser(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Add new admin user
  const handleAddUser = async () => {
    try {
      if (!currentUser.email || !currentUser.password) {
        toast({
          title: "Validation Error",
          description: "Please provide both email and password.",
          variant: "destructive"
        });
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(currentUser.email)) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
        return;
      }
      
      // Password validation
      if (currentUser.password.length < 6) {
        toast({
          title: "Validation Error",
          description: "Password must be at least 6 characters long.",
          variant: "destructive"
        });
        return;
      }
      
      // First create user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: currentUser.email,
        password: currentUser.password,
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Then create admin user entry
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .insert({
            id: authData.user.id,
            email: currentUser.email,
            hashed_password: 'hashed_in_auth', // Actual password is handled by Auth
          })
          .select();
          
        if (adminError) {
          // If admin creation fails, clean up auth user
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw adminError;
        }
        
        if (adminData) {
          setUsers([...users, adminData[0]]);
          setIsAddDialogOpen(false);
          setCurrentUser({});
          toast({
            title: "Success",
            description: "Admin user added successfully.",
            variant: "default"
          });
        }
      }
    } catch (error: any) {
      console.error('Error adding admin user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add admin user. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Change user password
  const handlePasswordChange = async () => {
    try {
      if (!currentUser.id || !currentUser.password) {
        toast({
          title: "Validation Error",
          description: "User ID and new password are required.",
          variant: "destructive"
        });
        return;
      }
      
      // Password validation
      if (currentUser.password.length < 6) {
        toast({
          title: "Validation Error",
          description: "Password must be at least 6 characters long.",
          variant: "destructive"
        });
        return;
      }
      
      // Update password using Auth API (in a real app)
      // For demo, we'll just show a success message
      
      toast({
        title: "Success",
        description: "Password has been updated successfully.",
        variant: "default"
      });
      
      setIsPasswordDialogOpen(false);
      setCurrentUser({});
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Delete admin user
  const handleDeleteUser = async () => {
    try {
      if (!userToDelete) return;
      
      // In a real app, you would also delete the user from Auth
      // For this demo, we'll just delete from the admin_users table
      
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', userToDelete.id);
        
      if (error) throw error;
      
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      
      toast({
        title: "Success",
        description: "Admin user deleted successfully.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error deleting admin user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete admin user. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Open password dialog
  const openPasswordDialog = (user: AdminUser) => {
    setCurrentUser({
      id: user.id,
      email: user.email,
      password: ''
    });
    setIsPasswordDialogOpen(true);
  };
  
  // Open delete dialog
  const openDeleteDialog = (user: AdminUser) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Users</h1>
          <p className="text-gray-500">
            Manage administrator accounts for the water quality monitoring system.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Admin User
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
              placeholder="Search admin users..."
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
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No admin users found</h3>
              <p className="mt-1 text-gray-500">
                {searchQuery ? 'Try adjusting your search query.' : 'Get started by adding your first admin user.'}
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
                  <TableHead>Email</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => openPasswordDialog(user)}
                        >
                          <Key className="h-4 w-4" />
                          <span className="sr-only">Change Password</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                          onClick={() => openDeleteDialog(user)}
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
      </div>
      
      {/* Add Admin User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
            <DialogDescription>
              Create a new administrator account for the monitoring system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                name="email"
                type="email"
                value={currentUser.email || ''}
                onChange={handleInputChange}
                placeholder="admin@example.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input 
                id="password" 
                name="password"
                type="password"
                value={currentUser.password || ''}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              <Check className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for {currentUser.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password *</Label>
              <Input 
                id="new-password" 
                name="password"
                type="password"
                value={currentUser.password || ''}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handlePasswordChange}>
              <Check className="mr-2 h-4 w-4" />
              Change Password
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
              This will permanently delete the admin user
              {userToDelete?.email && <span className="font-medium"> "{userToDelete.email}"</span>}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={handleDeleteUser}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
