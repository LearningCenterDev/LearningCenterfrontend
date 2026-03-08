import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User, BookOpen, CheckCircle, XCircle, Clock, GraduationCap } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ChildrenProps {
  parentId: string;
}

export default function Children({ parentId }: ChildrenProps) {
  const { toast } = useToast();

  const { data: children = [], isLoading: childrenLoading } = useQuery<any[]>({
    queryKey: ["/api/parents", parentId, "children"],
  });

  const { data: enrollmentRequests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/enrollment-requests", { parentId }],
    queryFn: async () => {
      const res = await fetch(`/api/enrollment-requests?parentId=${parentId}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch enrollment requests");
      return res.json();
    }
  });

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("PATCH", `/api/enrollment-requests/${requestId}/parent-approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === "/api/enrollment-requests" ||
          query.queryKey[0] === "/api/admin/courses" ||
          query.queryKey[0] === "/api/courses" ||
          query.queryKey[0] === "/api/enrollments"
      });
      toast({ title: "Enrollment approved - Student enrolled successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      return await apiRequest("PATCH", `/api/enrollment-requests/${requestId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === "/api/enrollment-requests" ||
          query.queryKey[0] === "/api/admin/courses" ||
          query.queryKey[0] === "/api/courses"
      });
      toast({ title: "Enrollment request rejected" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getChildName = (childId: string) => {
    const child = users.find(u => u.id === childId);
    return child ? `${child.firstName || ''} ${child.lastName || ''}`.trim() || child.name || 'Unknown' : 'Unknown';
  };

  const getCourseInfo = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course || { title: 'Unknown Course', description: '' };
  };

  const getChildEnrollments = async (childId: string) => {
    const res = await fetch(`/api/students/${childId}/enrollments`, {
      credentials: "include"
    });
    if (!res.ok) return [];
    return res.json();
  };

  const isLoading = childrenLoading || requestsLoading;

  const pendingRequests = enrollmentRequests.filter(r => r.status === 'requested');
  const approvedRequests = enrollmentRequests.filter(r => r.status === 'parent_approved' || r.status === 'admin_approved' || r.status === 'enrolled');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Children & Courses</h1>
        <p className="text-muted-foreground">
          View your children's enrolled courses and authorize enrollment requests
        </p>
      </div>

      {/* Pending Enrollment Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Pending Enrollment Requests
            </CardTitle>
            <CardDescription>
              Review and authorize course enrollment requests from your children
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-64 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              ))
            ) : (
              pendingRequests.map((request) => {
                const course = getCourseInfo(request.courseId);
                const childName = getChildName(request.studentId);
                
                return (
                  <div key={request.id} className="p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors" data-testid={`request-${request.id}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{course.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{childName}</span>
                          <Badge variant="outline" className="ml-2">{request.status}</Badge>
                        </div>
                        {request.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">Note: {request.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(request.id)}
                          disabled={approveMutation.isPending}
                          data-testid={`button-approve-${request.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Authorize
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectMutation.mutate({ requestId: request.id, reason: "Declined by parent" })}
                          disabled={rejectMutation.isPending}
                          data-testid={`button-reject-${request.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* Children with Enrolled Courses */}
      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : children.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-20 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-4 rounded-full bg-primary/10 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <GraduationCap className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">No children linked</h3>
                <p className="text-muted-foreground">
                  Your children's information will appear here once they're linked to your account.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          children.map((child) => {
            const childRequests = approvedRequests.filter(r => r.studentId === child.id);
            
            return (
              <ChildCard
                key={child.id}
                child={child}
                courses={courses}
                requests={childRequests}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function ChildCard({ child, courses, requests }: any) {
  const { data: enrollments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/students", child.id, "enrollments"],
  });

  const childName = `${child.firstName || ''} ${child.lastName || ''}`.trim() || child.name || 'Unknown';

  const enrolledCourses = enrollments.map(e => {
    const course = courses.find((c: any) => c.id === e.courseId);
    return { ...e, courseTitle: course?.title || 'Unknown Course', courseDescription: course?.description || '' };
  });

  return (
    <Card data-testid={`child-card-${child.id}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar name={childName} size="lg" />
            <div>
              <CardTitle className="text-xl">{childName}</CardTitle>
              <CardDescription>Student</CardDescription>
            </div>
          </div>
          <Badge variant="secondary">{enrolledCourses.length} Course{enrolledCourses.length !== 1 ? 's' : ''}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Child Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
          {child.email && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{child.email}</p>
            </div>
          )}
          {child.phone && (
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{child.phone}</p>
            </div>
          )}
          {child.address && (
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{child.address}</p>
            </div>
          )}
          {child.city && (
            <div>
              <p className="text-sm text-muted-foreground">City</p>
              <p className="font-medium">{child.city}</p>
            </div>
          )}
        </div>

        {requests.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Authorized Enrollments
              </h4>
              <div className="space-y-2">
                {requests.map((request: any) => {
                  const course = courses.find((c: any) => c.id === request.courseId);
                  return (
                    <div key={request.id} className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{course?.title || 'Unknown Course'}</span>
                        <Badge variant="secondary" className="capitalize">{request.status.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
