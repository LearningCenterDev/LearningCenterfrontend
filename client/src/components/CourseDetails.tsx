import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Clock,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  GraduationCap,
  User as UserIcon,
  Mail,
  Globe,
  Zap,
  TrendingUp,
  BarChart3,
  PlayCircle,
  PauseCircle,
  ChevronRight,
  Star,
  Target,
  Lightbulb,
  ListChecks,
  Layers,
  Wrench,
  Download,
  Link as LinkIcon,
  Paperclip,
  List,
  Grid3x3,
  Table2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { EnrollmentRequestModal } from "@/components/EnrollmentRequestModal";
import { CourseResources } from "@/components/CourseResources";
import { StudentAssignmentDetailModal } from "@/components/StudentAssignmentDetailModal";
import { CourseCoverImage } from "@/components/CourseCoverImage";
import type { Course, Assignment, Announcement, Enrollment, EnrollmentRequest, AssignmentAttachment, Submission, Grade, CourseResource } from "@shared/schema";
import type { User } from "@shared/schema";

interface CourseDetailsProps {
  courseId: string;
  currentUser: User;
  onNavigateBack?: () => void;
}

interface CourseWithDetails extends Course {
  teacherName?: string;
  teacherEmail?: string;
  enrollmentCount?: number;
  isEnrolled?: boolean;
  enrollmentRequest?: EnrollmentRequest;
  activationStatus?: "active" | "draft" | "pending_parent" | "parent_authorized" | "pending_admin" | "rejected" | "access_restricted";
}

// Component to display assignment attachments
function AssignmentAttachments({ assignmentId }: { assignmentId: string }) {
  const { data: attachments = [] } = useQuery<AssignmentAttachment[]>({
    queryKey: ["/api/assignments", assignmentId, "attachments"],
  });

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t">
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Paperclip className="w-4 h-4" />
        Assignment Materials
      </h4>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
            {attachment.type === "file" ? (
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
            ) : (
              <LinkIcon className="w-4 h-4 text-primary flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {attachment.fileName || "Attachment"}
              </p>
              {attachment.fileSize && (
                <p className="text-xs text-muted-foreground">
                  {(attachment.fileSize / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(attachment.url, '_blank')}
              data-testid={`button-download-${attachment.id}`}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to determine assignment badge status
function getAssignmentBadge(
  assignment: Assignment,
  submission?: Submission | null,
  grade?: Grade | null
): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  // Priority: Graded > Submitted > Overdue > Active
  
  if (grade) {
    return { label: "Graded", variant: "default" };
  }
  
  if (submission) {
    return { label: "Submitted", variant: "outline" };
  }
  
  const now = new Date();
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  
  if (dueDate && dueDate < now) {
    return { label: "Overdue", variant: "destructive" };
  }
  
  return { label: "Active", variant: "secondary" };
}

export function CourseDetails({ courseId, currentUser, onNavigateBack }: CourseDetailsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(new Set());
  const [assignmentViewMode, setAssignmentViewMode] = useState<'list' | 'grid' | 'table'>('list');

  useEffect(() => {
    const savedMode = localStorage.getItem(`course-assignments-view-${courseId}`);
    if (savedMode === 'grid' || savedMode === 'table') {
      setAssignmentViewMode(savedMode);
    }
  }, [courseId]);

  // Listen for curriculum updates via WebSocket
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'curriculum_updated' && message.courseId === courseId) {
          // Invalidate the course query to fetch latest curriculum data
          queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
        }
      } catch (error) {
        // Silently ignore parsing errors
      }
    };

    const ws = (window as any).__ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, [courseId, queryClient]);

  const handleViewModeChange = (mode: 'list' | 'grid' | 'table') => {
    setAssignmentViewMode(mode);
    localStorage.setItem(`course-assignments-view-${courseId}`, mode);
  };

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  // Fetch student-teacher assignment (for students only) - Must be before teacher query
  const { data: teacherAssignment } = useQuery({
    queryKey: ["/api/student-teacher-assignments", { studentId: currentUser.id, courseId }],
    queryFn: async () => {
      const response = await fetch(`/api/student-teacher-assignments/student/${currentUser.id}`);
      if (!response.ok) return null;
      const assignments = await response.json();
      return assignments.find((a: any) => a.courseId === courseId);
    },
    enabled: currentUser.role === "student" && !!courseId,
  });

  // Fetch teacher details - use assigned teacher for students, default teacher for others
  const teacherIdToFetch = currentUser.role === "student" 
    ? (teacherAssignment?.teacherId || course?.teacherId)
    : course?.teacherId;
    
  const { data: teacher } = useQuery<User>({
    queryKey: ["/api/users", teacherIdToFetch],
    enabled: !!teacherIdToFetch,
  });

  // Fetch course enrollments
  const { data: enrollments = [] } = useQuery<Enrollment[]>({
    queryKey: ["/api/courses", courseId, "enrollments"],
    enabled: !!courseId,
  });

  // Fetch enrolled students details (for teachers and admin only)
  const shouldFetchStudents = currentUser.role === "teacher" || currentUser.role === "admin";
  const { data: enrolledStudents = [] } = useQuery<User[]>({
    queryKey: ["/api/courses", courseId, "enrolled-students"],
    queryFn: async () => {
      if (enrollments.length === 0) return [];
      
      const studentIds = enrollments.map(e => e.studentId);
      const uniqueStudentIds = Array.from(new Set(studentIds));
      
      const students = await Promise.all(
        uniqueStudentIds.map(async (studentId) => {
          const response = await fetch(`/api/users/${studentId}`);
          if (!response.ok) return null;
          return response.json();
        })
      );
      
      return students.filter(s => s !== null) as User[];
    },
    enabled: !!courseId && shouldFetchStudents && enrollments.length > 0,
  });

  // Fetch student enrollment status (for students only)
  const { data: studentEnrollments = [] } = useQuery<Enrollment[]>({
    queryKey: ["/api/students", currentUser.id, "enrollments"],
    enabled: currentUser.role === "student",
  });

  // Fetch enrollment requests (for students only)
  const { data: enrollmentRequests = [] } = useQuery<EnrollmentRequest[]>({
    queryKey: ["/api/enrollment-requests", { studentId: currentUser.id, courseId }],
    queryFn: async () => {
      const response = await fetch(`/api/enrollment-requests?studentId=${currentUser.id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: currentUser.role === "student",
  });

  // Fetch course activation request (role-based access)
  const { data: activationRequest, error: activationError } = useQuery({
    queryKey: ["/api/courses", courseId, "activation-request"],
    enabled: !!courseId && !course?.isActive,
    retry: (failureCount, error: any) => {
      // Don't retry on 403/404
      return !error?.message?.includes('403') && !error?.message?.includes('404') && failureCount < 3;
    },
  });

  // Fetch course assignments
  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/courses", courseId, "assignments"],
    enabled: !!courseId,
  });

  // Fetch course announcements
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/courses", courseId, "announcements"],
    enabled: !!courseId,
  });

  // Fetch course resources for count badge
  const { data: resources = [] } = useQuery<CourseResource[]>({
    queryKey: ["/api/courses", courseId, "resources"],
    enabled: !!courseId,
  });

  // Fetch student submissions (for students only)
  const { data: studentSubmissions = [] } = useQuery<Submission[]>({
    queryKey: ["/api/students", currentUser.id, "submissions"],
    enabled: currentUser.role === "student",
  });

  // Fetch student grades (for students only)
  const { data: studentGrades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/grades/student", currentUser.id],
    enabled: currentUser.role === "student",
  });

  // Fetch student course progress (for students only)
  const { data: studentProgress } = useQuery<{
    totalUnits: number;
    completedUnits: number;
    progressPercentage: number;
    units: any[];
  }>({
    queryKey: ["/api/courses", courseId, "progress", currentUser.id],
    enabled: currentUser.role === "student" && !!courseId,
  });

  // Create memoized lookup maps for O(1) access
  const submissionsByAssignmentId = useMemo(() => 
    Object.fromEntries(studentSubmissions.map(s => [s.assignmentId, s])),
    [studentSubmissions]
  );

  const gradesBySubmissionId = useMemo(() => 
    Object.fromEntries(studentGrades.map(g => [g.submissionId, g])),
    [studentGrades]
  );

  // Filter valid assignments (remove blank/invalid ones)
  const validAssignments = assignments.filter(a => 
    a.title && a.title.trim() !== ''
  );

  // For students, filter assignments by their assigned teacher
  const displayAssignments = currentUser.role === "student"
    ? (teacherAssignment
        ? validAssignments.filter(a => a.teacherId === teacherAssignment.teacherId)
        : []) // Students without assigned teacher see no assignments
    : validAssignments;

  // Calculate derived data
  const hasParentApprovedRequest = enrollmentRequests.some(
    r => r.courseId === courseId && r.status === 'parent_approved'
  );
  
  const courseWithDetails: CourseWithDetails | undefined = course ? {
    ...course,
    teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown Teacher",
    teacherEmail: teacher?.email || "",
    enrollmentCount: enrollments.length,
    isEnrolled: studentEnrollments.some(e => e.courseId === courseId && e.approvalStatus === 'approved') || hasParentApprovedRequest,
    enrollmentRequest: enrollmentRequests.find(r => r.courseId === courseId && !['enrolled', 'rejected'].includes(r.status)),
    activationStatus: course.isActive ? "active" : 
      (activationError && activationError.message?.includes('403') ? "access_restricted" : 
       (activationRequest && typeof activationRequest === 'object' && 'status' in activationRequest ? 
        activationRequest.status as "draft" | "pending_parent" | "parent_authorized" | "pending_admin" | "rejected" : "draft"))
  } : undefined;

  const completedAssignments = displayAssignments.filter(a => a.dueDate && new Date(a.dueDate) < new Date()).length;
  const upcomingAssignments = displayAssignments.filter(a => a.dueDate && new Date(a.dueDate) >= new Date()).length;
  const recentAnnouncements = announcements.slice(0, 3);

  // Determine course access level for current user
  const getCourseAccessState = (): "full" | "preview" | "restricted" => {
    // Admins and teachers can see full details
    if (currentUser.role === "admin" || currentUser.role === "teacher") {
      return "full";
    }
    
    // Students need to be enrolled AND have a teacher assigned
    if (currentUser.role === "student") {
      const isEnrolled = courseWithDetails?.isEnrolled || false;
      const hasTeacherAssigned = !!teacherAssignment;
      
      // Full access only if enrolled and has teacher
      if (isEnrolled && hasTeacherAssigned) {
        return "full";
      }
      
      // Preview for browsing
      return "preview";
    }
    
    // Parents can see preview
    return "preview";
  };

  const accessState = getCourseAccessState();

  // Mutation to toggle course active status
  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/courses/${courseId}/toggle-status`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle course status');
      }
      return response.json();
    },
    onSuccess: (updatedCourse) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && (
            key.startsWith('/api/students') || 
            key.startsWith('/api/enrollments')
          );
        }
      });
      toast({
        title: "Course status updated",
        description: updatedCourse.isActive 
          ? "Course is now active and visible to students" 
          : "Course is now inactive and hidden from students",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update course status",
        variant: "destructive",
      });
    },
  });

  const canManageCourse = currentUser.role === "admin" || 
    (currentUser.role === "teacher" && course?.teacherId === currentUser.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" data-testid="status-active"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "draft":
        return <Badge variant="secondary" data-testid="status-draft"><FileText className="w-3 h-3 mr-1" />Draft</Badge>;
      case "access_restricted":
        return <Badge variant="outline" className="border-gray-200 text-gray-700 dark:border-gray-800 dark:text-gray-300" data-testid="status-access-restricted"><AlertCircle className="w-3 h-3 mr-1" />Access Restricted</Badge>;
      case "pending_parent":
        return <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300" data-testid="status-pending-parent"><Clock className="w-3 h-3 mr-1" />Pending Parent</Badge>;
      case "parent_authorized":
        return <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300" data-testid="status-parent-authorized"><UserIcon className="w-3 h-3 mr-1" />Parent Authorized</Badge>;
      case "pending_admin":
        return <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300" data-testid="status-pending-admin"><AlertCircle className="w-3 h-3 mr-1" />Pending Admin</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid="status-rejected"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`status-${status}`}>{status}</Badge>;
    }
  };

  const getEnrollmentStatusBadge = () => {
    if (!courseWithDetails?.enrollmentRequest) return null;
    
    const { status } = courseWithDetails.enrollmentRequest;
    switch (status) {
      case "requested":
        return <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300" data-testid="enrollment-status-requested"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "parent_approved":
        return <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300" data-testid="enrollment-status-parent-approved"><UserIcon className="w-3 h-3 mr-1" />Parent Approved</Badge>;
      case "admin_approved":
        return <Badge variant="outline" className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-300" data-testid="enrollment-status-admin-approved"><CheckCircle className="w-3 h-3 mr-1" />Admin Approved</Badge>;
      case "enrolled":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" data-testid="enrollment-status-enrolled"><CheckCircle className="w-3 h-3 mr-1" />Enrolled</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid="enrollment-status-rejected"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`enrollment-status-${status}`}>{status}</Badge>;
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center p-8 px-6" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!courseWithDetails) {
    return (
      <div className="px-6 py-8">
        <Card className="p-8 text-center" data-testid="course-not-found">
          <CardContent>
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Course Not Found</h3>
            <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist or you don't have permission to view it.</p>
            {onNavigateBack && (
              <Button onClick={onNavigateBack} variant="outline" data-testid="button-go-back">
                Go Back
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-7xl px-6 py-8" data-testid="course-details">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        {onNavigateBack && (
          <Button variant="ghost" onClick={onNavigateBack} data-testid="button-back">←</Button>
        )}
      </div>
      {/* Card with Cover Image */}
      <Card className="border-0 shadow-md overflow-hidden" data-testid="course-header-card">
        {courseWithDetails && <CourseCoverImage course={courseWithDetails} courseId={courseId} isAdmin={false} />}

        {/* Course Info */}
        <CardContent className="p-8">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-3" data-testid="course-title">
                {courseWithDetails.title}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 font-medium" data-testid="course-subject">
                  <GraduationCap className="w-3 h-3 mr-1" />
                  {courseWithDetails.subject}
                </Badge>
                <Badge className="bg-purple-500 hover:bg-purple-600 text-white border-0 font-medium" data-testid="course-grade">
                  Grade {courseWithDetails.grade}
                </Badge>
                {courseWithDetails.duration && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 font-medium" data-testid="course-duration">
                    <Calendar className="w-3 h-3 mr-1" />
                    {courseWithDetails.duration}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="shrink-0 flex flex-col gap-2">
              {courseWithDetails.isActive ? (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 px-4 py-1.5">
                  <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="px-4 py-1.5">
                  Inactive
                </Badge>
              )}
              {courseWithDetails.isEnrolled && (
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" data-testid="badge-enrolled">
                  <CheckCircle className="w-3 h-3 mr-1" />Enrolled
                </Badge>
              )}
              {courseWithDetails.enrollmentRequest && getEnrollmentStatusBadge()}
              {canManageCourse && (
                <div className="flex items-center gap-2 p-2 border rounded-lg" data-testid="course-visibility-toggle">
                  <Label htmlFor="course-active-toggle" className="text-sm font-medium cursor-pointer">
                    {courseWithDetails.isActive ? 'Visible' : 'Hidden'}
                  </Label>
                  <Switch
                    id="course-active-toggle"
                    checked={courseWithDetails.isActive ?? false}
                    onCheckedChange={() => toggleStatusMutation.mutate()}
                    disabled={toggleStatusMutation.isPending}
                    data-testid="switch-course-status"
                  />
                </div>
              )}
            </div>
          </div>
          
          {courseWithDetails.description && (
            <p className="text-muted-foreground text-base leading-relaxed mb-6" data-testid="course-description">
              {courseWithDetails.description}
            </p>
          )}

          {/* Course Progress Bar for Students */}
          {currentUser.role === "student" && studentProgress && studentProgress.totalUnits > 0 && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/30" data-testid="student-course-progress">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="font-medium">Your Progress</span>
                </div>
                <span className="text-sm font-semibold text-primary" data-testid="progress-percentage">
                  {studentProgress.progressPercentage}%
                </span>
              </div>
              <Progress value={studentProgress.progressPercentage} className="h-3" data-testid="progress-bar" />
              <p className="text-xs text-muted-foreground mt-2" data-testid="progress-units">
                {studentProgress.completedUnits} of {studentProgress.totalUnits} units completed
              </p>
            </div>
          )}

          {/* Teacher Info and Additional Details */}
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3" data-testid="teacher-info">
              <Avatar>
                <AvatarFallback>
                  {courseWithDetails.teacherName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium" data-testid="teacher-name">{courseWithDetails.teacherName}</p>
                <p className="text-sm text-muted-foreground" data-testid="teacher-email">{courseWithDetails.teacherEmail}</p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              {courseWithDetails.startDate && (
                <div className="text-right" data-testid="course-start-date">
                  <div className="text-muted-foreground">Start Date</div>
                  <div className="font-medium">{formatDate(courseWithDetails.startDate)}</div>
                </div>
              )}
              <div className="text-right" data-testid="course-created-date">
                <div className="text-muted-foreground">Created</div>
                <div className="font-medium">{formatDate(courseWithDetails.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6" data-testid="course-actions">
            {currentUser.role === "teacher" && courseWithDetails.teacherId === currentUser.id && (
              <Button 
                variant="outline" 
                data-testid="button-manage"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Manage Course
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Show preview for non-enrolled students, full tabs for enrolled students with teachers */}
      {accessState === "preview" && (
        <Card data-testid="course-preview">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Course Information
            </CardTitle>
            <CardDescription>
              {currentUser.role === "student" && courseWithDetails?.isEnrolled && !teacherAssignment
                ? "Your enrollment has been approved! A teacher will be assigned soon to give you full access to course content."
                : "Enroll in this course to access assignments, resources, and detailed content"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Course Details Section */}
            {(courseWithDetails.philosophy || courseWithDetails.prerequisites || courseWithDetails.learningObjectives || courseWithDetails.topicsCovered || courseWithDetails.practicalSessions) && (
              <div className="space-y-4">
                {courseWithDetails.philosophy && (
                  <div className="space-y-2" data-testid="course-philosophy-preview">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Course Philosophy</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{courseWithDetails.philosophy}</p>
                  </div>
                )}
                
                {courseWithDetails.prerequisites && (
                  <div className="space-y-2" data-testid="course-prerequisites-preview">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Prerequisites</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{courseWithDetails.prerequisites}</p>
                  </div>
                )}
                
                {courseWithDetails.learningObjectives && (
                  <div className="space-y-2" data-testid="course-learning-objectives-preview">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Learning Objectives</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">{courseWithDetails.learningObjectives}</p>
                  </div>
                )}
                
                {courseWithDetails.topicsCovered && (
                  <div className="space-y-2" data-testid="course-topics-covered-preview">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Topics Covered</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">{courseWithDetails.topicsCovered}</p>
                  </div>
                )}
                
                {courseWithDetails.practicalSessions && (
                  <div className="space-y-2" data-testid="course-practical-sessions-preview">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Practical Sessions</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">{courseWithDetails.practicalSessions}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Course Details Tabs - Only for enrolled students with teachers, teachers, and admins */}
      {accessState === "full" && (
        <Tabs defaultValue={currentUser.role === "student" ? "curriculum" : "overview"} className="w-full space-y-6" data-testid="course-tabs">
        <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20 flex-wrap" data-testid="course-tabs-list">
          {currentUser.role !== "student" && (
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2" data-testid="tab-overview">
              <BookOpen className="w-4 h-4" />
              Overview
            </TabsTrigger>
          )}
          <TabsTrigger value="curriculum" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2" data-testid="tab-curriculum">
            <Layers className="w-4 h-4" />
            Curriculum
          </TabsTrigger>
          <TabsTrigger value="assignments" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2" data-testid="tab-assignments">
            <FileText className="w-4 h-4" />
            Assignments
            <Badge variant="secondary" className="ml-1 bg-[#2FBF71] text-white">{displayAssignments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2" data-testid="tab-announcements">
            <MessageSquare className="w-4 h-4" />
            Announcements
            <Badge variant="secondary" className="ml-1 bg-[#2FBF71] text-white">{announcements.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resources" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2" data-testid="tab-resources">
            <Download className="w-4 h-4" />
            Resources
            <Badge variant="secondary" className="ml-1 bg-[#2FBF71] text-white">{resources.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2" data-testid="tab-statistics">
            <BarChart3 className="w-4 h-4" />
            Statistics
          </TabsTrigger>
          {shouldFetchStudents && (
            <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2" data-testid="tab-students">
              <Users className="w-4 h-4" />
              Students
              <Badge variant="secondary" className="ml-1 bg-[#2FBF71] text-white">{enrollments.length}</Badge>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4" data-testid="tab-content-overview">
          {/* Course Details Section */}
          {(courseWithDetails.philosophy || courseWithDetails.prerequisites || courseWithDetails.learningObjectives || courseWithDetails.topicsCovered || courseWithDetails.practicalSessions) && (
            <Card data-testid="course-details-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Course Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {courseWithDetails.philosophy && (
                  <div className="space-y-2" data-testid="course-philosophy">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Course Philosophy</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{courseWithDetails.philosophy}</p>
                  </div>
                )}
                
                {courseWithDetails.prerequisites && (
                  <div className="space-y-2" data-testid="course-prerequisites">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Prerequisites</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{courseWithDetails.prerequisites}</p>
                  </div>
                )}
                
                {courseWithDetails.learningObjectives && (
                  <div className="space-y-2" data-testid="course-learning-objectives">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Learning Objectives</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">{courseWithDetails.learningObjectives}</p>
                  </div>
                )}
                
                {courseWithDetails.topicsCovered && (
                  <div className="space-y-2" data-testid="course-topics-covered">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Topics Covered</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">{courseWithDetails.topicsCovered}</p>
                  </div>
                )}
                
                {courseWithDetails.practicalSessions && (
                  <div className="space-y-2" data-testid="course-practical-sessions">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Practical Sessions</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">{courseWithDetails.practicalSessions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Assignments */}
            <Card data-testid="recent-assignments-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Recent Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {displayAssignments.slice(0, 3).length > 0 ? (
                  <div className="space-y-3">
                    {displayAssignments.slice(0, 3).map((assignment) => {
                      const submission = submissionsByAssignmentId[assignment.id];
                      const grade = submission ? gradesBySubmissionId[submission.id] : null;
                      const badgeInfo = getAssignmentBadge(assignment, submission, grade);
                      
                      return (
                        <div 
                          key={assignment.id} 
                          className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover-elevate" 
                          onClick={() => setSelectedAssignmentId(assignment.id)}
                          data-testid={`assignment-item-${assignment.id}`}
                        >
                          <div>
                            <p className="font-medium" data-testid={`assignment-title-${assignment.id}`}>{assignment.title}</p>
                            <p className="text-sm text-muted-foreground" data-testid={`assignment-due-${assignment.id}`}>
                              Due: {formatDate(assignment.dueDate)}
                            </p>
                          </div>
                          <Badge variant={badgeInfo.variant} data-testid={`assignment-status-${assignment.id}`}>
                            {badgeInfo.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4" data-testid="no-assignments-message">No assignments yet</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Announcements */}
            <Card data-testid="recent-announcements-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Recent Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentAnnouncements.length > 0 ? (
                  <div className="space-y-3">
                    {recentAnnouncements.map((announcement) => (
                      <div key={announcement.id} className="p-3 border rounded-lg" data-testid={`announcement-item-${announcement.id}`}>
                        <p className="font-medium" data-testid={`announcement-title-${announcement.id}`}>{announcement.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`announcement-content-${announcement.id}`}>
                          {announcement.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2" data-testid={`announcement-date-${announcement.id}`}>
                          {formatDate(announcement.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4" data-testid="no-announcements-message">No announcements yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-4" data-testid="tab-content-curriculum">
          <Card data-testid="curriculum-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Course Curriculum
              </CardTitle>
              <CardDescription>Course modules and learning structure</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Display curriculum units with subsections if available */}
              {(course as any)?.curriculumUnits && (course as any).curriculumUnits.length > 0 ? (
                <div className="space-y-4">
                  {(course as any).curriculumUnits.map((unit: any, index: number) => (
                    <div key={unit.id} className="p-4 border rounded-lg" data-testid={`curriculum-module-${index}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
                          <span className="text-sm font-semibold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base mb-2" data-testid={`curriculum-heading-${index}`}>
                            {unit.title}
                          </h4>
                          {unit.description && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3" data-testid={`curriculum-description-${index}`}>
                              {unit.description}
                            </p>
                          )}
                          {/* Display teacher-added subsections (topics) */}
                          {unit.subsections && unit.subsections.length > 0 && (
                            <div className="mt-3 pl-4 border-l-2 border-primary/20 space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topics</p>
                              {unit.subsections.map((subsection: any, subIndex: number) => (
                                <div key={subsection.id} className="py-2" data-testid={`curriculum-topic-${index}-${subIndex}`}>
                                  <p className="text-sm font-medium">{subsection.title}</p>
                                  {subsection.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{subsection.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : courseWithDetails.curriculum && courseWithDetails.curriculum.length > 0 ? (
                /* Fallback to old curriculum format if no curriculum units */
                <div className="space-y-4">
                  {courseWithDetails.curriculum.map((module, index) => (
                    <div key={index} className="p-4 border rounded-lg" data-testid={`curriculum-module-${index}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
                          <span className="text-sm font-semibold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base mb-2" data-testid={`curriculum-heading-${index}`}>
                            {module.heading}
                          </h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid={`curriculum-description-${index}`}>
                            {module.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8" data-testid="no-curriculum-placeholder">
                  <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No curriculum has been defined for this course yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4" data-testid="tab-content-assignments">
          <Card data-testid="all-assignments-card">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>All Assignments</CardTitle>
                <CardDescription>
                  {currentUser.role === "student" 
                    ? "View assignments from your assigned teacher (read-only)" 
                    : "View all assignments for this course"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 border rounded-lg p-1" data-testid="assignment-view-mode-buttons">
                <Button
                  size="sm"
                  variant={assignmentViewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => handleViewModeChange('list')}
                  data-testid="button-view-list"
                  className="hover-elevate"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={assignmentViewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => handleViewModeChange('grid')}
                  data-testid="button-view-grid"
                  className="hover-elevate"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={assignmentViewMode === 'table' ? 'default' : 'ghost'}
                  onClick={() => handleViewModeChange('table')}
                  data-testid="button-view-table"
                  className="hover-elevate"
                >
                  <Table2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {displayAssignments.length > 0 ? (
                <>
                  {assignmentViewMode === 'list' && (
                    <div className="space-y-3">
                      {displayAssignments.map((assignment) => {
                        const submission = submissionsByAssignmentId[assignment.id];
                        const grade = submission ? gradesBySubmissionId[submission.id] : null;
                        const badgeInfo = getAssignmentBadge(assignment, submission, grade);
                        const isExpanded = expandedAssignments.has(assignment.id);
                        
                        const toggleExpand = () => {
                          setExpandedAssignments(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(assignment.id)) {
                              newSet.delete(assignment.id);
                            } else {
                              newSet.add(assignment.id);
                            }
                            return newSet;
                          });
                        };
                        
                        return (
                          <div 
                            key={assignment.id}
                            className="border rounded-lg hover-elevate transition-all"
                            data-testid={`full-assignment-item-${assignment.id}`}
                          >
                            <div 
                              className="p-4 cursor-pointer"
                              onClick={toggleExpand}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-base mb-1" data-testid={`full-assignment-title-${assignment.id}`}>
                                    {assignment.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {assignment.description || "No description"}
                                  </p>
                                </div>
                                <Badge 
                                  variant={badgeInfo.variant}
                                  className="flex-shrink-0"
                                  data-testid={`full-assignment-status-${assignment.id}`}
                                >
                                  {badgeInfo.label}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1" data-testid={`full-assignment-due-${assignment.id}`}>
                                  <Calendar className="w-3 h-3" />
                                  Due: {formatDate(assignment.dueDate)}
                                </span>
                                <span className="flex items-center gap-1" data-testid={`full-assignment-score-${assignment.id}`}>
                                  <Target className="w-3 h-3" />
                                  Max Score: {assignment.maxScore || 100}
                                </span>
                                {submission?.submittedAt && (
                                  <span className="flex items-center gap-1" data-testid={`full-assignment-submitted-${assignment.id}`}>
                                    <CheckCircle className="w-3 h-3" />
                                    Submitted: {formatDate(submission.submittedAt)}
                                  </span>
                                )}
                                {grade && (
                                  <span className="flex items-center gap-1" data-testid={`full-assignment-grade-${assignment.id}`}>
                                    <Star className="w-3 h-3" />
                                    Score: {grade.score}/{assignment.maxScore || 100}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-4 pb-4 pt-0 border-t">
                                {assignment.description && (
                                  <div className="mt-3">
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid={`full-assignment-description-${assignment.id}`}>
                                      {assignment.description}
                                    </p>
                                  </div>
                                )}
                                <AssignmentAttachments assignmentId={assignment.id} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {assignmentViewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayAssignments.map((assignment) => {
                        const submission = submissionsByAssignmentId[assignment.id];
                        const grade = submission ? gradesBySubmissionId[submission.id] : null;
                        const badgeInfo = getAssignmentBadge(assignment, submission, grade);
                        
                        return (
                          <div 
                            key={assignment.id}
                            className="border rounded-lg p-4 hover-elevate transition-all cursor-pointer"
                            onClick={() => setSelectedAssignmentId(assignment.id)}
                            data-testid={`grid-assignment-item-${assignment.id}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-sm line-clamp-2 flex-1" data-testid={`grid-assignment-title-${assignment.id}`}>
                                {assignment.title}
                              </h4>
                              <Badge 
                                variant={badgeInfo.variant}
                                className="flex-shrink-0 ml-2"
                                data-testid={`grid-assignment-status-${assignment.id}`}
                              >
                                {badgeInfo.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {assignment.description || "No description"}
                            </p>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1" data-testid={`grid-assignment-due-${assignment.id}`}>
                                <Calendar className="w-3 h-3" />
                                {formatDate(assignment.dueDate)}
                              </div>
                              <div className="flex items-center gap-1" data-testid={`grid-assignment-score-${assignment.id}`}>
                                <Target className="w-3 h-3" />
                                Max Score: {assignment.maxScore || 100}
                              </div>
                              {submission?.submittedAt && (
                                <div className="flex items-center gap-1 pt-1" data-testid={`grid-assignment-submitted-${assignment.id}`}>
                                  <CheckCircle className="w-3 h-3" />
                                  Submitted: {formatDate(submission.submittedAt)}
                                </div>
                              )}
                              {grade && (
                                <div className="flex items-center gap-1" data-testid={`grid-assignment-grade-${assignment.id}`}>
                                  <Star className="w-3 h-3" />
                                  Score: {grade.score}/{assignment.maxScore || 100}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {assignmentViewMode === 'table' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Assignment</th>
                            <th className="text-left p-3 font-semibold">Due Date</th>
                            <th className="text-left p-3 font-semibold">Max Score</th>
                            <th className="text-left p-3 font-semibold">Submitted On</th>
                            <th className="text-left p-3 font-semibold">Score</th>
                            <th className="text-left p-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayAssignments.map((assignment) => {
                            const submission = submissionsByAssignmentId[assignment.id];
                            const grade = submission ? gradesBySubmissionId[submission.id] : null;
                            const badgeInfo = getAssignmentBadge(assignment, submission, grade);
                            
                            return (
                              <tr 
                                key={assignment.id}
                                className="border-b hover-elevate cursor-pointer transition-all"
                                onClick={() => setSelectedAssignmentId(assignment.id)}
                                data-testid={`table-assignment-row-${assignment.id}`}
                              >
                                <td className="p-3">
                                  <div>
                                    <p className="font-medium" data-testid={`table-assignment-title-${assignment.id}`}>
                                      {assignment.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {assignment.description}
                                    </p>
                                  </div>
                                </td>
                                <td className="p-3 text-muted-foreground" data-testid={`table-assignment-due-${assignment.id}`}>
                                  {formatDate(assignment.dueDate)}
                                </td>
                                <td className="p-3 text-muted-foreground" data-testid={`table-assignment-score-${assignment.id}`}>
                                  {assignment.maxScore || 100}
                                </td>
                                <td className="p-3 text-muted-foreground" data-testid={`table-assignment-submitted-${assignment.id}`}>
                                  {submission?.submittedAt ? formatDate(submission.submittedAt) : "—"}
                                </td>
                                <td className="p-3 text-muted-foreground" data-testid={`table-assignment-grade-${assignment.id}`}>
                                  {grade ? `${grade.score}/${assignment.maxScore || 100}` : "—"}
                                </td>
                                <td className="p-3">
                                  <Badge 
                                    variant={badgeInfo.variant}
                                    data-testid={`table-assignment-status-${assignment.id}`}
                                  >
                                    {badgeInfo.label}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8" data-testid="no-assignments-placeholder">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {currentUser.role === "student"
                      ? "No assignments from your assigned teacher yet"
                      : "No assignments have been created yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4" data-testid="tab-content-announcements">
          <Card data-testid="all-announcements-card">
            <CardHeader>
              <CardTitle>All Announcements</CardTitle>
              <CardDescription>Latest news and updates for this course</CardDescription>
            </CardHeader>
            <CardContent>
              {announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="p-4 border rounded-lg" data-testid={`full-announcement-item-${announcement.id}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium" data-testid={`full-announcement-title-${announcement.id}`}>{announcement.title}</h4>
                        <span className="text-xs text-muted-foreground" data-testid={`full-announcement-date-${announcement.id}`}>
                          {formatDate(announcement.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid={`full-announcement-content-${announcement.id}`}>
                        {announcement.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8" data-testid="no-announcements-placeholder">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No announcements have been posted yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4" data-testid="tab-content-resources">
          <CourseResources 
            courseId={courseId} 
            currentUser={currentUser} 
            canManage={canManageCourse}
          />
        </TabsContent>

        {shouldFetchStudents && (
          <TabsContent value="students" className="space-y-4" data-testid="tab-content-students">
            <Card data-testid="enrolled-students-card">
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>List of all students enrolled in this course</CardDescription>
              </CardHeader>
              <CardContent>
                {enrolledStudents.length > 0 ? (
                  <div className="space-y-3">
                    {enrolledStudents.map((student) => {
                      const enrollment = enrollments.find(e => e.studentId === student.id);
                      return (
                        <div 
                          key={student.id} 
                          className="flex items-center justify-between p-4 border rounded-lg hover-elevate" 
                          data-testid={`student-item-${student.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {student.firstName && student.lastName 
                                  ? `${student.firstName[0]}${student.lastName[0]}`.toUpperCase()
                                  : student.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium" data-testid={`student-name-${student.id}`}>
                                {student.firstName && student.lastName 
                                  ? `${student.firstName} ${student.lastName}`
                                  : student.name || 'Unknown Student'}
                              </p>
                              <p className="text-sm text-muted-foreground" data-testid={`student-email-${student.id}`}>
                                {student.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Enrolled</p>
                              <p data-testid={`student-enrolled-date-${student.id}`}>
                                {enrollment?.enrolledAt 
                                  ? formatDate(enrollment.enrolledAt)
                                  : 'Unknown'}
                              </p>
                            </div>
                            <Badge 
                              variant="secondary" 
                              data-testid={`student-status-${student.id}`}
                            >
                              Active
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="no-students-placeholder">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No students enrolled yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="statistics" className="space-y-4" data-testid="tab-content-statistics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="stat-enrolled-students">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Enrolled Students</p>
                    <p className="text-2xl font-bold" data-testid="stat-enrolled-count">{courseWithDetails.enrollmentCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="stat-total-assignments">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Assignments</p>
                    <p className="text-2xl font-bold" data-testid="stat-assignments-count">{displayAssignments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="stat-upcoming-assignments">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg dark:bg-amber-900">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                    <p className="text-2xl font-bold" data-testid="stat-upcoming-count">{upcomingAssignments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="stat-total-announcements">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                    <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Announcements</p>
                    <p className="text-2xl font-bold" data-testid="stat-announcements-count">{announcements.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Timeline */}
          <Card data-testid="activity-timeline-card">
            <CardHeader>
              <CardTitle>Course Activity</CardTitle>
              <CardDescription>Recent course activity and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg" data-testid="activity-course-created">
                  <div className="p-1 bg-green-100 rounded-full dark:bg-green-900">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="font-medium">Course Created</p>
                    <p className="text-sm text-muted-foreground" data-testid="activity-created-date">
                      {formatDate(courseWithDetails.createdAt)}
                    </p>
                  </div>
                </div>
                {courseWithDetails.isActive && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg" data-testid="activity-course-activated">
                    <div className="p-1 bg-blue-100 rounded-full dark:bg-blue-900">
                      <PlayCircle className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="font-medium">Course Activated</p>
                      <p className="text-sm text-muted-foreground">Available for enrollment</p>
                    </div>
                  </div>
                )}
                {displayAssignments.length > 0 && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg" data-testid="activity-assignments-added">
                    <div className="p-1 bg-purple-100 rounded-full dark:bg-purple-900">
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div>
                      <p className="font-medium">Assignments Added</p>
                      <p className="text-sm text-muted-foreground" data-testid="activity-assignments-count">{displayAssignments.length} assignments created</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
      {/* Assignment Detail Modal */}
      {selectedAssignmentId && (
        <StudentAssignmentDetailModal
          assignmentId={selectedAssignmentId}
          studentId={currentUser.id}
          isOpen={!!selectedAssignmentId}
          onClose={() => setSelectedAssignmentId(null)}
          readOnly={true}
        />
      )}
    </div>
  );
}