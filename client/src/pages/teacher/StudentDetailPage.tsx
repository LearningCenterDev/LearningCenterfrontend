import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  BookOpen,
  FileText,
  BarChart3,
  Calendar,
  CheckCircle,
  GraduationCap,
  ChevronRight,
  Clock,
  User,
  Users,
  Grid2x2,
  List,
  Table,
  Activity,
} from "lucide-react";
import { format } from "date-fns";

type User = {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  avatarUrl?: string;
  profileImageUrl?: string;
  createdAt?: string;
  phone?: string;
};

type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt?: string;
  status?: string;
};

type Course = {
  id: string;
  title: string;
  description?: string;
  subject: string;
  grade: string;
  isActive: boolean;
  teacherId: string;
};

type Submission = {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string;
  submittedAt?: string;
  grade?: number;
  feedback?: string;
};

type Assignment = {
  id: string;
  title: string;
  courseId: string;
  dueDate?: string;
  maxScore?: number;
};

type ParentChild = {
  id: string;
  parentId: string;
  childId: string;
};

type Schedule = {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  courseId?: string;
  studentIds?: string[];
};

type TeacherAssignment = {
  id: string;
  studentId: string;
  courseId: string;
  teacherId: string;
};

const messageFormSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Message content is required"),
});

// Type for teacher-scoped student data
type TeacherScopedStudentData = {
  student: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    profileImageUrl?: string;
  };
  courses: Array<{
    id: string;
    title: string;
    subject: string;
    grade: string;
    isActive: boolean;
    enrolledAt?: string;
  }>;
  submissions: Array<Submission & { assignmentTitle: string; courseId: string; courseTitle: string }>;
  grades: Array<{ id: string; submissionId: string; score: number; maxScore: number; feedback?: string }>;
  attendance: Array<{ id: string; studentId: string; courseId: string; date: string; status: string }>;
  assignments: Array<{ id: string; title: string; courseId: string; courseTitle: string; dueDate?: string; maxScore?: number }>;
};

export default function StudentDetailPage() {
  const { studentId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [courseViewMode, setCourseViewMode] = useState<'grid' | 'list' | 'table'>(() => {
    const saved = localStorage.getItem('studentDetailCourseView');
    return (saved as 'grid' | 'list' | 'table') || 'grid';
  });
  const [scheduleViewMode, setScheduleViewMode] = useState<'grid' | 'list' | 'table' | 'timeline'>(() => {
    const saved = localStorage.getItem('studentDetailScheduleView');
    return (saved as 'grid' | 'list' | 'table' | 'timeline') || 'list';
  });
  
  // Get current user
  const { data: currentUser, isLoading: currentUserLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const isTeacher = currentUser?.role === 'teacher';

  // Teacher-scoped query - only fetch when user is a teacher
  const { data: teacherScopedData, isLoading: teacherScopedLoading, isError: teacherScopedError } = useQuery<TeacherScopedStudentData>({
    queryKey: ["/api/teachers", currentUser?.id, "students", studentId],
    queryFn: async () => {
      const response = await fetch(`/api/teachers/${currentUser?.id}/students/${studentId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Access denied or student not found');
      }
      return response.json();
    },
    enabled: !!studentId && !!currentUser?.id && isTeacher,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Parallel queries - fetch only when NOT a teacher (admin, parent, student viewing self)
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: !isTeacher,
  });

  const { data: allEnrollments = [], isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: !isTeacher,
  });

  const { data: allCourses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: !isTeacher,
  });

  const { data: allSubmissions = [], isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/submissions"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: !isTeacher,
  });

  const { data: allAssignments = [], isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: !isTeacher,
  });

  // Additional parallel queries for comprehensive info (disabled for teachers)
  const { data: parentChildren = [], isLoading: parentsLoading } = useQuery<ParentChild[]>({
    queryKey: [`/api/parent-children?childId=${studentId}`],
    enabled: !!studentId && !isTeacher,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: !isTeacher,
  });

  const { data: teacherAssignments = [], isLoading: teacherAssignmentsLoading } = useQuery<TeacherAssignment[]>({
    queryKey: ["/api/teacher-assignments"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: !isTeacher,
  });

  // Message form
  const messageForm = useForm<z.infer<typeof messageFormSchema>>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      subject: "",
      content: "",
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof messageFormSchema>) => {
      return apiRequest("POST", "/api/messages", {
        senderId: currentUser?.id,
        recipientId: studentId,
        subject: data.subject,
        content: data.content,
        type: "general",
      });
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
      setIsMessageDialogOpen(false);
      messageForm.reset();
      // Invalidate both sender's and recipient's message caches
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", studentId, "messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Compute data differently based on whether user is a teacher
  const student = isTeacher && teacherScopedData
    ? teacherScopedData.student as User
    : allUsers.find(user => user.id === studentId);
  
  // For non-teachers, get student enrollments to look up enrollment dates
  const studentEnrollments = isTeacher 
    ? [] // Teachers get enrollment data from teacherScopedData.courses
    : allEnrollments.filter(e => e.studentId === studentId);
  
  const enrolledCourses = isTeacher && teacherScopedData
    ? teacherScopedData.courses.map(c => ({ ...c, teacherId: currentUser?.id || '' }))
    : allCourses.filter(course =>
        studentEnrollments.some(e => e.courseId === course.id)
      );
  
  const studentSubmissions = isTeacher && teacherScopedData
    ? teacherScopedData.submissions
    : allSubmissions.filter(s => s.studentId === studentId);
  
  // For teachers, we don't show schedules from other courses
  const studentSchedules = isTeacher 
    ? [] // Teachers don't see student schedules outside their courses
    : schedules.filter(s => {
        if (s.studentIds?.includes(studentId || '')) {
          return true;
        }
        if (s.courseId) {
          return enrolledCourses.some(c => c.id === s.courseId);
        }
        return false;
      });
  
  const studentTeacherAssignments = isTeacher
    ? [] // Teachers don't see teacher assignments info
    : teacherAssignments.filter(ta => ta.studentId === studentId);
  
  // Parent information - NOT available to teachers
  const parentRelation = isTeacher ? undefined : parentChildren.find(pc => pc.childId === studentId);
  const parentUser = isTeacher ? undefined : (parentRelation ? allUsers.find(u => u.id === parentRelation.parentId) : undefined);

  const totalSubmissions = studentSubmissions.length;
  const gradedSubmissions = isTeacher && teacherScopedData
    ? teacherScopedData.grades
    : studentSubmissions.filter(s => s.grade !== undefined && s.grade !== null);
  const averageGrade = gradedSubmissions.length > 0
    ? isTeacher && teacherScopedData
      ? teacherScopedData.grades.reduce((sum, g) => sum + g.score, 0) / teacherScopedData.grades.length
      : (gradedSubmissions as Submission[]).reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
    : 0;

  // Loading states differ based on user role
  const isLoading = currentUserLoading || (isTeacher 
    ? teacherScopedLoading
    : (usersLoading || enrollmentsLoading || coursesLoading || submissionsLoading || assignmentsLoading));

  const isLoadingAdditional = isTeacher
    ? false // Teachers don't load additional data
    : (parentsLoading || schedulesLoading || teacherAssignmentsLoading);

  // Handle access denied for teachers
  if (isTeacher && teacherScopedError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold text-destructive">Access Denied</div>
          <p className="text-muted-foreground mt-2">This student is not enrolled in any of your courses.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/students')}>
            Back to Students
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Student not found</div>
        </div>
      </div>
    );
  }

  const studentName = student.firstName && student.lastName
    ? `${student.firstName} ${student.lastName}`
    : student.name || student.email;

  const handleSendMessage = messageForm.handleSubmit((data) => {
    sendMessageMutation.mutate(data);
  });

  const handleCourseViewModeChange = (mode: 'grid' | 'list' | 'table') => {
    setCourseViewMode(mode);
    localStorage.setItem('studentDetailCourseView', mode);
  };

  const handleScheduleViewModeChange = (mode: 'grid' | 'list' | 'table' | 'timeline') => {
    setScheduleViewMode(mode);
    localStorage.setItem('studentDetailScheduleView', mode);
  };

  const getScheduleStatus = (startDate: Date, endDate: Date) => {
    const now = new Date();
    if (now < startDate) {
      return { status: 'upcoming', label: 'Upcoming', variant: 'outline' as const };
    } else if (now >= startDate && now <= endDate) {
      return { status: 'ongoing', label: 'Ongoing', variant: 'default' as const };
    } else {
      return { status: 'past', label: 'Past', variant: 'secondary' as const };
    }
  };

  // Filter to show only upcoming and ongoing schedules with valid dates (no past schedules)
  const upcomingStudentSchedules = studentSchedules.filter(schedule => {
    const startDate = schedule.startDate ? new Date(schedule.startDate) : null;
    const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
    const isValidStart = startDate && !isNaN(startDate.getTime());
    const isValidEnd = endDate && !isNaN(endDate.getTime());
    
    // Only show schedules with valid start AND end dates
    if (!isValidStart || !isValidEnd) return false;
    
    // Filter out past schedules, keep upcoming and ongoing
    const status = getScheduleStatus(startDate, endDate);
    return status.status !== 'past';
  }).sort((a, b) => {
    // Sort by start date - earliest first
    const aStart = a.startDate ? new Date(a.startDate).getTime() : Infinity;
    const bStart = b.startDate ? new Date(b.startDate).getTime() : Infinity;
    return aStart - bStart;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Student Overview Card with Cover Photo */}
      <Card className="overflow-hidden">
        {/* Cover Photo Background */}
        <div 
          className="h-48 bg-gradient-to-r from-primary/20 to-primary/10 bg-cover bg-center"
          data-testid="cover-photo"
        />
        
        <CardContent className="p-6 pt-0">
          <div className="flex items-start gap-6">
            {/* Avatar positioned to overlap cover photo */}
            <Avatar className="w-32 h-32 -mt-16 border-4 border-card ring-2 ring-card-border">
              <AvatarImage src={student.avatarUrl || student.profileImageUrl || undefined} />
              <AvatarFallback className="text-4xl">
                {student.firstName?.[0] || student.name?.[0] || student.email?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3 pt-4">
              <div>
                <h2 className="text-2xl font-semibold" data-testid="text-student-name">
                  {studentName}
                </h2>
                <p className="text-muted-foreground" data-testid="text-student-email">{student.email}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" data-testid="badge-role">
                  {student.role}
                </Badge>
                {student.createdAt && !isNaN(new Date(student.createdAt).getTime()) && (
                  <Badge variant="outline" data-testid="badge-joined">
                    Joined {format(new Date(student.createdAt), "MMM yyyy")}
                  </Badge>
                )}
                {parentUser && (
                  <Badge variant="outline" data-testid="badge-parent">
                    <Users className="w-3 h-3 mr-1" />
                    Parent: {parentUser.firstName && parentUser.lastName 
                      ? `${parentUser.firstName} ${parentUser.lastName}` 
                      : parentUser.email}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  data-testid="button-email-student"
                  onClick={() => window.location.href = `mailto:${student.email}`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Student
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  data-testid="button-message-student"
                  onClick={() => setIsMessageDialogOpen(true)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats with Lazy Loading */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold" data-testid="stat-enrolled-courses">
                  {enrolledCourses.length}
                </div>
                <div className="text-sm text-muted-foreground">Enrolled Courses</div>
              </div>
              <BookOpen className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold" data-testid="stat-submissions">
                  {totalSubmissions}
                </div>
                <div className="text-sm text-muted-foreground">Submissions</div>
              </div>
              <FileText className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold" data-testid="stat-average-grade">
                  {averageGrade > 0 ? averageGrade.toFixed(1) : "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">Average Grade</div>
              </div>
              <BarChart3 className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                {isLoadingAdditional ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold" data-testid="stat-schedules">
                    {studentSchedules.length}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">Schedules</div>
              </div>
              <Clock className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20" data-testid="student-tabs">
          <TabsTrigger 
            value="courses"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-courses"
          >
            Courses
          </TabsTrigger>
          <TabsTrigger 
            value="submissions"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-submissions"
          >
            Submissions
          </TabsTrigger>
          <TabsTrigger 
            value="performance"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-performance"
          >
            Performance
          </TabsTrigger>
          <TabsTrigger 
            value="teachers"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-teachers"
          >
            Teachers
          </TabsTrigger>
          <TabsTrigger 
            value="schedules"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-schedules"
          >
            Schedules
          </TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Enrolled Courses</h2>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <Button
                size="icon"
                variant={courseViewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => handleCourseViewModeChange('grid')}
                data-testid="button-view-grid"
              >
                <Grid2x2 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={courseViewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => handleCourseViewModeChange('list')}
                data-testid="button-view-list"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={courseViewMode === 'table' ? 'default' : 'ghost'}
                onClick={() => handleCourseViewModeChange('table')}
                data-testid="button-view-table"
              >
                <Table className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {enrolledCourses.length > 0 ? (
            <>
              {courseViewMode === 'grid' && (
                <div className="grid gap-4 md:grid-cols-2">
                  {enrolledCourses.map((course: any) => {
                    // For teachers, enrollment data is on the course object; for others, look it up
                    const enrollment = isTeacher 
                      ? { enrolledAt: course.enrolledAt, status: 'approved' }
                      : studentEnrollments.find(e => e.courseId === course.id);
                    const teacher = isTeacher ? currentUser : allUsers.find(u => u.id === course.teacherId);
                    return (
                      <Card
                        key={course.id}
                        className="cursor-pointer hover-elevate"
                        onClick={() => navigate(`/courses/${course.id}`)}
                        data-testid={`course-card-${course.id}`}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between gap-4">
                            <span className="text-base flex-1 min-w-0 truncate" data-testid={`course-title-${course.id}`}>
                              {course.title}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {course.isActive ? (
                                <Badge variant="default" className="text-xs">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                              )}
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.description || "No description available"}
                          </p>
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            <Badge variant="outline" className="text-xs">{course.subject}</Badge>
                            <Badge variant="outline" className="text-xs">Grade {course.grade}</Badge>
                            {enrollment?.status && (
                              <Badge variant="outline" className="text-xs">{enrollment.status}</Badge>
                            )}
                          </div>
                          {teacher && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              {teacher.firstName && teacher.lastName 
                                ? `${teacher.firstName} ${teacher.lastName}` 
                                : teacher.email}
                            </div>
                          )}
                          {enrollment?.enrolledAt && !isNaN(new Date(enrollment.enrolledAt).getTime()) && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              Enrolled: {format(new Date(enrollment.enrolledAt), "MMM d, yyyy")}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {courseViewMode === 'list' && (
                <div className="space-y-3">
                  {enrolledCourses.map((course: any) => {
                    // For teachers, enrollment data is on the course object; for others, look it up
                    const enrollment = isTeacher 
                      ? { enrolledAt: course.enrolledAt, status: 'approved' }
                      : studentEnrollments.find(e => e.courseId === course.id);
                    const teacher = isTeacher ? currentUser : allUsers.find(u => u.id === course.teacherId);
                    return (
                      <Card
                        key={course.id}
                        className="cursor-pointer hover-elevate"
                        onClick={() => navigate(`/courses/${course.id}`)}
                        data-testid={`course-list-item-${course.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base mb-2" data-testid={`course-title-${course.id}`}>
                                {course.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                {course.description || "No description available"}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {course.subject}
                                </span>
                                <span>Grade {course.grade}</span>
                                {teacher && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {teacher.firstName && teacher.lastName 
                                      ? `${teacher.firstName} ${teacher.lastName}` 
                                      : teacher.email}
                                  </span>
                                )}
                                {enrollment?.enrolledAt && !isNaN(new Date(enrollment.enrolledAt).getTime()) && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(enrollment.enrolledAt), "MMM d, yyyy")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {course.isActive ? (
                                <Badge variant="default" className="text-xs">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                              )}
                              {enrollment?.status && (
                                <Badge variant="outline" className="text-xs">{enrollment.status}</Badge>
                              )}
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {courseViewMode === 'table' && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-semibold">Course Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Subject</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Grade</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Teacher</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Enrolled Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrolledCourses.map((course: any, index) => {
                          // For teachers, enrollment data is on the course object; for others, look it up
                          const enrollment = isTeacher 
                            ? { enrolledAt: course.enrolledAt, status: 'approved' }
                            : studentEnrollments.find(e => e.courseId === course.id);
                          const teacher = isTeacher ? currentUser : allUsers.find(u => u.id === course.teacherId);
                          return (
                            <tr
                              key={course.id}
                              className={`border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                                index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                              }`}
                              onClick={() => navigate(`/courses/${course.id}`)}
                              data-testid={`course-table-row-${course.id}`}
                            >
                              <td className="px-4 py-3 text-sm font-medium">{course.title}</td>
                              <td className="px-4 py-3 text-sm">{course.subject}</td>
                              <td className="px-4 py-3 text-sm">Grade {course.grade}</td>
                              <td className="px-4 py-3 text-sm">
                                {teacher?.firstName && teacher?.lastName 
                                  ? `${teacher.firstName} ${teacher.lastName}` 
                                  : teacher?.email || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <Badge variant={course.isActive ? 'default' : 'secondary'} className="text-xs">
                                  {course.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {enrollment?.enrolledAt && !isNaN(new Date(enrollment.enrolledAt).getTime())
                                  ? format(new Date(enrollment.enrolledAt), "MMM d, yyyy")
                                  : "N/A"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-bold mb-2">No Courses Enrolled</h3>
                <p className="text-sm text-muted-foreground">
                  This student is not currently enrolled in any courses.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-4">
          <h2 className="text-2xl font-bold">Recent Submissions</h2>
          {studentSubmissions.length > 0 ? (
            <div className="space-y-3">
              {studentSubmissions.slice(0, 10).map((submission) => {
                // For teachers, use embedded data; for others, look up from allAssignments/allCourses
                const submissionWithDetails = submission as typeof submission & { assignmentTitle?: string; courseTitle?: string };
                const assignment = isTeacher ? null : allAssignments.find(a => a.id === submission.assignmentId);
                const course = isTeacher ? null : (assignment ? allCourses.find(c => c.id === assignment.courseId) : undefined);
                const assignmentTitle = isTeacher ? submissionWithDetails.assignmentTitle : assignment?.title;
                const courseTitle = isTeacher ? submissionWithDetails.courseTitle : course?.title;
                const maxScore = isTeacher 
                  ? teacherScopedData?.assignments?.find(a => a.id === submission.assignmentId)?.maxScore 
                  : assignment?.maxScore;
                
                return (
                  <Card 
                    key={submission.id} 
                    className="cursor-pointer hover-elevate" 
                    data-testid={`submission-card-${submission.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-1 truncate" data-testid={`submission-assignment-${submission.id}`}>
                            {assignmentTitle || "Assignment"}
                          </h3>
                          {courseTitle && (
                            <p className="text-xs text-muted-foreground mb-1">{courseTitle}</p>
                          )}
                          {submission.submittedAt && !isNaN(new Date(submission.submittedAt).getTime()) && (
                            <p className="text-xs text-muted-foreground mb-2">
                              Submitted: {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          )}
                          {submission.content && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {submission.content}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {submission.grade !== undefined && submission.grade !== null ? (
                            <Badge variant="default" data-testid={`submission-grade-${submission.id}`}>
                              {submission.grade}/{maxScore || 100}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" data-testid={`submission-status-${submission.id}`}>
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-bold mb-2">No Submissions</h3>
                <p className="text-sm text-muted-foreground">
                  This student has not submitted any assignments yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <h2 className="text-2xl font-bold">Performance Overview</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                  <span>Grade Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Graded:</span>
                  <span className="font-medium" data-testid="text-total-graded">{gradedSubmissions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Grade:</span>
                  <span className="font-medium" data-testid="text-avg-grade">
                    {averageGrade > 0 ? `${averageGrade.toFixed(1)}%` : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending Grading:</span>
                  <span className="font-medium" data-testid="text-pending-grading">
                    {totalSubmissions - gradedSubmissions.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <GraduationCap className="w-4 h-4 text-secondary" />
                  </div>
                  <span>Course Enrollment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Courses:</span>
                  <span className="font-medium" data-testid="text-total-courses">{enrolledCourses.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Courses:</span>
                  <span className="font-medium" data-testid="text-active-courses">
                    {enrolledCourses.filter(c => c.isActive).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-4">
          <h2 className="text-2xl font-bold">Assigned Teachers</h2>
          {isLoadingAdditional ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : studentTeacherAssignments.length > 0 ? (
            <div className="space-y-3">
              {studentTeacherAssignments.map((assignment) => {
                const course = allCourses.find(c => c.id === assignment.courseId);
                const teacher = allUsers.find(u => u.id === assignment.teacherId);
                return (
                  <Card key={assignment.id} data-testid={`teacher-assignment-${assignment.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={teacher?.avatarUrl || teacher?.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {teacher?.firstName?.[0] || teacher?.name?.[0] || "T"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">
                            {teacher?.firstName && teacher?.lastName 
                              ? `${teacher.firstName} ${teacher.lastName}` 
                              : teacher?.email || "Unknown Teacher"}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">{course?.title || "Unknown Course"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{course?.subject}</Badge>
                            <Badge variant="outline" className="text-xs">Grade {course?.grade}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-bold mb-2">No Teacher Assignments</h3>
                <p className="text-sm text-muted-foreground">
                  This student has no specific teacher assignments yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Upcoming Schedules</h2>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <Button
                size="icon"
                variant={scheduleViewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => handleScheduleViewModeChange('grid')}
                data-testid="button-schedule-view-grid"
              >
                <Grid2x2 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={scheduleViewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => handleScheduleViewModeChange('list')}
                data-testid="button-schedule-view-list"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={scheduleViewMode === 'table' ? 'default' : 'ghost'}
                onClick={() => handleScheduleViewModeChange('table')}
                data-testid="button-schedule-view-table"
              >
                <Table className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={scheduleViewMode === 'timeline' ? 'default' : 'ghost'}
                onClick={() => handleScheduleViewModeChange('timeline')}
                data-testid="button-schedule-view-timeline"
              >
                <Activity className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isLoadingAdditional ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingStudentSchedules.length > 0 ? (
            <>
              {scheduleViewMode === 'grid' && (
                <div className="grid gap-4 md:grid-cols-2">
                  {upcomingStudentSchedules.map((schedule) => {
                    const course = schedule.courseId ? allCourses.find(c => c.id === schedule.courseId) : undefined;
                    const startDate = schedule.startDate ? new Date(schedule.startDate) : null;
                    const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
                    const isValidStart = startDate && !isNaN(startDate.getTime());
                    const isValidEnd = endDate && !isNaN(endDate.getTime());
                    const scheduleStatus = isValidStart && isValidEnd ? getScheduleStatus(startDate, endDate) : null;
                    
                    return (
                      <Card key={schedule.id} data-testid={`schedule-grid-${schedule.id}`}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-base flex-1 min-w-0">{schedule.title}</h3>
                              {scheduleStatus && (
                                <Badge variant={scheduleStatus.variant} className="text-xs flex-shrink-0">
                                  {scheduleStatus.label}
                                </Badge>
                              )}
                            </div>
                            {schedule.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{schedule.description}</p>
                            )}
                            <div className="space-y-2 pt-2 border-t">
                              {isValidStart && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Calendar className="w-3 h-3 text-primary" />
                                  <span className="font-medium">{format(startDate, "MMM d, yyyy")}</span>
                                </div>
                              )}
                              {isValidStart && isValidEnd && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Clock className="w-3 h-3 text-primary" />
                                  <span>{format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}</span>
                                </div>
                              )}
                              {course && (
                                <div className="flex items-center gap-2 text-xs">
                                  <BookOpen className="w-3 h-3 text-primary" />
                                  <span>{course.title}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {scheduleViewMode === 'list' && (
                <div className="space-y-3">
                  {upcomingStudentSchedules.map((schedule) => {
                    const course = schedule.courseId ? allCourses.find(c => c.id === schedule.courseId) : undefined;
                    const startDate = schedule.startDate ? new Date(schedule.startDate) : null;
                    const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
                    const isValidStart = startDate && !isNaN(startDate.getTime());
                    const isValidEnd = endDate && !isNaN(endDate.getTime());
                    const scheduleStatus = isValidStart && isValidEnd ? getScheduleStatus(startDate, endDate) : null;
                    
                    return (
                      <Card key={schedule.id} data-testid={`schedule-list-${schedule.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-2">
                              <h3 className="font-semibold text-base">{schedule.title}</h3>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                {isValidStart && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(startDate, "MMM d, yyyy")}
                                  </span>
                                )}
                                {isValidStart && isValidEnd && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                                  </span>
                                )}
                                {course && (
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    {course.title}
                                  </span>
                                )}
                              </div>
                              {schedule.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">{schedule.description}</p>
                              )}
                            </div>
                            {scheduleStatus && (
                              <Badge variant={scheduleStatus.variant} className="text-xs flex-shrink-0">
                                {scheduleStatus.label}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {scheduleViewMode === 'table' && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Course</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingStudentSchedules.map((schedule, index) => {
                          const course = schedule.courseId ? allCourses.find(c => c.id === schedule.courseId) : undefined;
                          const startDate = schedule.startDate ? new Date(schedule.startDate) : null;
                          const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
                          const isValidStart = startDate && !isNaN(startDate.getTime());
                          const isValidEnd = endDate && !isNaN(endDate.getTime());
                          const scheduleStatus = isValidStart && isValidEnd ? getScheduleStatus(startDate, endDate) : null;
                          
                          return (
                            <tr
                              key={schedule.id}
                              className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}
                              data-testid={`schedule-table-row-${schedule.id}`}
                            >
                              <td className="px-4 py-3 text-sm font-medium">{schedule.title}</td>
                              <td className="px-4 py-3 text-sm">
                                {isValidStart ? format(startDate, "MMM d, yyyy") : "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {isValidStart && isValidEnd 
                                  ? `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`
                                  : "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm">{course?.title || "N/A"}</td>
                              <td className="px-4 py-3 text-sm">
                                {scheduleStatus && (
                                  <Badge variant={scheduleStatus.variant} className="text-xs">
                                    {scheduleStatus.label}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {scheduleViewMode === 'timeline' && (
                <div className="space-y-4">
                  {upcomingStudentSchedules.map((schedule) => {
                    const course = schedule.courseId ? allCourses.find(c => c.id === schedule.courseId) : undefined;
                    const startDate = schedule.startDate ? new Date(schedule.startDate) : null;
                    const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
                    const isValidStart = startDate && !isNaN(startDate.getTime());
                    const isValidEnd = endDate && !isNaN(endDate.getTime());
                    const scheduleStatus = isValidStart && isValidEnd ? getScheduleStatus(startDate, endDate) : null;
                    
                    return (
                      <div key={schedule.id} className="flex gap-4" data-testid={`schedule-timeline-${schedule.id}`}>
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            scheduleStatus?.status === 'ongoing' ? 'border-primary bg-primary' :
                            scheduleStatus?.status === 'upcoming' ? 'border-blue-400 bg-blue-100' :
                            'border-gray-300 bg-gray-100'
                          }`} />
                          <div className="w-1 flex-1 bg-muted mt-2" />
                        </div>
                        <div className="flex-1 pb-8">
                          <Card className="hover-elevate">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-base">{schedule.title}</h3>
                                {scheduleStatus && (
                                  <Badge variant={scheduleStatus.variant} className="text-xs flex-shrink-0">
                                    {scheduleStatus.label}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mb-2 space-y-1">
                                {isValidStart && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    {format(startDate, "MMMM d, yyyy")}
                                  </div>
                                )}
                                {isValidStart && isValidEnd && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                                  </div>
                                )}
                                {course && (
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="w-3 h-3" />
                                    {course.title}
                                  </div>
                                )}
                              </div>
                              {schedule.description && (
                                <p className="text-xs text-muted-foreground">{schedule.description}</p>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-bold mb-2">No Schedules</h3>
                <p className="text-sm text-muted-foreground">
                  This student has no upcoming scheduled events.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent data-testid="dialog-send-message">
          <DialogHeader>
            <DialogTitle>Send Message to {studentName}</DialogTitle>
            <DialogDescription>
              Send a message to the student through the internal messaging system.
            </DialogDescription>
          </DialogHeader>
          <Form {...messageForm}>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <FormField
                control={messageForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter message subject" 
                        {...field}
                        data-testid="input-message-subject"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={messageForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your message" 
                        rows={6}
                        {...field}
                        data-testid="textarea-message-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMessageDialogOpen(false)}
                  data-testid="button-cancel-message"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sendMessageMutation.isPending}
                  data-testid="button-send-message-submit"
                >
                  {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
