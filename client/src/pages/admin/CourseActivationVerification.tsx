import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  UserIcon, 
  GraduationCap, 
  Calendar,
  AlertCircle,
  Send,
  Search,
  Filter,
  Eye
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as globalQueryClient } from "@/lib/queryClient";
import type { CourseActivationRequest, Course, User } from "@shared/schema";

interface AdminCourseActivationVerificationProps {
  adminId: string;
}

export default function AdminCourseActivationVerification({ adminId }: AdminCourseActivationVerificationProps) {
  const [selectedRequest, setSelectedRequest] = useState<CourseActivationRequest | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [actionType, setActionType] = useState<"verify" | "reject" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending_admin");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all activation requests for admin review
  const { data: activationRequests = [], isLoading } = useQuery<CourseActivationRequest[]>({
    queryKey: ["/api/course-activation-requests"],
    queryFn: async () => {
      const response = await fetch("/api/course-activation-requests");
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Failed to fetch activation requests');
      }
      return response.json();
    },
  });

  // Get unique IDs for batched fetching
  const uniqueCourseIds = useMemo(() => {
    return Array.from(new Set(activationRequests.map(r => r.courseId)));
  }, [activationRequests]);

  const uniqueTeacherIds = useMemo(() => {
    return Array.from(new Set(activationRequests.map(r => r.teacherId)));
  }, [activationRequests]);

  const uniqueChildIds = useMemo(() => {
    return Array.from(new Set(activationRequests.map(r => r.childId)));
  }, [activationRequests]);

  const uniqueParentIds = useMemo(() => {
    return Array.from(new Set(activationRequests.map(r => r.parentId)));
  }, [activationRequests]);

  // Fetch all courses once and filter client-side for efficiency
  const { data: allCourses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/courses");
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching courses:", error);
        return [];
      }
    },
  });

  // Filter courses to only needed ones
  const courses = useMemo(() => {
    return uniqueCourseIds.map(courseId => {
      const course = allCourses.find(c => c.id === courseId);
      return course || {
        id: courseId,
        title: "Course Not Found",
        subject: "Unknown",
        grade: "Unknown",
        description: "Course details could not be loaded.",
        teacherId: "",
        isActive: false,
        createdAt: null,
        updatedAt: null
      };
    });
  }, [allCourses, uniqueCourseIds]);

  // Fetch all users once and filter client-side for efficiency  
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    },
  });

  // Filter users to only needed teachers
  const teachers = useMemo(() => {
    return uniqueTeacherIds.map(teacherId => {
      const teacher = allUsers.find(u => u.id === teacherId && u.role === "teacher");
      return teacher || {
        id: teacherId,
        firstName: "Teacher",
        lastName: "Not Found",
        email: "unknown@example.com",
        role: "teacher" as const,
        isActive: true,
        createdAt: null,
        updatedAt: null
      };
    });
  }, [allUsers, uniqueTeacherIds]);

  // Filter users to only needed children
  const children = useMemo(() => {
    return uniqueChildIds.map(childId => {
      const child = allUsers.find(u => u.id === childId && u.role === "student");
      return child || {
        id: childId,
        firstName: "Student",
        lastName: "Not Found",
        email: "unknown@example.com",
        role: "student" as const,
        isActive: true,
        createdAt: null,
        updatedAt: null
      };
    });
  }, [allUsers, uniqueChildIds]);

  // Filter users to only needed parents
  const parents = useMemo(() => {
    return uniqueParentIds.map(parentId => {
      const parent = allUsers.find(u => u.id === parentId && u.role === "parent");
      return parent || {
        id: parentId,
        firstName: "Parent",
        lastName: "Not Found",
        email: "unknown@example.com",
        role: "parent" as const,
        isActive: true,
        createdAt: null,
        updatedAt: null
      };
    });
  }, [allUsers, uniqueParentIds]);

  // Enhanced filtering with course, teacher, and student names
  const filteredRequests = useMemo(() => {
    return activationRequests.filter(request => {
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      
      if (searchQuery === "") {
        return matchesStatus;
      }
      
      const searchLower = searchQuery.toLowerCase();
      const course = courses.find(c => c.id === request.courseId);
      const teacher = teachers.find(t => t.id === request.teacherId);
      const child = children.find(c => c.id === request.childId);
      const parent = parents.find(p => p.id === request.parentId);
      
      const matchesSearch = 
        request.courseId.toLowerCase().includes(searchLower) ||
        course?.title.toLowerCase().includes(searchLower) ||
        course?.subject.toLowerCase().includes(searchLower) ||
        teacher?.firstName?.toLowerCase().includes(searchLower) ||
        teacher?.lastName?.toLowerCase().includes(searchLower) ||
        child?.firstName?.toLowerCase().includes(searchLower) ||
        child?.lastName?.toLowerCase().includes(searchLower) ||
        parent?.firstName?.toLowerCase().includes(searchLower) ||
        parent?.lastName?.toLowerCase().includes(searchLower);
      
      return matchesStatus && matchesSearch;
    });
  }, [activationRequests, statusFilter, searchQuery, courses, teachers, children, parents]);

  // Verify course activation mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/course-activation-requests/${requestId}/verify`,
        {
          adminNotes: notes || undefined,
          adminId: adminId,
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Course Activation Verified",
        description: "The course has been activated and is now available for student enrollment.",
      });
      // Invalidate all related queries
      globalQueryClient.invalidateQueries({ queryKey: ["/api/course-activation-requests"] });
      globalQueryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      globalQueryClient.invalidateQueries({ queryKey: ["/api/users"] });
      globalQueryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      globalQueryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      resetModal();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to verify course activation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject course activation mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/course-activation-requests/${requestId}/reject`,
        {
          rejectionReason: reason,
          rejectedBy: adminId,
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Course Activation Rejected",
        description: "The course activation request has been rejected.",
      });
      // Invalidate all related queries
      globalQueryClient.invalidateQueries({ queryKey: ["/api/course-activation-requests"] });
      globalQueryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      globalQueryClient.invalidateQueries({ queryKey: ["/api/users"] });
      globalQueryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      resetModal();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to reject course activation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetModal = () => {
    setSelectedRequest(null);
    setVerificationNotes("");
    setActionType(null);
    setDialogOpen(false);
  };

  const openDialog = (request: CourseActivationRequest, action: "verify" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setVerificationNotes("");
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetModal();
    }
  };

  const handleAction = () => {
    if (!selectedRequest || !actionType) return;

    if (actionType === "verify") {
      verifyMutation.mutate({
        requestId: selectedRequest.id,
        notes: verificationNotes || undefined,
      });
    } else if (actionType === "reject") {
      if (!verificationNotes.trim()) {
        toast({
          title: "Reason Required",
          description: "Please provide a reason for rejecting this course activation request.",
          variant: "destructive",
        });
        return;
      }
      rejectMutation.mutate({
        requestId: selectedRequest.id,
        reason: verificationNotes,
      });
    }
  };

  const getRequestWithDetails = (request: CourseActivationRequest) => {
    const course = courses.find(c => c.id === request.courseId);
    const teacher = teachers.find(t => t.id === request.teacherId);
    const child = children.find(c => c.id === request.childId);
    const parent = parents.find(p => p.id === request.parentId);
    
    return { request, course, teacher, child, parent };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_admin":
        return <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300" data-testid="status-pending-admin"><Clock className="w-3 h-3 mr-1" />Pending Verification</Badge>;
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" data-testid="status-active"><CheckCircle className="w-3 h-3 mr-1" />Verified & Active</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid="status-rejected"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "parent_authorized":
        return <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300" data-testid="status-parent-authorized"><UserIcon className="w-3 h-3 mr-1" />Parent Authorized</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`status-${status}`}>{status}</Badge>;
    }
  };

  const pendingCount = activationRequests.filter(r => r.status === "pending_admin").length;
  const authorizedCount = activationRequests.filter(r => r.status === "parent_authorized").length;
  const verifiedCount = activationRequests.filter(r => r.status === "active").length;
  const rejectedCount = activationRequests.filter(r => r.status === "rejected").length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Course Activation Verification</h1>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="admin-course-activation-verification">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Course Activation Verification</h1>
          <Badge variant="secondary" data-testid="total-requests-count">
            {activationRequests.length} Total Requests
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="pending-count">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parent Authorized</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="authorized-count">{authorizedCount}</div>
            <p className="text-xs text-muted-foreground">Ready for verification</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified & Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="verified-count">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground">Courses activated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="rejected-count">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Requests denied</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search courses, teachers, students, or parents..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="select-status-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending_admin">Pending Verification</SelectItem>
            <SelectItem value="parent_authorized">Parent Authorized</SelectItem>
            <SelectItem value="active">Verified & Active</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activation Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Eye className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No requests found</h3>
            <p className="text-muted-foreground">
              {statusFilter === "pending_admin" 
                ? "No course activation requests are currently pending verification."
                : "No requests match your current filter criteria."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const { course, teacher, child, parent } = getRequestWithDetails(request);
            
            return (
              <Card 
                key={request.id} 
                className="hover-elevate cursor-pointer transition-colors"
                data-testid={`activation-request-${request.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        <GraduationCap className="w-5 h-5" />
                        {course?.title || "Course"}
                      </CardTitle>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <UserIcon className="w-4 h-4" />
                            <span>Teacher: {teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <UserIcon className="w-4 h-4" />
                            <span>Student: {child ? `${child.firstName} ${child.lastName}` : "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <UserIcon className="w-4 h-4" />
                            <span>Parent: {parent ? `${parent.firstName} ${parent.lastName}` : "Unknown"}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Submitted: {new Date(request.submittedAt || request.createdAt || Date.now()).toLocaleDateString()}</span>
                          </div>
                          {request.parentAuthorizedAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Parent Approved: {new Date(request.parentAuthorizedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                          {request.adminVerifiedAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Verified: {new Date(request.adminVerifiedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Course Details</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Subject:</span> {course?.subject || "N/A"}</p>
                        <p><span className="text-muted-foreground">Grade:</span> {course?.grade || "N/A"}</p>
                        <p className="text-muted-foreground">{course?.description || "No description available."}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Request Notes</h4>
                      <div className="space-y-1 text-sm">
                        {request.parentNotes && (
                          <div>
                            <p className="font-medium">Parent Notes:</p>
                            <p className="text-muted-foreground">{request.parentNotes}</p>
                          </div>
                        )}
                        {request.adminNotes && (
                          <div>
                            <p className="font-medium">Admin Notes:</p>
                            <p className="text-muted-foreground">{request.adminNotes}</p>
                          </div>
                        )}
                        {request.rejectionReason && (
                          <div>
                            <p className="font-medium text-destructive">Rejection Reason:</p>
                            <p className="text-destructive">{request.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {request.status === "pending_admin" && (
                    <>
                      <Separator />
                      <div className="flex gap-3">
                        <Button
                          variant="default"
                          onClick={() => openDialog(request, "verify")}
                          data-testid={`button-verify-${request.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify & Activate
                        </Button>
                        
                        <Button
                          variant="destructive"
                          onClick={() => openDialog(request, "reject")}
                          data-testid={`button-reject-${request.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Shared Verification/Rejection Dialog */}
      {selectedRequest && (
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="sm:max-w-[500px]" data-testid="verification-dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionType === "verify" ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Verify Course Activation
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    Reject Course Activation
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {(() => {
                  const { course, child } = getRequestWithDetails(selectedRequest);
                  return actionType === "verify" 
                    ? `Verify and activate "${course?.title}" for ${child?.firstName} ${child?.lastName}. This will make the course available for student enrollment.`
                    : `Reject the course activation request for "${course?.title}". Please provide a detailed reason for your decision.`;
                })()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">
                  {actionType === "verify" ? "Verification Notes (Optional)" : "Rejection Reason *"}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    actionType === "verify" 
                      ? "Add any notes about this verification..."
                      : "Please provide a detailed reason for rejecting this course activation..."
                  }
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  data-testid="textarea-verification-notes"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={resetModal}
                  disabled={verifyMutation.isPending || rejectMutation.isPending}
                  data-testid="button-cancel-verification"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAction}
                  disabled={
                    verifyMutation.isPending || 
                    rejectMutation.isPending ||
                    (actionType === "reject" && !verificationNotes.trim())
                  }
                  variant={actionType === "verify" ? "default" : "destructive"}
                  className="flex-1"
                  data-testid="button-confirm-verification"
                >
                  {verifyMutation.isPending || rejectMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {actionType === "verify" ? "Verify & Activate Course" : "Reject Request"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Information Card */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Admin Verification Process
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>1. Teacher Submission:</strong> Teachers submit courses for activation with student and parent information.
            </p>
            <p>
              <strong>2. Parent Authorization:</strong> Parents review and approve or deny the course activation request.
            </p>
            <p>
              <strong>3. Admin Verification (Your Step):</strong> Review parent-authorized courses and verify or reject them.
            </p>
            <p>
              <strong>4. Course Activation:</strong> Verified courses become active and available for student enrollment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}