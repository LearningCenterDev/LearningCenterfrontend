import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User as UserIcon, 
  GraduationCap, 
  Calendar,
  AlertCircle,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CourseActivationRequest, Course, User } from "@shared/schema";

interface ParentCourseActivationRequestsProps {
  parentId: string;
}

export default function ParentCourseActivationRequests({ parentId }: ParentCourseActivationRequestsProps) {
  const [selectedRequest, setSelectedRequest] = useState<CourseActivationRequest | null>(null);
  const [authorizationNotes, setAuthorizationNotes] = useState("");
  const [actionType, setActionType] = useState<"authorize" | "deny" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending activation requests for this parent
  const { data: activationRequests = [], isLoading } = useQuery<CourseActivationRequest[]>({
    queryKey: ["/api/course-activation-requests", { parentId }],
    queryFn: async () => {
      const response = await fetch(`/api/course-activation-requests?parentId=${parentId}`);
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Failed to fetch activation requests');
      }
      return response.json();
    },
  });

  // Filter for pending requests
  const pendingRequests = activationRequests.filter(req => req.status === "pending_parent");

  // Fetch course details for each request
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses", { ids: pendingRequests.map(r => r.courseId) }],
    queryFn: async () => {
      if (pendingRequests.length === 0) return [];
      
      const coursePromises = pendingRequests.map(async (request) => {
        const response = await fetch(`/api/courses/${request.courseId}`);
        if (!response.ok) return null;
        return response.json();
      });
      
      const courseResults = await Promise.all(coursePromises);
      return courseResults.filter(Boolean);
    },
    enabled: pendingRequests.length > 0,
  });

  // Fetch teacher details for each request
  const { data: teachers = [] } = useQuery<User[]>({
    queryKey: ["/api/users", "teachers", pendingRequests.map(r => r.teacherId)],
    queryFn: async () => {
      if (pendingRequests.length === 0) return [];
      
      const teacherPromises = pendingRequests.map(async (request) => {
        const response = await fetch(`/api/users/${request.teacherId}`);
        if (!response.ok) return null;
        return response.json();
      });
      
      const teacherResults = await Promise.all(teacherPromises);
      return teacherResults.filter(Boolean);
    },
    enabled: pendingRequests.length > 0,
  });

  // Fetch child details for each request
  const { data: children = [] } = useQuery<User[]>({
    queryKey: ["/api/users", "children", pendingRequests.map(r => r.childId)],
    queryFn: async () => {
      if (pendingRequests.length === 0) return [];
      
      const childPromises = pendingRequests.map(async (request) => {
        const response = await fetch(`/api/users/${request.childId}`);
        if (!response.ok) return null;
        return response.json();
      });
      
      const childResults = await Promise.all(childPromises);
      return childResults.filter(Boolean);
    },
    enabled: pendingRequests.length > 0,
  });

  // Authorize course activation mutation
  const authorizeMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes?: string }) => {
      const response = await fetch(`/api/course-activation-requests/${requestId}/authorize`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentNotes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to authorize course activation" }));
        throw new Error(error.message || "Failed to authorize course activation");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Course Authorized",
        description: "The course activation has been approved and sent to administration for final verification.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/course-activation-requests"] });
      resetModal();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to authorize course activation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Deny course activation mutation
  const denyMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const response = await fetch(`/api/course-activation-requests/${requestId}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rejectionReason: reason,
          rejectedBy: parentId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to deny course activation" }));
        throw new Error(error.message || "Failed to deny course activation");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Course Request Denied",
        description: "The course activation request has been denied.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/course-activation-requests"] });
      resetModal();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to deny course activation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetModal = () => {
    setSelectedRequest(null);
    setAuthorizationNotes("");
    setActionType(null);
    setDialogOpen(false);
  };

  const openDialog = (request: CourseActivationRequest, action: "authorize" | "deny") => {
    setSelectedRequest(request);
    setActionType(action);
    setAuthorizationNotes("");
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Reset state when dialog is closed
      setSelectedRequest(null);
      setAuthorizationNotes("");
      setActionType(null);
    }
  };

  const handleAction = () => {
    if (!selectedRequest || !actionType) return;

    if (actionType === "authorize") {
      authorizeMutation.mutate({
        requestId: selectedRequest.id,
        notes: authorizationNotes || undefined,
      });
    } else if (actionType === "deny") {
      if (!authorizationNotes.trim()) {
        toast({
          title: "Reason Required",
          description: "Please provide a reason for denying this course activation request.",
          variant: "destructive",
        });
        return;
      }
      denyMutation.mutate({
        requestId: selectedRequest.id,
        reason: authorizationNotes,
      });
    }
  };

  const getRequestWithDetails = (request: CourseActivationRequest) => {
    const course = courses.find(c => c.id === request.courseId);
    const teacher = teachers.find(t => t.id === request.teacherId);
    const child = children.find(c => c.id === request.childId);
    
    return { request, course, teacher, child };
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Course Activation Requests</h1>
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
    <div className="p-6 space-y-6" data-testid="parent-course-activation-requests">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Course Activation Requests</h1>
          <Badge variant="secondary" data-testid="pending-requests-count">
            {pendingRequests.length} Pending
          </Badge>
        </div>
      </div>

      {pendingRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No pending requests</h3>
            <p className="text-muted-foreground">
              All course activation requests for your children have been processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => {
            const { course, teacher, child } = getRequestWithDetails(request);
            
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
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" />
                          <span>Child: {child ? `${child.firstName} ${child.lastName}` : "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" />
                          <span>Teacher: {teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Submitted: {new Date(request.submittedAt || request.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300"
                      data-testid="status-pending-parent"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Your Approval
                    </Badge>
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
                    {request.parentNotes && (
                      <div>
                        <h4 className="font-medium mb-2">Additional Notes</h4>
                        <p className="text-sm text-muted-foreground">{request.parentNotes}</p>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-3">
                    <Button
                      variant="default"
                      onClick={() => openDialog(request, "authorize")}
                      data-testid={`button-authorize-${request.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Authorize
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={() => openDialog(request, "deny")}
                      data-testid={`button-deny-${request.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Deny
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Shared Authorization/Denial Dialog */}
      {selectedRequest && (
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="sm:max-w-[500px]" data-testid="authorization-dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionType === "authorize" ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Authorize Course Activation
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    Deny Course Activation
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {(() => {
                  const { course, child } = getRequestWithDetails(selectedRequest);
                  return actionType === "authorize" 
                    ? `Authorize "${course?.title}" for ${child?.firstName} ${child?.lastName}. This will send the request to administration for final approval.`
                    : `Deny the course activation request for "${course?.title}". Please provide a reason for your decision.`;
                })()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">
                  {actionType === "authorize" ? "Additional Notes (Optional)" : "Reason for Denial *"}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    actionType === "authorize" 
                      ? "Add any additional comments for the administration..."
                      : "Please explain why you are denying this course activation..."
                  }
                  value={authorizationNotes}
                  onChange={(e) => setAuthorizationNotes(e.target.value)}
                  data-testid="textarea-authorization-notes"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={resetModal}
                  disabled={authorizeMutation.isPending || denyMutation.isPending}
                  data-testid="button-cancel-authorization"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAction}
                  disabled={
                    authorizeMutation.isPending || 
                    denyMutation.isPending ||
                    (actionType === "deny" && !authorizationNotes.trim())
                  }
                  variant={actionType === "authorize" ? "default" : "destructive"}
                  className="flex-1"
                  data-testid="button-confirm-authorization"
                >
                  {authorizeMutation.isPending || denyMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {actionType === "authorize" ? "Authorize Course" : "Deny Request"}
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
            Course Activation Process
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>1. Teacher Submission:</strong> Teachers submit courses for activation with your child as the target student.
            </p>
            <p>
              <strong>2. Parent Authorization (Your Step):</strong> You review and approve or deny the course activation.
            </p>
            <p>
              <strong>3. Admin Verification:</strong> Authorized courses are sent to administration for final approval.
            </p>
            <p>
              <strong>4. Course Activation:</strong> Once approved by admin, the course becomes active and available for student enrollment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}