import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Building2, ArrowLeft, Edit, Trash2, Users, MapPin, Mail, Phone, Loader2,
  CheckCircle, XCircle, Calendar, User, GraduationCap, UserPlus, Globe,
  Clock, Shield, FileText, Settings
} from "lucide-react";

interface Partner {
  id: string;
  name: string;
  status: "active" | "inactive";
  state?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
  description?: string;
  createdAt: string;
}

interface PartnerUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

interface PartnerDetailsProps {
  partnerId: string;
}

export default function PartnerDetails({ partnerId }: PartnerDetailsProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    status: "active" as "active" | "inactive",
    state: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    country: "",
    description: "",
  });

  const { data: partner, isLoading } = useQuery<Partner>({
    queryKey: ["/api/partners", partnerId],
  });

  const { data: partnerUsers = [], isLoading: isLoadingUsers } = useQuery<PartnerUser[]>({
    queryKey: [`/api/partners/${partnerId}/users`],
    enabled: !!partnerId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("PATCH", `/api/partners/${partnerId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      setIsEditOpen(false);
      toast({ title: "Partner updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update partner", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/partners/${partnerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Partner deleted successfully" });
      navigate("/partners");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete partner", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = () => {
    if (partner) {
      setFormData({
        name: partner.name,
        status: partner.status,
        state: partner.state || "",
        contactEmail: partner.contactEmail || "",
        contactPhone: partner.contactPhone || "",
        address: partner.address || "",
        city: partner.city || "",
        country: partner.country || "",
        description: partner.description || "",
      });
      setIsEditOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "student": return "secondary";
      case "parent": return "outline";
      case "partner_admin": return "default";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg">Loading partner information...</div>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg mb-4">Partner not found</div>
          <Button onClick={() => navigate("/partners")}>
            Back to Partner Management
          </Button>
        </div>
      </div>
    );
  }

  const studentCount = partnerUsers.filter(u => u.role === "student").length;
  const parentCount = partnerUsers.filter(u => u.role === "parent").length;
  const partnerAdminCount = partnerUsers.filter(u => u.role === "partner_admin").length;

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
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#2FBF71]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/partners")}
                className="hover:bg-[#1F3A5F]/10 dark:hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5 text-[#1F3A5F] dark:text-white" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEdit}
                className="bg-[#1F3A5F]/10 border-[#1F3A5F]/20 text-[#1F3A5F] hover:bg-[#1F3A5F]/20 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20 h-9"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Partner
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this partner? This action cannot be undone.")) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
                className="bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20 h-9"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Card className="overflow-hidden">
          <div 
            className="h-48 bg-gradient-to-r from-primary/20 to-primary/10"
          />
          
          <CardContent className="p-6 pt-0">
            <div className="flex items-start gap-6">
              <div className={`w-32 h-32 -mt-16 rounded-xl border-4 border-card ring-2 ring-card-border flex items-center justify-center ${partner.status === 'active' ? 'bg-gradient-to-br from-primary to-primary/80' : 'bg-gradient-to-br from-muted to-muted/80'}`}>
                <Building2 className="w-16 h-16 text-white" />
              </div>
              
              <div className="flex-1 space-y-3 pt-4">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {partner.name}
                  </h2>
                  {(partner.city || partner.state || partner.country) && (
                    <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                      <MapPin className="w-4 h-4" />
                      {[partner.city, partner.state, partner.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={partner.status === "active" ? "default" : "destructive"}>
                    {partner.status === "active" ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                  </Badge>
                  {partner.createdAt && (
                    <Badge variant="outline">
                      Joined {format(new Date(partner.createdAt), "MMM d, yyyy")}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {partner.contactEmail && (
                    <Button size="sm" variant="outline">
                      <Mail className="w-4 h-4 mr-2" />
                      {partner.contactEmail}
                    </Button>
                  )}
                  {partner.contactPhone && (
                    <Button size="sm" variant="outline">
                      <Phone className="w-4 h-4 mr-2" />
                      {partner.contactPhone}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {partnerUsers.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
                <Users className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {studentCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Students</div>
                </div>
                <GraduationCap className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {parentCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Parents</div>
                </div>
                <User className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {partnerAdminCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Partner Admins</div>
                </div>
                <Shield className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20 flex-wrap">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Partner Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Partner ID</div>
                    <div className="font-medium font-mono text-xs">{partner.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="font-medium capitalize">{partner.status}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Partner Name</div>
                    <div className="font-medium">{partner.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="font-medium">
                      {partner.createdAt 
                        ? format(new Date(partner.createdAt), "MMM d, yyyy 'at' h:mm a")
                        : "N/A"
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Contact Email</div>
                    <div className="font-medium">{partner.contactEmail || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Contact Phone</div>
                    <div className="font-medium">{partner.contactPhone || "N/A"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div className="font-medium">{partner.address || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">City</div>
                    <div className="font-medium">{partner.city || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">State</div>
                    <div className="font-medium">{partner.state || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Country</div>
                    <div className="font-medium">{partner.country || "N/A"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {partner.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{partner.description}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Assigned Users ({partnerUsers.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-muted-foreground">Loading users...</p>
                  </div>
                ) : partnerUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No users assigned yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Assign users from the User Management page</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="h-8">
                          <TableHead className="py-1.5 px-2 text-xs">User</TableHead>
                          <TableHead className="py-1.5 px-2 text-xs">Email</TableHead>
                          <TableHead className="py-1.5 px-2 text-xs">Role</TableHead>
                          <TableHead className="py-1.5 px-2 text-xs">Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partnerUsers.map((user) => (
                          <TableRow 
                            key={user.id} 
                            className="h-10 cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/users/${user.id}`)}
                          >
                            <TableCell className="py-1.5 px-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-xs">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">
                                  {user.firstName} {user.lastName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-1.5 px-2 text-sm text-muted-foreground">
                              {user.email}
                            </TableCell>
                            <TableCell className="py-1.5 px-2">
                              <Badge variant={getRoleColor(user.role)} className="capitalize text-xs">
                                {user.role.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-1.5 px-2 text-sm text-muted-foreground">
                              {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Partner Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Partner settings will be available soon</p>
                  <p className="text-sm text-muted-foreground mt-1">Configure partner preferences and permissions</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Partner
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Partner Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contactEmail">Contact Email</Label>
                <Input
                  id="edit-contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contactPhone">Contact Phone</Label>
                <Input
                  id="edit-contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Input
                  id="edit-country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Update Partner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
