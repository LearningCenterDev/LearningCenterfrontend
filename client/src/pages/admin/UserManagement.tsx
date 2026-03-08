import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Users, Search, UserPlus, MoreVertical, Mail, Shield, Trash2, AlertTriangle, Upload, Send, CheckCircle2, Building2, Phone, ArrowUp, ArrowDown, GraduationCap, BookOpen } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, InsertUser } from "@shared/schema";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";
import { ViewModeToggle, type ViewMode } from "@/components/ViewModeToggle";

interface UserManagementProps {
  adminId: string;
}

// Add User Form Component with Tab Layout
function AddUserForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const { toast } = useToast();
  const [emailError, setEmailError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("basic");
  
  // Fetch all users to check for email uniqueness
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  
  // Create validation schema for form
  const baseFormSchema = insertUserSchema.extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Please enter a valid email address"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    subject: z.string().optional(),
    parentName: z.string().optional(),
    parentEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
    parentPhone: z.string().optional(),
    dateOfBirth: z.string().optional(),
  });
  
  const formSchema = baseFormSchema.superRefine((data, ctx) => {
    if (data.role === 'student') {
      const stateValue = data.state as string | undefined;
      const countryValue = data.country as string | undefined;
      if (!stateValue || stateValue.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "State is required for students",
          path: ['state'],
        });
      }
      if (!countryValue || countryValue.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Country is required for students",
          path: ['country'],
        });
      }
    }
  });

  // Create form with validation
  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      firstName: "",
      lastName: "",
      role: "student" as const,
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      subject: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      avatarUrl: "",
      profileImageUrl: "",
      dateOfBirth: "",
    },
  });

  // Watch role and email fields
  const selectedRole = form.watch("role");
  const emailValue = form.watch("email");
  
  // Revalidate email when role changes
  useEffect(() => {
    if (emailValue && selectedRole) {
      validateEmailUniqueness(emailValue, selectedRole);
    }
  }, [selectedRole, emailValue]);

  // Validate email uniqueness (all user account emails must be unique)
  const validateEmailUniqueness = (email: string, role: string) => {
    if (!email) {
      setEmailError("");
      return true;
    }
    
    // Check if email already exists (all user emails must be unique)
    const existingUser = allUsers.find(user => user.email?.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      setEmailError("This email is already registered in the system");
      return false;
    }
    
    setEmailError("");
    return true;
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create user");
      }
      
      return response.json();
    },
    onSuccess: (newUser: User) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      
      toast({
        title: "User created successfully",
        description: `${newUser.name || newUser.email} has been added to the system.`,
      });
      
      form.reset();
      setActiveTab("basic");
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Failed to create user:", error);
      toast({
        title: "Failed to create user",
        description: error.message || "An error occurred while creating the user.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // Validate email uniqueness before submission
    if (!validateEmailUniqueness(data.email, data.role)) {
      toast({
        title: "Email already exists",
        description: "This email is already registered. Please use a different email address.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that student and parent emails are different
    if (data.role === "student" && data.parentEmail && data.email) {
      if (data.parentEmail.toLowerCase() === data.email.toLowerCase()) {
        toast({
          title: "Same email not allowed",
          description: "Student and parent must have different email addresses.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Auto-generate name from first and last name if not provided
    if (!data.name && data.firstName && data.lastName) {
      data.name = `${data.firstName} ${data.lastName}`;
    }
    
    // Prepare the data based on role
    const cleanedData: any = {
      email: data.email,
      password: data.password,
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      phone: data.phone || null,
      address: data.address || null,
      avatarUrl: data.avatarUrl || null,
      profileImageUrl: data.profileImageUrl || null,
      subject: data.role === "teacher" && data.subject ? data.subject : null,
    };

    // Add location fields and date of birth for students (important for state adjustments on fees)
    if (data.role === "student") {
      cleanedData.city = data.city || null;
      cleanedData.state = data.state || null;
      cleanedData.zipCode = data.zipCode || null;
      cleanedData.country = data.country || null;
      cleanedData.dateOfBirth = data.dateOfBirth || null;
    }

    // Add parent information for students
    if (data.role === "student" && data.parentName && data.parentEmail) {
      cleanedData.parentInfo = {
        name: data.parentName,
        email: data.parentEmail,
        phone: data.parentPhone || null,
      };
    }
    
    createUserMutation.mutate(cleanedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20 flex-wrap w-full">
            <TabsTrigger 
              value="basic" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2 flex-1"
              data-testid="tab-basic"
            >
              <UserPlus className="w-4 h-4" />
              Basic Info
            </TabsTrigger>
            {selectedRole === "student" && (
              <TabsTrigger 
                value="parent" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2 flex-1"
                data-testid="tab-parent-info"
              >
                <Users className="w-4 h-4" />
                Parent Info
              </TabsTrigger>
            )}
            {selectedRole === "teacher" && (
              <TabsTrigger 
                value="teaching" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2 flex-1"
                data-testid="tab-teaching"
              >
                <BookOpen className="w-4 h-4" />
                Teaching
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="basic" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John" 
                        {...field} 
                        data-testid="input-first-name"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Doe" 
                        {...field} 
                        data-testid="input-last-name"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john.doe@example.com" 
                        {...field} 
                        data-testid="input-email"
                        value={field.value || ""}
                        onBlur={(e) => {
                          field.onBlur();
                          validateEmailUniqueness(e.target.value, selectedRole);
                        }}
                        className={emailError ? "border-destructive" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                    {emailError && (
                      <p className="text-sm text-destructive mt-1" data-testid="error-email-duplicate">
                        {emailError}
                      </p>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        data-testid="input-password"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+1 (555) 123-4567" 
                        {...field} 
                        data-testid="input-phone"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123 Main St" 
                        {...field} 
                        data-testid="input-address"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedRole === "student" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="New York" 
                            {...field} 
                            data-testid="input-city"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="NY" 
                            {...field} 
                            data-testid="input-state"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="10001" 
                            {...field} 
                            data-testid="input-zip-code"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="United States" 
                            {...field} 
                            data-testid="input-country"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            {...field} 
                            data-testid="input-date-of-birth"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="student">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          Student
                        </div>
                      </SelectItem>
                      <SelectItem value="parent">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Parent
                        </div>
                      </SelectItem>
                      <SelectItem value="teacher">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Teacher
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="parent" className="mt-4 space-y-4">
            <div className="p-4 border rounded-md bg-muted/30 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium">Parent/Guardian Information</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                If the parent email already exists, the student will be linked to that existing parent account. Otherwise, a new parent account will be created with the same password as the student.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="parentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Jane Doe" 
                          {...field} 
                          data-testid="input-parent-name"
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parentEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="jane.doe@example.com" 
                          {...field} 
                          data-testid="input-parent-email"
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="parentPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Phone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+1 (555) 987-6543" 
                        {...field} 
                        data-testid="input-parent-phone"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="teaching" className="mt-4 space-y-4">
            <div className="p-4 border rounded-md bg-muted/30 space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium">Teaching Information</h3>
              </div>
              
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Taught</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Mathematics, Science, History" 
                        {...field} 
                        data-testid="input-subject"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              form.reset();
              setActiveTab("basic");
              onCancel();
            }}
            data-testid="button-cancel-add-user"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createUserMutation.isPending}
            data-testid="button-submit-add-user"
          >
            {createUserMutation.isPending ? "Creating..." : `Create ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Permissions Dialog Component
function PermissionsDialog({ user, open, onOpenChange }: { user: User; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState({
    canManageCourses: user.role === 'admin' || user.role === 'teacher',
    canViewReports: user.role === 'admin' || user.role === 'teacher' || user.role === 'parent',
    canManageUsers: user.role === 'admin',
    canAccessFinancials: user.role === 'admin',
    canSendMessages: true,
  });

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.name || user.email || 'Unnamed User';

  const handleSave = () => {
    toast({
      title: "Permissions updated",
      description: `Permissions for ${displayName} have been updated successfully.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <DialogDescription>
            Configure permissions for {displayName} ({user.role})
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Manage Courses</h4>
              <p className="text-xs text-muted-foreground">Create and edit courses</p>
            </div>
            <Switch 
              checked={permissions.canManageCourses}
              onCheckedChange={(checked) => setPermissions({...permissions, canManageCourses: checked})}
              data-testid="switch-manage-courses"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">View Reports</h4>
              <p className="text-xs text-muted-foreground">Access analytics and reports</p>
            </div>
            <Switch 
              checked={permissions.canViewReports}
              onCheckedChange={(checked) => setPermissions({...permissions, canViewReports: checked})}
              data-testid="switch-view-reports"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Manage Users</h4>
              <p className="text-xs text-muted-foreground">Add, edit, and remove users</p>
            </div>
            <Switch 
              checked={permissions.canManageUsers}
              onCheckedChange={(checked) => setPermissions({...permissions, canManageUsers: checked})}
              data-testid="switch-manage-users"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Access Financials</h4>
              <p className="text-xs text-muted-foreground">View financial reports and payments</p>
            </div>
            <Switch 
              checked={permissions.canAccessFinancials}
              onCheckedChange={(checked) => setPermissions({...permissions, canAccessFinancials: checked})}
              data-testid="switch-access-financials"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Send Messages</h4>
              <p className="text-xs text-muted-foreground">Send messages to other users</p>
            </div>
            <Switch 
              checked={permissions.canSendMessages}
              onCheckedChange={(checked) => setPermissions({...permissions, canSendMessages: checked})}
              data-testid="switch-send-messages"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save-permissions">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UserManagement({ adminId }: UserManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("adminUserManagementViewMode");
      return (saved as ViewMode) || "table";
    }
    return "table";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"default" | "asc" | "desc">("default");
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [showSendNotifications, setShowSendNotifications] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Save view mode preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("adminUserManagementViewMode", viewMode);
    }
  }, [viewMode]);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Query for users with birthdays today
  const { data: birthdayData } = useQuery<{ birthdayUserIds: string[]; date: string }>({
    queryKey: ["/api/users/birthdays/today"],
    staleTime: 60 * 60 * 1000, // 1 hour - birthday data doesn't change frequently
  });

  const birthdayUserIds = new Set(birthdayData?.birthdayUserIds || []);

  // Helper function to check if user has birthday today
  const hasBirthdayToday = (userId: string) => birthdayUserIds.has(userId);

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Failed to delete user");
      }
      
      // 204 No Content - no response body
      return null;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      toast({
        title: "User deleted",
        description: "The user has been successfully removed from the system.",
      });
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete user",
        description: error.message || "An error occurred while deleting the user.",
        variant: "destructive",
      });
    },
  });

  const handleMessageUser = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/messages?user=${user.id}`);
  };

  const handleOpenPermissions = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUserForPermissions(user);
  };

  const handleDeleteUser = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserToDelete(user);
  };

  const filteredUsers = users
    .filter(user => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || 
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower));
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      if (sortOrder === "default") return 0;
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'teacher': return 'default';
      case 'parent': return 'outline';
      case 'student': return 'secondary';
      default: return 'default';
    }
  };

  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || user.email || 'Unnamed User';
  };

  const getInitials = (user: User) => {
    const first = user.firstName?.trim();
    const last = user.lastName?.trim();
    if (first && last) {
      return `${first[0]}${last[0]}`.toUpperCase();
    }
    if (user.name?.trim()) {
      return user.name.trim().split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    return '?';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="bg-gradient-to-r from-[#1F3A5F]/10 via-[#1F3A5F]/5 to-[#2a4a75]/5 relative overflow-hidden border-b border-[#1F3A5F]/10">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, #1F3A5F 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
          <Skeleton className="h-8 w-48 bg-[#1F3A5F]/10 dark:bg-white/20 mb-2" />
          <Skeleton className="h-4 w-32 bg-[#1F3A5F]/5 dark:bg-white/10" />
        </div>
      </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-16 mb-3" />
                  <Skeleton className="h-8 w-12 mb-1" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const usersByRole = {
    admin: users.filter(u => u.role === 'admin').length,
    teacher: users.filter(u => u.role === 'teacher').length,
    parent: users.filter(u => u.role === 'parent').length,
    student: users.filter(u => u.role === 'student').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" data-testid="user-management-page">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#1F3A5F]/10 via-[#1F3A5F]/5 to-[#2a4a75]/5 relative overflow-hidden border-b border-[#1F3A5F]/10">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, #1F3A5F 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#2FBF71]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#1F3A5F]/10 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white">User Management</h1>
              </div>
              <p className="text-[#1F3A5F]/60 dark:text-white/60 text-sm sm:text-base flex items-center gap-2">
                Manage all platform users
                <Badge className="bg-[#1F3A5F]/10 text-[#1F3A5F] dark:bg-white/20 dark:text-white border-0" data-testid="total-users">
                  {users.length} total
                </Badge>
              </p>
            </div>
            <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
              <DialogTrigger asChild>
                <Button className="bg-[#2FBF71] hover:bg-[#27a862] text-white shadow-lg" data-testid="button-add-user">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] sm:min-h-[520px]">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <AddUserForm onSuccess={() => setShowAddUser(false)} onCancel={() => setShowAddUser(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* User Statistics */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500/5 to-transparent hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-slate-500">Students</span>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600" data-testid="stat-students">
                {usersByRole.student}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500/5 to-transparent hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-slate-500">Teachers</span>
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-600" data-testid="stat-teachers">
                {usersByRole.teacher}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-[#2FBF71]/5 to-transparent hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-slate-500">Parents</span>
                <div className="p-2 rounded-lg bg-[#2FBF71]/10">
                  <Users className="w-4 h-4 text-[#2FBF71]" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#2FBF71]" data-testid="stat-parents">
                {usersByRole.parent}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-[#1F3A5F]/5 to-transparent hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-slate-500">Admins</span>
                <div className="p-2 rounded-lg bg-[#1F3A5F]/10">
                  <Shield className="w-4 h-4 text-[#1F3A5F]" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#1F3A5F]" data-testid="stat-admins">
                {usersByRole.admin}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                  data-testid="search-users"
                />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-1 flex-wrap">
                  {['all', 'student', 'teacher', 'parent', 'admin'].map((role) => (
                    <Button
                      key={role}
                      variant={roleFilter === role ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setRoleFilter(role)}
                      data-testid={`filter-${role}`}
                      className={`h-9 rounded-lg ${roleFilter === role ? 'bg-[#1F3A5F] hover:bg-[#2a4a75]' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 border-l pl-2 ml-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (sortOrder === "default") setSortOrder("asc");
                      else if (sortOrder === "asc") setSortOrder("desc");
                      else setSortOrder("default");
                    }}
                    data-testid="button-sort"
                    className="h-9 w-9 p-0 rounded-lg"
                    title={sortOrder === "default" ? "Sort ascending" : sortOrder === "asc" ? "Sort descending" : "Remove sorting"}
                  >
                    {sortOrder === "asc" && <ArrowUp className="w-4 h-4" />}
                    {sortOrder === "desc" && <ArrowDown className="w-4 h-4" />}
                    {sortOrder === "default" && <ArrowDown className="w-4 h-4 opacity-40" />}
                  </Button>
                  <ViewModeToggle 
                    currentMode={viewMode}
                    onModeChange={setViewMode}
                    availableModes={["table", "grid", "list"]}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="w-[250px]">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[150px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Users Display - Multiple View Modes */}
      {!isLoading && filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || roleFilter !== "all" ? "No users found" : "No users in system"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || roleFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Start by adding users to the system."
              }
            </p>
            <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-first-user">
                  Add First User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] sm:min-h-[520px]">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <AddUserForm onSuccess={() => setShowAddUser(false)} onCancel={() => setShowAddUser(false)} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Table View */}
          {viewMode === "table" && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="w-[200px]">Name</TableHead>
                      <TableHead className="w-[250px]">Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[150px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow 
                        key={user.id}
                        data-testid={`user-${user.id}`}
                        className="hover:bg-muted/50 cursor-pointer relative"
                        onClick={() => navigate(`/users/${user.id}`)}
                      >
                        <TableCell>
                          <div className="relative">
                            {user.role === 'student' && hasBirthdayToday(user.id) && (
                              <>
                                <div className="absolute -inset-1 rounded-full birthday-glow" />
                                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
                                  <span className="text-[8px] font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white px-1.5 py-0.5 rounded-full birthday-text-glow">
                                    Birthday
                                  </span>
                                </div>
                              </>
                            )}
                            <Avatar className={`w-8 h-8 ${user.role === 'student' && hasBirthdayToday(user.id) ? 'ring-2 ring-pink-500 birthday-ring' : ''}`}>
                              <AvatarImage src={user.avatarUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(user)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {getDisplayName(user)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleColor(user.role)} className={`text-xs ${user.role === 'teacher' ? 'bg-purple-600 text-white' : ''}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.phone || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.createdAt 
                            ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMessageUser(user, e);
                              }}
                              data-testid={`button-message-${user.id}`}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`button-menu-${user.id}`}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/users/${user.id}`)}
                                  data-testid={`menu-view-${user.id}`}
                                >
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPermissions(user, e);
                                  }}
                                  data-testid={`menu-permissions-${user.id}`}
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  Manage Permissions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteUser(user, e);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                  data-testid={`menu-delete-${user.id}`}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredUsers.map((user) => (
                <Card 
                  key={user.id}
                  className="hover-elevate cursor-pointer transition-all relative overflow-hidden"
                  onClick={() => navigate(`/users/${user.id}`)}
                  data-testid={`user-card-${user.id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="relative">
                        {user.role === 'student' && hasBirthdayToday(user.id) && (
                          <>
                            <div className="absolute -inset-2 rounded-full birthday-glow" />
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
                              <span className="text-[10px] font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-0.5 rounded-full birthday-text-glow">
                                Birthday
                              </span>
                            </div>
                          </>
                        )}
                        <Avatar className={`w-16 h-16 ${user.role === 'student' && hasBirthdayToday(user.id) ? 'ring-3 ring-pink-500 birthday-ring' : ''}`}>
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="space-y-1 w-full">
                        <h3 className="font-semibold line-clamp-1" data-testid={`user-name-${user.id}`}>
                          {getDisplayName(user)}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {user.email}
                        </p>
                      </div>

                      <Badge variant={getRoleColor(user.role)} className={`text-xs ${user.role === 'teacher' ? 'bg-purple-600 text-white' : ''}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>

                      {(user.phone || user.address) && (
                        <div className="w-full pt-2 border-t space-y-1">
                          {user.phone && (
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              <span className="line-clamp-1">{user.phone}</span>
                            </div>
                          )}
                          {user.address && (
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                              <Building2 className="w-3 h-3" />
                              <span className="line-clamp-1">{user.address}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-1 w-full pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMessageUser(user, e);
                          }}
                          data-testid={`button-message-${user.id}`}
                        >
                          <Mail className="w-3 h-3 mr-1" />
                          Message
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`button-menu-${user.id}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => navigate(`/users/${user.id}`)}
                              data-testid={`menu-view-${user.id}`}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPermissions(user, e);
                              }}
                              data-testid={`menu-permissions-${user.id}`}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Manage Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user, e);
                              }}
                              className="text-destructive focus:text-destructive"
                              data-testid={`menu-delete-${user.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  className="hover-elevate cursor-pointer transition-all relative overflow-hidden"
                  onClick={() => navigate(`/users/${user.id}`)}
                  data-testid={`user-list-${user.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {user.role === 'student' && hasBirthdayToday(user.id) && (
                          <>
                            <div className="absolute -inset-1.5 rounded-full birthday-glow" />
                            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
                              <span className="text-[9px] font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white px-1.5 py-0.5 rounded-full birthday-text-glow">
                                Birthday
                              </span>
                            </div>
                          </>
                        )}
                        <Avatar className={`w-12 h-12 ${user.role === 'student' && hasBirthdayToday(user.id) ? 'ring-2 ring-pink-500 birthday-ring' : ''}`}>
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold truncate" data-testid={`user-name-${user.id}`}>
                            {getDisplayName(user)}
                          </h3>
                          <Badge variant={getRoleColor(user.role)} className={`text-xs ${user.role === 'teacher' ? 'bg-purple-600 text-white' : ''}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="truncate">{user.email}</span>
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </span>
                          )}
                          {user.createdAt && (
                            <span className="text-xs">
                              Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric'
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMessageUser(user, e);
                          }}
                          data-testid={`button-message-${user.id}`}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`button-menu-${user.id}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => navigate(`/users/${user.id}`)}
                              data-testid={`menu-view-${user.id}`}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPermissions(user, e);
                              }}
                              data-testid={`menu-permissions-${user.id}`}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Manage Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user, e);
                              }}
                              className="text-destructive focus:text-destructive"
                              data-testid={`menu-delete-${user.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      </div>

      {/* Permissions Dialog */}
      {selectedUserForPermissions && (
        <PermissionsDialog 
          user={selectedUserForPermissions}
          open={!!selectedUserForPermissions}
          onOpenChange={(open) => !open && setSelectedUserForPermissions(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will permanently remove:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>User account and profile</li>
              <li>All associated data</li>
              <li>Access to the platform</li>
            </ul>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setUserToDelete(null)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Bulk Import Users
            </DialogTitle>
            <DialogDescription>
              Import multiple users from a CSV file. Download the template to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Drop CSV file here or click to upload</p>
              <p className="text-xs text-muted-foreground mb-3">Maximum file size: 5MB</p>
              <Input
                type="file"
                accept=".csv"
                className="max-w-xs mx-auto"
                data-testid="input-csv-upload"
              />
            </div>
            <div className="bg-accent/50 p-3 rounded-md">
              <p className="text-xs text-muted-foreground mb-2">CSV Format:</p>
              <code className="text-xs">firstName,lastName,email,role,phone</code>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkImport(false)}>
              Cancel
            </Button>
            <Button data-testid="button-confirm-import">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Import Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Management Dialog */}
      <Dialog open={showRoleManagement} onOpenChange={setShowRoleManagement}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Bulk Role Management
            </DialogTitle>
            <DialogDescription>
              Change roles for multiple users at once. Select users and assign a new role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-role">New Role</Label>
              <Select>
                <SelectTrigger id="new-role" data-testid="select-new-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto">
              <p className="text-sm font-medium mb-2">Select Users ({filteredUsers.length} total)</p>
              <div className="space-y-2">
                {filteredUsers.slice(0, 10).map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox id={`role-user-${user.id}`} data-testid={`checkbox-role-${user.id}`} />
                    <Label 
                      htmlFor={`role-user-${user.id}`} 
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {getDisplayName(user)} <span className="text-muted-foreground">({user.role})</span>
                    </Label>
                  </div>
                ))}
                {filteredUsers.length > 10 && (
                  <p className="text-xs text-muted-foreground">
                    and {filteredUsers.length - 10} more...
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleManagement(false)}>
              Cancel
            </Button>
            <Button data-testid="button-confirm-role-change">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Update Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notifications Dialog */}
      <Dialog open={showSendNotifications} onOpenChange={setShowSendNotifications}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Send Notifications
            </DialogTitle>
            <DialogDescription>
              Send a broadcast message to selected users or groups.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="recipient-group">Recipients</Label>
              <Select>
                <SelectTrigger id="recipient-group" data-testid="select-recipients">
                  <SelectValue placeholder="Select recipient group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="students">All Students</SelectItem>
                  <SelectItem value="parents">All Parents</SelectItem>
                  <SelectItem value="teachers">All Teachers</SelectItem>
                  <SelectItem value="admins">All Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notification-subject">Subject</Label>
              <Input 
                id="notification-subject" 
                placeholder="Enter message subject"
                data-testid="input-notification-subject"
              />
            </div>
            <div>
              <Label htmlFor="notification-message">Message</Label>
              <Textarea 
                id="notification-message" 
                placeholder="Type your message here..."
                className="min-h-[120px]"
                data-testid="textarea-notification-message"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="send-email" data-testid="checkbox-send-email" />
              <Label htmlFor="send-email" className="text-sm font-normal cursor-pointer">
                Also send as email notification
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendNotifications(false)}>
              Cancel
            </Button>
            <Button data-testid="button-confirm-send-notification">
              <Send className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}