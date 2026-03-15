import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  MessageSquare, 
  ArrowUpDown,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Eye,
  List,
  Grid3x3,
  LayoutList,
  Sparkles,
  PhoneCall,
  CalendarCheck,
  UserCheck,
  TrendingUp,
  MapPin,
  Building2,
  Link2
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ProspectStudentsProps {
  adminId: string;
}

interface Partner {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

interface ProspectStudent {
  id: string;
  formType: string;
  studentName: string;
  parentName: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  zoomEmail: string | null;
  studentDOB: string | null;
  studentAge: string | null;
  studentGrade: string | null;
  location: string | null;
  country: string | null;
  state: string | null;
  zipCode: string | null;
  demoTime: string | null;
  previousOnlineClass: string | null;
  status: 'new' | 'contacted' | 'demo_scheduled' | 'enrolled' | 'archived';
  notes: string | null;
  emailSent: boolean;
  formData: Record<string, string> | null;
  partnerId: string | null;
  partner?: Partner | null;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  new: { label: 'New', variant: 'default' as const, color: 'bg-blue-500' },
  contacted: { label: 'Contacted', variant: 'secondary' as const, color: 'bg-yellow-500' },
  demo_scheduled: { label: 'Demo Scheduled', variant: 'secondary' as const, color: 'bg-purple-500' },
  enrolled: { label: 'Enrolled', variant: 'secondary' as const, color: 'bg-green-500' },
  archived: { label: 'Archived', variant: 'outline' as const, color: 'bg-gray-400' }
};

const formTypeLabels: Record<string, string> = {
  academics: 'Academics',
  computer: 'Computer Science',
  dance: 'Dance',
  arts: 'Arts & Music'
};

const formTypeColors: Record<string, { bg: string; text: string }> = {
  academics: { bg: 'bg-blue-600', text: 'text-white' },
  computer: { bg: 'bg-emerald-600', text: 'text-white' },
  dance: { bg: 'bg-pink-600', text: 'text-white' },
  arts: { bg: 'bg-amber-600', text: 'text-white' }
};

export default function ProspectStudents({ adminId }: ProspectStudentsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formTypeFilter, setFormTypeFilter] = useState<string>("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [selectedProspect, setSelectedProspect] = useState<ProspectStudent | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isAssignPartnerDialogOpen, setIsAssignPartnerDialogOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "list">("table");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const { toast } = useToast();

  // Load view mode from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem("prospect-students-view-mode") as "table" | "grid" | "list" | null;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode to localStorage
  const handleViewModeChange = (mode: "table" | "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("prospect-students-view-mode", mode);
  };

  const { data: prospects, isLoading, error, refetch } = useQuery<ProspectStudent[]>({
    queryKey: ['/api/admin/prospect-students'],
  });

  const { data: partners } = useQuery<Partner[]>({
    queryKey: ['/api/partners'],
  });

  const assignPartnerMutation = useMutation({
    mutationFn: async ({ prospectId, partnerId }: { prospectId: string; partnerId: string | null }) => {
      return apiRequest("POST", `/api/prospect-students/${prospectId}/assign-partner`, { partnerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-students'] });
      setIsAssignPartnerDialogOpen(false);
      setSelectedProspect(null);
      setSelectedPartnerId("");
      toast({
        title: "Partner Assigned",
        description: "Prospect has been assigned to the partner successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign partner.",
        variant: "destructive"
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/prospect-students/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-students/count/new'] });
      toast({
        title: "Status Updated",
        description: "Prospect status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update prospect status.",
        variant: "destructive"
      });
    }
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return apiRequest("PATCH", `/api/admin/prospect-students/${id}`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-students'] });
      setIsNotesDialogOpen(false);
      toast({
        title: "Notes Updated",
        description: "Prospect notes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notes.",
        variant: "destructive"
      });
    }
  });

  const resendEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/prospect-students/${id}/resend-email`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-students'] });
      toast({
        title: "Email Sent",
        description: "Confirmation email has been resent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resend email.",
        variant: "destructive"
      });
    }
  });

  const deleteProspectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/prospect-students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-students/count/new'] });
      setIsDetailDialogOpen(false);
      setIsNotesDialogOpen(false);
      setSelectedProspect(null);
      setDropdownOpen(null);
      toast({
        title: "Prospect Deleted",
        description: "Prospect has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete prospect.",
        variant: "destructive"
      });
    }
  });

  const filteredProspects = prospects?.filter(prospect => {
    const matchesSearch = 
      prospect.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prospect.parentName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prospect.parentEmail?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prospect.parentPhone?.includes(searchTerm));
    
    const matchesStatus = statusFilter === "all" || prospect.status === statusFilter;
    const matchesFormType = formTypeFilter === "all" || prospect.formType === formTypeFilter;
    const matchesPartner = partnerFilter === "all" || 
      (partnerFilter === "unassigned" && !prospect.partnerId) ||
      prospect.partnerId === partnerFilter;
    
    return matchesSearch && matchesStatus && matchesFormType && matchesPartner;
  }) || [];

  const stats = {
    total: prospects?.length || 0,
    new: prospects?.filter(p => p.status === 'new').length || 0,
    contacted: prospects?.filter(p => p.status === 'contacted').length || 0,
    demoScheduled: prospects?.filter(p => p.status === 'demo_scheduled').length || 0,
    enrolled: prospects?.filter(p => p.status === 'enrolled').length || 0
  };

  const openNotesDialog = (prospect: ProspectStudent) => {
    setSelectedProspect(prospect);
    setNotes(prospect.notes || "");
    setIsNotesDialogOpen(true);
    setDropdownOpen(null);
  };

  const openAssignPartnerDialog = (prospect: ProspectStudent) => {
    setSelectedProspect(prospect);
    setSelectedPartnerId(prospect.partnerId || "none");
    setIsAssignPartnerDialogOpen(true);
    setDropdownOpen(null);
  };

  const openDetailDialog = (prospect: ProspectStudent) => {
    setSelectedProspect(prospect);
    setIsDetailDialogOpen(true);
    setDropdownOpen(null);
  };

  const renderProspectActionMenu = (prospect: ProspectStudent, iconSize: "sm" | "md" = "md") => {
    const iconClass = iconSize === "sm" ? "w-3 h-3 mr-2" : "w-4 h-4 mr-2";
    const menuWidth = iconSize === "sm" ? "w-40" : "w-48";
    
    return (
      <DropdownMenuContent align="end" className={menuWidth} onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => openDetailDialog(prospect)}>
          <Eye className={iconClass} />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openNotesDialog(prospect)}>
          <MessageSquare className={iconClass} />
          {prospect.notes ? 'Edit Notes' : 'Add Notes'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openAssignPartnerDialog(prospect)}>
          <Building2 className={iconClass} />
          {prospect.partnerId ? 'Change Partner' : 'Assign to Partner'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => resendEmailMutation.mutate(prospect.id)}
          disabled={resendEmailMutation.isPending}
        >
          <Send className={iconClass} />
          Resend Email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => updateStatusMutation.mutate({ id: prospect.id, status: 'contacted' })}
          disabled={updateStatusMutation.isPending}
        >
          Mark as Contacted
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => updateStatusMutation.mutate({ id: prospect.id, status: 'demo_scheduled' })}
          disabled={updateStatusMutation.isPending}
        >
          Mark as Demo Scheduled
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => updateStatusMutation.mutate({ id: prospect.id, status: 'enrolled' })}
          disabled={updateStatusMutation.isPending}
        >
          Mark as Enrolled
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => updateStatusMutation.mutate({ id: prospect.id, status: 'archived' })}
          disabled={updateStatusMutation.isPending}
        >
          Archive
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => deleteProspectMutation.mutate(prospect.id)}
          className="text-destructive focus:text-destructive"
          disabled={deleteProspectMutation.isPending}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load prospect students</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-[#1F3A5F]/10 backdrop-blur-sm">
                  <UserPlus className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white">Prospect Students</h1>
              </div>
              <p className="text-[#1F3A5F]/60 dark:text-white/60 text-sm sm:text-base font-medium">Manage demo class registrations and convert prospects to enrolled students</p>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="icon" className="bg-[#1F3A5F]/10 border-[#1F3A5F]/20 text-[#1F3A5F] hover:bg-[#1F3A5F]/20 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20" data-testid="button-refresh-prospects">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1F3A5F]/10 dark:bg-[#1F3A5F]/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-[#1F3A5F] dark:text-[#2FBF71]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total</p>
                {isLoading ? <Skeleton className="h-6 w-10" /> : <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">New</p>
                {isLoading ? <Skeleton className="h-6 w-10" /> : <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.new}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <PhoneCall className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Contacted</p>
                {isLoading ? <Skeleton className="h-6 w-10" /> : <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.contacted}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <CalendarCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Demo</p>
                {isLoading ? <Skeleton className="h-6 w-10" /> : <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.demoScheduled}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1 border-0 shadow-sm bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2FBF71]/10 dark:bg-[#2FBF71]/20 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-5 h-5 text-[#2FBF71]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Enrolled</p>
                {isLoading ? <Skeleton className="h-6 w-10" /> : <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.enrolled}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1F3A5F]/10 dark:bg-[#1F3A5F]/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#1F3A5F] dark:text-[#2FBF71]" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">All Prospects</h2>
            </div>
            <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search prospects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-56 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  data-testid="input-search-prospects"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="demo_scheduled">Demo Scheduled</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formTypeFilter} onValueChange={setFormTypeFilter}>
                <SelectTrigger className="w-full sm:w-36 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" data-testid="select-form-type-filter">
                  <SelectValue placeholder="Program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  <SelectItem value="academics">Academics</SelectItem>
                  <SelectItem value="computer">Computer Science</SelectItem>
                  <SelectItem value="dance">Dance</SelectItem>
                  <SelectItem value="arts">Arts & Music</SelectItem>
                </SelectContent>
              </Select>
              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" data-testid="select-partner-filter">
                  <SelectValue placeholder="Partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Partners</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {partners?.filter(p => p.status === 'active').map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>{partner.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* View Mode Toggle Group */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className={`h-8 w-8 ${viewMode === "table" ? "bg-white dark:bg-slate-700 shadow-sm" : ""}`}
                  onClick={() => handleViewModeChange("table")}
                  data-testid="button-view-table"
                  title="Table View"
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className={`h-8 w-8 ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm" : ""}`}
                  onClick={() => handleViewModeChange("grid")}
                  data-testid="button-view-grid"
                  title="Grid View"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className={`h-8 w-8 ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm" : ""}`}
                  onClick={() => handleViewModeChange("list")}
                  data-testid="button-view-list"
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prospects List */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredProspects.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">No prospects found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                {searchTerm || statusFilter !== "all" || formTypeFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Demo class registrations will appear here"}
              </p>
            </div>
          ) : viewMode === "table" ? (
            <div className="p-4 space-y-3">
              {filteredProspects.map((prospect) => {
                const config = statusConfig[prospect.status] || statusConfig.new;
                return (
                  <div
                    key={prospect.id}
                    className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:border-[#2FBF71]/30 transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => openDetailDialog(prospect)}
                    data-testid={`row-prospect-${prospect.id}`}
                  >
                    {/* Left accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.color}`} />
                    
                    <div className="p-5 pl-6">
                      <div className="flex items-start justify-between gap-6">
                        {/* Student Info Section */}
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md">
                            {prospect.studentName.charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-[#1F3A5F] dark:text-white truncate">{prospect.studentName}</h3>
                              <Badge 
                                variant="secondary" 
                                className={`${formTypeColors[prospect.formType]?.bg || 'bg-slate-600'} ${formTypeColors[prospect.formType]?.text || 'text-white'} text-[10px] px-2 py-0.5`}
                              >
                                {formTypeLabels[prospect.formType] || prospect.formType}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {prospect.studentAge && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium text-slate-500">Age:</span> {prospect.studentAge}
                                </span>
                              )}
                              {prospect.studentGrade && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium text-slate-500">Grade:</span> {prospect.studentGrade}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="hidden lg:block min-w-[180px]">
                          <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Contact</p>
                          {prospect.parentName && (
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{prospect.parentName}</p>
                          )}
                          {(prospect.parentEmail || prospect.zoomEmail) && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-[#2FBF71]" />
                              <span className="truncate">{prospect.parentEmail || prospect.zoomEmail}</span>
                            </p>
                          )}
                        </div>

                        {/* Location */}
                        <div className="hidden xl:block min-w-[140px]">
                          <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Location</p>
                          {(prospect.state || prospect.country) ? (
                            <>
                              <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-[#1F3A5F]" />
                                {prospect.state}{prospect.state && prospect.country && ', '}{prospect.country}
                              </p>
                              {prospect.zipCode && (
                                <p className="text-xs text-muted-foreground mt-0.5">ZIP: {prospect.zipCode}</p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">-</p>
                          )}
                        </div>

                        {/* Demo Time */}
                        <div className="hidden md:block min-w-[100px]">
                          <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Demo</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-[#2FBF71]" />
                            {prospect.demoTime || '-'}
                          </p>
                        </div>

                        {/* Status & Date */}
                        <div className="text-right min-w-[100px]">
                          <Badge 
                            variant={config.variant}
                            className={`${config.color} text-white text-xs shadow-sm`}
                          >
                            {config.label}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            {format(new Date(prospect.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-opacity" data-testid={`button-actions-${prospect.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            {renderProspectActionMenu(prospect)}
                          </DropdownMenu>
                        </div>
                      </div>
                      {/* Partner Badge */}
                      {prospect.partner && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <Badge variant="outline" className="text-[10px] bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700">
                            <Building2 className="w-3 h-3 mr-1" />
                            {prospect.partner.name}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === "grid" ? (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProspects.map((prospect) => {
                  const config = statusConfig[prospect.status] || statusConfig.new;
                  return (
                    <div 
                      key={prospect.id}
                      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm hover:shadow-lg hover:border-[#2FBF71]/30 transition-all duration-300 cursor-pointer overflow-hidden"
                      onClick={() => openDetailDialog(prospect)}
                      data-testid={`card-prospect-${prospect.id}`}
                    >
                      {/* Top accent bar */}
                      <div className={`h-1 w-full ${config.color}`} />
                      
                      <div className="p-5">
                        {/* Header with Avatar and Program Badge */}
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md">
                            {prospect.studentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[#1F3A5F] dark:text-white truncate text-base">{prospect.studentName}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {prospect.studentAge && <span>Age {prospect.studentAge}</span>}
                              {prospect.studentAge && prospect.studentGrade && <span className="text-slate-300">|</span>}
                              {prospect.studentGrade && <span>Grade {prospect.studentGrade}</span>}
                            </div>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`${formTypeColors[prospect.formType]?.bg || 'bg-slate-600'} ${formTypeColors[prospect.formType]?.text || 'text-white'} text-[10px] px-2 py-0.5 shrink-0`}
                          >
                            {formTypeLabels[prospect.formType] || prospect.formType}
                          </Badge>
                        </div>
                        
                        {/* Contact Section */}
                        <div className="space-y-2 py-3 border-t border-slate-100 dark:border-slate-800">
                          {prospect.parentName && (
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{prospect.parentName}</p>
                          )}
                          {(prospect.parentEmail || prospect.zoomEmail) && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-[#2FBF71]" />
                              <span className="truncate">{prospect.parentEmail || prospect.zoomEmail}</span>
                            </p>
                          )}
                          {prospect.parentPhone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-[#1F3A5F]" />
                              {prospect.parentPhone}
                            </p>
                          )}
                        </div>

                        {/* Location & Demo */}
                        <div className="py-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          {(prospect.state || prospect.country) && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-[#1F3A5F]" />
                              {[prospect.state, prospect.country].filter(Boolean).join(', ')}
                              {prospect.zipCode && <span className="text-slate-400">({prospect.zipCode})</span>}
                            </p>
                          )}
                          {prospect.demoTime && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-[#2FBF71]" />
                              {prospect.demoTime}
                            </p>
                          )}
                        </div>

                        {/* Footer with Status and Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={config.variant}
                              className={`${config.color} text-white text-[10px] shadow-sm`}
                            >
                              {config.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(prospect.createdAt), 'MMM d')}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 group-hover:opacity-100" data-testid={`button-actions-${prospect.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            {renderProspectActionMenu(prospect, "sm")}
                          </DropdownMenu>
                        </div>
                        
                        {/* Partner Badge for Grid View */}
                        {prospect.partner && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <Badge variant="outline" className="text-[10px] bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700">
                              <Building2 className="w-3 h-3 mr-1" />
                              {prospect.partner.name}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredProspects.map((prospect) => {
                const config = statusConfig[prospect.status] || statusConfig.new;
                return (
                  <div 
                    key={prospect.id}
                    className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:border-[#2FBF71]/30 transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => openDetailDialog(prospect)}
                    data-testid={`item-prospect-${prospect.id}`}
                  >
                    {/* Left accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.color}`} />
                    
                    <div className="p-4 pl-5 flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                        {prospect.studentName.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-[#1F3A5F] dark:text-white truncate">{prospect.studentName}</h3>
                          <Badge 
                            variant="secondary" 
                            className={`${formTypeColors[prospect.formType]?.bg || 'bg-slate-600'} ${formTypeColors[prospect.formType]?.text || 'text-white'} text-[10px] px-2 py-0.5 shrink-0`}
                          >
                            {formTypeLabels[prospect.formType] || prospect.formType}
                          </Badge>
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {prospect.studentAge && `Age ${prospect.studentAge}`}
                            {prospect.studentAge && prospect.studentGrade && ' · '}
                            {prospect.studentGrade && `Grade ${prospect.studentGrade}`}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {prospect.parentName && (
                            <span className="font-medium text-slate-600 dark:text-slate-400">{prospect.parentName}</span>
                          )}
                          {(prospect.parentEmail || prospect.zoomEmail) && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#2FBF71]" />
                              <span className="truncate max-w-[150px]">{prospect.parentEmail || prospect.zoomEmail}</span>
                            </span>
                          )}
                          {prospect.parentPhone && (
                            <span className="flex items-center gap-1 hidden md:flex">
                              <Phone className="w-3 h-3 text-[#1F3A5F]" />
                              {prospect.parentPhone}
                            </span>
                          )}
                          {(prospect.state || prospect.country) && (
                            <span className="flex items-center gap-1 hidden lg:flex">
                              <MapPin className="w-3 h-3 text-[#1F3A5F]" />
                              {[prospect.state, prospect.country].filter(Boolean).join(', ')}
                              {prospect.zipCode && <span className="text-slate-400">({prospect.zipCode})</span>}
                            </span>
                          )}
                          {prospect.demoTime && (
                            <span className="flex items-center gap-1 hidden xl:flex">
                              <Calendar className="w-3 h-3 text-[#2FBF71]" />
                              {prospect.demoTime}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Right Side - Status & Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <Badge 
                            variant={config.variant}
                            className={`${config.color} text-white text-xs shadow-sm`}
                          >
                            {config.label}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {format(new Date(prospect.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <DropdownMenu open={dropdownOpen === prospect.id} onOpenChange={(isOpen) => setDropdownOpen(isOpen ? prospect.id : null)}>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-opacity" data-testid={`button-actions-${prospect.id}`}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          {renderProspectActionMenu(prospect)}
                        </DropdownMenu>
                      </div>
                      {/* Partner Badge for List View */}
                      {prospect.partner && (
                        <Badge variant="outline" className="text-[10px] bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700 shrink-0 ml-2">
                          <Building2 className="w-3 h-3 mr-1" />
                          {prospect.partner.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
          {/* Header - Fixed */}
          <div className="px-6 py-4 border-b bg-background shrink-0">
            <DialogHeader>
              <DialogTitle>Complete Prospect Details</DialogTitle>
              <DialogDescription>
                All information gathered from the demo class registration form
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto dialog-scroll">
            {selectedProspect && (
              <div className="px-6 py-4 space-y-6 animate-in fade-in duration-300">
                {/* Header with Status and Program */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedProspect.studentName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedProspect.parentName || 'Parent/Guardian'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`${formTypeColors[selectedProspect.formType]?.bg || 'bg-slate-600'} ${formTypeColors[selectedProspect.formType]?.text || 'text-white'}`}
                    >
                      {formTypeLabels[selectedProspect.formType] || selectedProspect.formType}
                    </Badge>
                    <Badge 
                      variant={statusConfig[selectedProspect.status]?.variant || 'default'}
                      className={`${statusConfig[selectedProspect.status]?.color || 'bg-blue-500'} text-white`}
                    >
                      {statusConfig[selectedProspect.status]?.label || selectedProspect.status}
                    </Badge>
                  </div>
                </div>

                {/* Basic Information */}
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-3">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground font-medium">Student Name</p>
                      <p className="text-sm font-medium">{selectedProspect.studentName}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground font-medium">Parent Name</p>
                      <p className="text-sm">{selectedProspect.parentName || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground font-medium">Parent Email</p>
                      <p className="text-sm break-all">{selectedProspect.parentEmail || '-'}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground font-medium">Parent Phone</p>
                      <p className="text-sm">{selectedProspect.parentPhone || '-'}</p>
                    </div>
                    {selectedProspect.zoomEmail && (
                      <div className="bg-muted/30 p-3 rounded-md col-span-2">
                        <p className="text-xs text-muted-foreground font-medium">Zoom Email</p>
                        <p className="text-sm break-all">{selectedProspect.zoomEmail}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Information */}
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-3">Student Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground font-medium">Date of Birth</p>
                      <p className="text-sm">{selectedProspect.studentDOB || '-'}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground font-medium">Age</p>
                      <p className="text-sm">{selectedProspect.studentAge || '-'}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground font-medium">Current Grade</p>
                      <p className="text-sm">{selectedProspect.studentGrade || '-'}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground font-medium">Country</p>
                      <p className="text-sm">{selectedProspect.country || '-'}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground font-medium">State/Province</p>
                      <p className="text-sm">{selectedProspect.state || '-'}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground font-medium">Zip/Postal Code</p>
                      <p className="text-sm">{selectedProspect.zipCode || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Program Information */}
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-3">Program Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground font-medium">Program</p>
                      <p className="text-sm">{formTypeLabels[selectedProspect.formType] || selectedProspect.formType}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground font-medium">Preferred Demo Time</p>
                      <p className="text-sm">{selectedProspect.demoTime || '-'}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground font-medium">Previous Online Classes</p>
                      <p className="text-sm">{selectedProspect.previousOnlineClass || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Form-Specific Data */}
                {selectedProspect.formData && Object.keys(selectedProspect.formData).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-3">Additional Form Details</h4>
                    <div className="bg-muted/30 p-4 rounded-md space-y-3">
                      {Object.entries(selectedProspect.formData).map(([key, value]) => (
                        <div key={key} className="border-l-2 border-primary pl-3">
                          <p className="text-xs text-muted-foreground font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{value || '-'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedProspect.notes && (
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-3">Admin Notes</h4>
                    <p className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-md text-sm">{selectedProspect.notes}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="bg-muted/50 p-3 rounded-md border border-muted pb-6">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground font-medium">Email Confirmation</p>
                      <Badge variant={selectedProspect.emailSent ? "default" : "outline"}>
                        {selectedProspect.emailSent ? 'Sent' : 'Not Sent'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Submitted</p>
                      <p className="text-sm">{format(new Date(selectedProspect.createdAt), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Last Updated</p>
                      <p className="text-sm">{format(new Date(selectedProspect.updatedAt), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prospect Notes</DialogTitle>
            <DialogDescription>
              Add or update notes for {selectedProspect?.studentName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Enter notes about this prospect..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              data-testid="textarea-prospect-notes"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedProspect) {
                    updateNotesMutation.mutate({ id: selectedProspect.id, notes });
                  }
                }}
                disabled={updateNotesMutation.isPending}
                data-testid="button-save-notes"
              >
                {updateNotesMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Notes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Partner Dialog */}
      <Dialog open={isAssignPartnerDialogOpen} onOpenChange={setIsAssignPartnerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-violet-600" />
              Assign to Partner
            </DialogTitle>
            <DialogDescription>
              Assign {selectedProspect?.studentName} to a partner learning center. The partner admin will then be able to manage this prospect.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Partner</label>
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger data-testid="select-assign-partner">
                  <SelectValue placeholder="Choose a partner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Partner (Unassign)</SelectItem>
                  {partners?.filter(p => p.status === 'active').map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedProspect?.partner && (
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Currently assigned to: <span className="font-medium text-foreground">{selectedProspect.partner.name}</span>
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsAssignPartnerDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedProspect) {
                    assignPartnerMutation.mutate({ 
                      prospectId: selectedProspect.id, 
                      partnerId: selectedPartnerId === "none" ? null : selectedPartnerId || null 
                    });
                  }
                }}
                disabled={assignPartnerMutation.isPending}
                data-testid="button-confirm-assign-partner"
              >
                {assignPartnerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    {selectedPartnerId === "none" ? "Remove Partner" : "Assign Partner"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
