import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  UserPlus, 
  Search, 
  Mail,
  Phone,
  Calendar,
  Eye,
  LayoutGrid,
  List,
  Table as TableIcon,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  MoreVertical,
  MapPin,
  GraduationCap
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ProspectStudent {
  id: string;
  formType: string;
  studentName: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  zoomEmail?: string;
  studentDOB?: string;
  studentAge?: string;
  studentGrade?: string;
  location?: string;
  country?: string;
  state?: string;
  zipCode?: string;
  demoTime?: string;
  previousOnlineClass?: string;
  status: string;
  notes?: string;
  emailSent?: boolean;
  formData?: Record<string, string>;
  partnerId?: string;
  createdAt: string;
  updatedAt: string;
}

type ViewMode = "table" | "grid" | "list";

export default function PartnerAdminProspectStudents() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem("partnerProspectsViewMode") as ViewMode) || "table";
  });
  const [selectedProspect, setSelectedProspect] = useState<ProspectStudent | null>(null);
  const [viewProspect, setViewProspect] = useState<ProspectStudent | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const { data: prospects = [], isLoading } = useQuery<ProspectStudent[]>({
    queryKey: ["/api/admin/prospect-students"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProspectStudent> }) => {
      return apiRequest("PATCH", `/api/admin/prospect-students/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-students"] });
      setSelectedProspect(null);
      toast({ title: "Prospect updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update prospect", description: error.message, variant: "destructive" });
    },
  });

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = 
      prospect.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prospect.parentName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (prospect.parentEmail?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (prospect.zoomEmail?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || prospect.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const newCount = prospects.filter(p => p.status === 'new').length;
  const contactedCount = prospects.filter(p => p.status === 'contacted').length;
  const convertedCount = prospects.filter(p => p.status === 'converted').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500">New</Badge>;
      case 'contacted':
        return <Badge className="bg-yellow-500">Contacted</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'converted':
        return <Badge className="bg-green-500">Converted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleView = (prospect: ProspectStudent) => {
    setViewProspect(prospect);
  };

  const handleEdit = (prospect: ProspectStudent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProspect(prospect);
    setEditNotes(prospect.notes || "");
    setEditStatus(prospect.status);
  };

  const handleSave = () => {
    if (!selectedProspect) return;
    updateMutation.mutate({
      id: selectedProspect.id,
      data: { status: editStatus, notes: editNotes }
    });
  };

  const renderActionMenu = (prospect: ProspectStudent) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleView(prospect); }}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleEdit(prospect, e as unknown as React.MouseEvent)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Prospect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            Prospect Students
          </h1>
          <p className="text-muted-foreground mt-1">Manage student inquiries and leads</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Prospects</p>
                <p className="text-2xl font-bold">{prospects.length}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New</p>
                <p className="text-2xl font-bold">{newCount}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contacted</p>
                <p className="text-2xl font-bold">{contactedCount}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Converted</p>
                <p className="text-2xl font-bold">{convertedCount}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search prospects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button 
            variant={viewMode === "table" ? "default" : "ghost"} 
            size="icon" 
            className="h-8 w-8"
            onClick={() => { setViewMode("table"); localStorage.setItem("partnerProspectsViewMode", "table"); }}
          >
            <TableIcon className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === "grid" ? "default" : "ghost"} 
            size="icon" 
            className="h-8 w-8"
            onClick={() => { setViewMode("grid"); localStorage.setItem("partnerProspectsViewMode", "grid"); }}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === "list" ? "default" : "ghost"} 
            size="icon" 
            className="h-8 w-8"
            onClick={() => { setViewMode("list"); localStorage.setItem("partnerProspectsViewMode", "list"); }}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {viewMode === "table" && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProspects.map(prospect => (
                <TableRow key={prospect.id} className="hover-elevate cursor-pointer" onClick={() => handleView(prospect)}>
                  <TableCell className="font-medium">
                    {prospect.studentName}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {(prospect.parentEmail || prospect.zoomEmail) && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {prospect.parentEmail || prospect.zoomEmail}
                        </div>
                      )}
                      {prospect.parentPhone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {prospect.parentPhone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {prospect.parentName ? (
                      <div>
                        <p className="text-sm">{prospect.parentName}</p>
                        {prospect.parentEmail && (
                          <p className="text-xs text-muted-foreground">{prospect.parentEmail}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(prospect.status)}</TableCell>
                  <TableCell>{formatDate(prospect.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {renderActionMenu(prospect)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProspects.map(prospect => (
            <Card key={prospect.id} className="hover-elevate cursor-pointer" onClick={() => handleView(prospect)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{prospect.studentName}</p>
                    {(prospect.parentEmail || prospect.zoomEmail) && (
                      <p className="text-sm text-muted-foreground">{prospect.parentEmail || prospect.zoomEmail}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(prospect.status)}
                    {renderActionMenu(prospect)}
                  </div>
                </div>
                {prospect.parentName && (
                  <div className="text-sm mb-3">
                    <p className="text-muted-foreground">Parent:</p>
                    <p>{prospect.parentName}</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-muted-foreground">{formatDate(prospect.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewMode === "list" && (
        <div className="space-y-2">
          {filteredProspects.map(prospect => (
            <Card key={prospect.id} className="hover-elevate cursor-pointer" onClick={() => handleView(prospect)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{prospect.studentName}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {(prospect.parentEmail || prospect.zoomEmail) && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {prospect.parentEmail || prospect.zoomEmail}
                          </span>
                        )}
                        {prospect.parentPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {prospect.parentPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(prospect.status)}
                    <span className="text-sm text-muted-foreground">{formatDate(prospect.createdAt)}</span>
                    {renderActionMenu(prospect)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredProspects.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No prospects found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filters" 
                : "No prospect students have been assigned to your partner organization yet"}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!viewProspect} onOpenChange={(open) => !open && setViewProspect(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Prospect Details</DialogTitle>
          </DialogHeader>
          {viewProspect && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{viewProspect.studentName}</h3>
                  {getStatusBadge(viewProspect.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {viewProspect.parentName && (
                  <div>
                    <p className="text-muted-foreground">Parent Name</p>
                    <p className="font-medium">{viewProspect.parentName}</p>
                  </div>
                )}
                {(viewProspect.parentEmail || viewProspect.zoomEmail) && (
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {viewProspect.parentEmail || viewProspect.zoomEmail}
                    </p>
                  </div>
                )}
                {viewProspect.parentPhone && (
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {viewProspect.parentPhone}
                    </p>
                  </div>
                )}
                {viewProspect.studentGrade && (
                  <div>
                    <p className="text-muted-foreground">Grade</p>
                    <p className="font-medium flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {viewProspect.studentGrade}
                    </p>
                  </div>
                )}
                {(viewProspect.state || viewProspect.country) && (
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {[viewProspect.state, viewProspect.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}
                {viewProspect.createdAt && (
                  <div>
                    <p className="text-muted-foreground">Registered</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(viewProspect.createdAt)}
                    </p>
                  </div>
                )}
              </div>

              {viewProspect.notes && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-sm mb-1">Notes</p>
                  <p className="text-sm">{viewProspect.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewProspect(null)}>Close</Button>
            <Button onClick={() => { 
              if (viewProspect) {
                handleEdit(viewProspect);
                setViewProspect(null);
              }
            }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Prospect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedProspect} onOpenChange={(open) => !open && setSelectedProspect(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Prospect</DialogTitle>
          </DialogHeader>
          {selectedProspect && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{selectedProspect.studentName}</p>
                {(selectedProspect.parentEmail || selectedProspect.zoomEmail) && (
                  <p className="text-sm text-muted-foreground">{selectedProspect.parentEmail || selectedProspect.zoomEmail}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this prospect..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProspect(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
