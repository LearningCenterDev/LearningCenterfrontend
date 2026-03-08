import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, Plus, Pencil, Trash2, Users, MapPin, Mail, Phone, Loader2, 
  MoreVertical, Eye, Grid3X3, List, LayoutGrid, Search, Filter,
  CheckCircle, XCircle, Globe, Calendar
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

type ViewMode = "table" | "grid" | "list";

export default function PartnerManagement() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem("partnerViewMode") as ViewMode) || "grid";
  });
  
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
    adminEmail: "",
    adminPassword: "",
  });

  useEffect(() => {
    localStorage.setItem("partnerViewMode", viewMode);
  }, [viewMode]);

  const { data: partners = [], isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.state?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || partner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/partners", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Partner created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create partner", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return apiRequest("PATCH", `/api/partners/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      setEditingPartner(null);
      resetForm();
      toast({ title: "Partner updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update partner", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/partners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Partner deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete partner", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      status: "active",
      state: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      city: "",
      country: "",
      description: "",
      adminEmail: "",
      adminPassword: "",
    });
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
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
      adminEmail: "",
      adminPassword: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPartner) {
      updateMutation.mutate({ id: editingPartner.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setIsCreateOpen(false);
    setEditingPartner(null);
    resetForm();
  };

  const handleCardClick = (partnerId: string) => {
    navigate(`/partners/${partnerId}`);
  };

  const activeCount = partners.filter(p => p.status === "active").length;
  const inactiveCount = partners.filter(p => p.status === "inactive").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderPartnerForm = (isEdit: boolean = false) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={isEdit ? "edit-name" : "name"}>Partner Name *</Label>
          <Input
            id={isEdit ? "edit-name" : "name"}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Learning Center Name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={isEdit ? "edit-status" : "status"}>Status</Label>
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
          <Label htmlFor={isEdit ? "edit-contactEmail" : "contactEmail"}>Contact Email</Label>
          <Input
            id={isEdit ? "edit-contactEmail" : "contactEmail"}
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            placeholder="contact@partner.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={isEdit ? "edit-contactPhone" : "contactPhone"}>Contact Phone</Label>
          <Input
            id={isEdit ? "edit-contactPhone" : "contactPhone"}
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            placeholder="+1 234 567 8900"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={isEdit ? "edit-city" : "city"}>City</Label>
          <Input
            id={isEdit ? "edit-city" : "city"}
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="City"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={isEdit ? "edit-state" : "state"}>State</Label>
          <Input
            id={isEdit ? "edit-state" : "state"}
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="State/Province"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={isEdit ? "edit-country" : "country"}>Country</Label>
          <Input
            id={isEdit ? "edit-country" : "country"}
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="Country"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-address" : "address"}>Address</Label>
        <Input
          id={isEdit ? "edit-address" : "address"}
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Full address"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-description" : "description"}>Description</Label>
        <Textarea
          id={isEdit ? "edit-description" : "description"}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the partner..."
          rows={3}
        />
      </div>
      {!isEdit && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium">Partner Admin Account</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            A partner admin account will be created automatically with these credentials. The admin can change their password later.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email *</Label>
              <Input
                id="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                placeholder="admin@partner.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Admin Password *</Label>
              <Input
                id="adminPassword"
                type="password"
                value={formData.adminPassword}
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                placeholder="Temporary password"
                required
              />
            </div>
          </div>
        </div>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {isEdit ? "Update Partner" : "Create Partner"}
        </Button>
      </DialogFooter>
    </form>
  );

  const ActionMenu = ({ partner }: { partner: Partner }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/partners/${partner.id}`); }}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(partner); }}>
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-destructive focus:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this partner?")) {
              deleteMutation.mutate(partner.id);
            }
          }}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const GridCard = ({ partner }: { partner: Partner }) => (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
      onClick={() => handleCardClick(partner.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${partner.status === 'active' ? 'bg-primary/10' : 'bg-muted'}`}>
              <Building2 className={`w-5 h-5 ${partner.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold line-clamp-1">{partner.name}</CardTitle>
              <Badge variant={partner.status === "active" ? "default" : "destructive"} className="mt-1 text-xs">
                {partner.status === "active" ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                {partner.status}
              </Badge>
            </div>
          </div>
          <ActionMenu partner={partner} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(partner.city || partner.state || partner.country) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{[partner.city, partner.state, partner.country].filter(Boolean).join(", ")}</span>
          </div>
        )}
        {partner.contactEmail && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{partner.contactEmail}</span>
          </div>
        )}
        {partner.contactPhone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>{partner.contactPhone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="w-3 h-3" />
          <span>Added {new Date(partner.createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );

  const ListCard = ({ partner }: { partner: Partner }) => (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
      onClick={() => handleCardClick(partner.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${partner.status === 'active' ? 'bg-primary/10' : 'bg-muted'}`}>
              <Building2 className={`w-5 h-5 ${partner.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{partner.name}</h3>
                <Badge variant={partner.status === "active" ? "default" : "destructive"} className="text-xs flex-shrink-0">
                  {partner.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                {(partner.city || partner.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[partner.city, partner.state].filter(Boolean).join(", ")}
                  </span>
                )}
                {partner.contactEmail && (
                  <span className="flex items-center gap-1 hidden sm:flex">
                    <Mail className="w-3 h-3" />
                    {partner.contactEmail}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden md:block">
              {new Date(partner.createdAt).toLocaleDateString()}
            </span>
            <ActionMenu partner={partner} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
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
                  <Building2 className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white">Partner Management</h1>
              </div>
              <p className="text-[#1F3A5F]/60 dark:text-white/60 text-sm sm:text-base flex items-center gap-2">
                Manage learning center partners and affiliates
                <Badge className="bg-[#1F3A5F]/10 text-[#1F3A5F] dark:bg-white/20 dark:text-white border-0">
                  {partners.length} total
                </Badge>
              </p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="bg-[#2FBF71] hover:bg-[#27a862] text-white shadow-lg gap-2">
                  <Plus className="w-4 h-4" />
                  Add Partner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Add New Partner
                  </DialogTitle>
                </DialogHeader>
                {renderPartnerForm(false)}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-[#1F3A5F]/5 to-transparent hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-slate-500">Total Partners</span>
                <div className="p-2 rounded-lg bg-[#1F3A5F]/10">
                  <Building2 className="w-4 h-4 text-[#1F3A5F]" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#1F3A5F]">
                {partners.length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-[#2FBF71]/5 to-transparent hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-slate-500">Active</span>
                <div className="p-2 rounded-lg bg-[#2FBF71]/10">
                  <CheckCircle className="w-4 h-4 text-[#2FBF71]" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#2FBF71]">
                {activeCount}
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-red-500/5 to-transparent hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-slate-500">Inactive</span>
                <div className="p-2 rounded-lg bg-red-500/10">
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-red-500">
                {inactiveCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search partners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 px-3"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 px-3"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-3"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredPartners.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No partners found</p>
              <p className="text-sm mt-1">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filter" 
                  : "Add your first partner to get started"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPartners.map((partner) => (
            <GridCard key={partner.id} partner={partner} />
          ))}
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {filteredPartners.map((partner) => (
            <ListCard key={partner.id} partner={partner} />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow 
                  key={partner.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleCardClick(partner.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {partner.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={partner.status === "active" ? "default" : "destructive"}>
                      {partner.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {partner.city || partner.state ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {[partner.city, partner.state].filter(Boolean).join(", ")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {partner.contactEmail && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{partner.contactEmail}</span>
                        </div>
                      )}
                      {!partner.contactEmail && <span className="text-muted-foreground">-</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(partner.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionMenu partner={partner} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

        <Dialog open={!!editingPartner} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5" />
                Edit Partner
              </DialogTitle>
            </DialogHeader>
            {renderPartnerForm(true)}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
