import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  BookOpen,
  Users,
  FileText,
  Bell,
  ChevronLeft,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  BarChart3,
  Send,
  Mail,
  MessageCircle,
  GraduationCap,
  Target,
  AlertCircle,
  XCircle,
  Settings,
  Lightbulb,
  ListChecks,
  Wrench,
  Trash2,
} from "lucide-react";
import type { Course, User, Enrollment, Assignment, Announcement, AssignmentWithStats, CourseResource } from "@shared/schema";
import { format } from "date-fns";
import { CourseResources } from "@/components/CourseResources";
import { AssignmentFormModal } from "@/components/AssignmentFormModal";
import { AssignmentDetailsModal } from "@/components/AssignmentDetailsModal";
import { CourseCoverImage } from "@/components/CourseCoverImage";
import { CurriculumProgress } from "@/components/CurriculumProgress";

interface TeacherCoursePageProps {
  courseId: string;
  teacherId: string;
}

export default function TeacherCoursePage({ courseId, teacherId }: TeacherCoursePageProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [notifyParents, setNotifyParents] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithStats | null>(null);
  const [isAssignmentDetailsOpen, setIsAssignmentDetailsOpen] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<User | null>(null);
  const [selectedProgressStudent, setSelectedProgressStudent] = useState<string | null>(null);

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
  });

  // Fetch current teacher user
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users", teacherId],
  });

  // Fetch students explicitly assigned to this teacher in this course
  const { data: students = [] } = useQuery<User[]>({
    queryKey: ["/api/courses", courseId, "assigned-students", teacherId],
  });

  // Fetch course enrollments
  const { data: enrollments = [] } = useQuery<Enrollment[]>({
    queryKey: ["/api/courses", courseId, "enrollments"],
  });

  // Fetch course assignments with stats - show all assignments on course details page
  const { data: assignments = [] } = useQuery<AssignmentWithStats[]>({
    queryKey: ["/api/courses", courseId, "assignments"],
  });

  // Fetch announcements
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/courses", courseId, "announcements"],
  });

  // Fetch course resources for count badge
  const { data: resources = [] } = useQuery<CourseResource[]>({
    queryKey: ["/api/courses", courseId, "resources"],
  });

  // Fetch grading data for selected student's assignments
  type GradingData = {
    submissions: Array<{
      id: string;
      studentId: string;
      studentName: string;
      content?: string;
      submittedAt?: string;
      grade?: { score: number; feedback?: string };
    }>;
  };
  
  // Compute student's submitted assignments when modal is open
  const studentAssignmentsData = useMemo(() => {
    if (!selectedStudentForModal) return [];
    
    // For each published assignment, we'll show if the student submitted
    return assignments
      .filter(a => a.isPublished)
      .map(assignment => ({
        ...assignment,
        hasSubmission: false, // Will be determined when we fetch grading data
      }));
  }, [selectedStudentForModal, assignments]);

  // Create announcement mutation with targeted recipients
  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; studentIds: string[]; notifyParents: boolean }) => {
      const announcementResponse = await apiRequest("POST", "/api/announcements", {
        title: data.title,
        content: data.content,
        courseId,
        authorId: teacherId,
        isPublished: true,
      });
      const announcement = await announcementResponse.json();
      
      if (data.studentIds.length > 0) {
        await apiRequest("POST", `/api/announcements/${announcement.id}/recipients`, {
          studentIds: data.studentIds,
          notifyParents: data.notifyParents,
        });
      }
      
      return announcement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      toast({
        title: "Announcement Created",
        description: selectedStudentIds.length > 0 
          ? `Your announcement has been sent to ${selectedStudentIds.length} student(s).`
          : "Your announcement has been posted successfully.",
      });
      setIsAnnouncementDialogOpen(false);
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setSelectedStudentIds([]);
      setNotifyParents(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create announcement. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      return apiRequest("DELETE", `/api/announcements/${announcementId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parents"] });
      toast({
        title: "Announcement Deleted",
        description: "The announcement has been removed from all student dashboards.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete announcement. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (courseLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Course Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The course you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate("/courses")} data-testid="button-back-to-courses">
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeStudents = students.length;
  const publishedAssignments = assignments.filter(a => a.isPublished).length;
  const totalAssignments = publishedAssignments;
  const recentAnnouncements = announcements.slice(0, 5);

  const handleCreateAnnouncement = () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }

    createAnnouncementMutation.mutate({
      title: announcementTitle,
      content: announcementContent,
      studentIds: selectedStudentIds.length > 0 ? selectedStudentIds : students.map(s => s.id),
      notifyParents,
    });
  };

  const handleSelectAllStudents = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(students.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleStudentSelect = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(prev => [...prev, studentId]);
    } else {
      setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="teacher-course-page">
      {/* Header with Back Button */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-start">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/courses")}
          className="hover-elevate"
          data-testid="button-back"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Card with Cover Image */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <Card className="border-0 shadow-md overflow-hidden">
          {course && <CourseCoverImage course={course} courseId={courseId} isAdmin={false} />}

          {/* Course Info */}
          <CardContent className="p-8">
            <div className="flex items-start justify-between gap-6 mb-6">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-3" data-testid="course-title">
                  {course.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 font-medium">
                    <GraduationCap className="w-3 h-3 mr-1" />
                    {course.subject}
                  </Badge>
                  <Badge className="bg-purple-500 hover:bg-purple-600 text-white border-0 font-medium">
                    Grade {course.grade}
                  </Badge>
                </div>
              </div>
              
              <div className="shrink-0">
                {course.isActive ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 px-4 py-1.5">
                    <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="px-4 py-1.5">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
            
            {course.description && (
              <p className="text-muted-foreground text-base leading-relaxed">
                {course.description}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

      {/* Modern Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20" data-testid="course-tabs">
          <TabsTrigger 
            value="overview"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-overview"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="curriculum"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-curriculum"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Curriculum
          </TabsTrigger>
          <TabsTrigger 
            value="students"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-students"
          >
            <Users className="w-4 h-4 mr-2" />
            Students
            <Badge variant="secondary" className="ml-2 px-2 py-0.5">
              {activeStudents}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="assignments"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-assignments"
          >
            <FileText className="w-4 h-4 mr-2" />
            Assignments
            <Badge variant="secondary" className="ml-2 px-2 py-0.5">
              {totalAssignments}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="announcements"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-announcements"
          >
            <Bell className="w-4 h-4 mr-2" />
            Announcements
            <Badge variant="secondary" className="ml-2 px-2 py-0.5">
              {announcements.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="resources"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-resources"
          >
            <FileText className="w-4 h-4 mr-2" />
            Resources
            <Badge variant="secondary" className="ml-2 px-2 py-0.5">
              {resources.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="grading"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-grading"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Grading
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Course Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Course Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Subject:</span> {course.subject}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Grade Level:</span> {course.grade}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Enrolled Students:</span> {activeStudents}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Status:</span>{" "}
                    {course.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentAnnouncements.length > 0 ? (
                  recentAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                      <Bell className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{announcement.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {announcement.createdAt && format(new Date(announcement.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent announcements</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Course Details Section */}
          {(course.philosophy || course.prerequisites || course.learningObjectives || course.practicalSessions) && (
            <Card data-testid="course-details-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Course Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.philosophy && (
                  <div className="space-y-2" data-testid="course-philosophy">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Course Philosophy</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{course.philosophy}</p>
                  </div>
                )}
                
                {course.prerequisites && (
                  <div className="space-y-2" data-testid="course-prerequisites">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Prerequisites</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{course.prerequisites}</p>
                  </div>
                )}
                
                {course.learningObjectives && (
                  <div className="space-y-2" data-testid="course-learning-objectives">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Learning Objectives</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">{course.learningObjectives}</p>
                  </div>
                )}
                
                {course.practicalSessions && (
                  <div className="space-y-2" data-testid="course-practical-sessions">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Practical Sessions</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">{course.practicalSessions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => setIsAnnouncementDialogOpen(true)}
                  data-testid="button-quick-announcement"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => setIsAssignmentModalOpen(true)}
                  data-testid="button-quick-assignment"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => setActiveTab("students")}
                  data-testid="button-quick-students"
                >
                  <Users className="w-4 h-4 mr-2" />
                  View Students
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Enrolled Students</h2>
            <Badge variant="secondary" data-testid="students-count">
              {students.length} {students.length === 1 ? "Student" : "Students"}
            </Badge>
          </div>

          {students.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {students.map((student) => {
                const enrollment = enrollments.find(e => e.studentId === student.id);
                return (
                  <Card 
                    key={student.id} 
                    className="transition-all hover-elevate cursor-pointer" 
                    onClick={() => setSelectedStudentForModal(student)}
                    data-testid={`student-card-${student.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={student.avatarUrl || student.profileImageUrl || undefined} />
                          <AvatarFallback className="text-lg">
                            {student.firstName?.[0] || student.name?.[0] || student.email?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-semibold truncate leading-tight" data-testid={`student-name-${student.id}`}>
                            {student.firstName && student.lastName
                              ? `${student.firstName} ${student.lastName}`
                              : student.name || student.email}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                          {enrollment?.enrolledAt && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                              <Calendar className="w-3 h-3" />
                              <span>Enrolled {format(new Date(enrollment.enrolledAt), "MMM d, yyyy")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Students Enrolled</h3>
                <p className="text-muted-foreground">
                  Students will appear here once they enroll in your course.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Course Assignments</h2>
            <Button onClick={() => setIsAssignmentModalOpen(true)} data-testid="button-create-assignment">
              <Plus className="w-4 h-4 mr-2" />
              Create Assignment
            </Button>
          </div>

          {assignments.filter(a => a.isPublished).length > 0 ? (
            <div className="space-y-3">
              {assignments.filter(a => a.isPublished).map((assignment) => {
                const isFullyGraded = (assignment.stats?.totalSubmissions ?? 0) > 0 && 
                                     (assignment.stats?.ungradedCount ?? 0) === 0;
                
                return (
                  <Card 
                    key={assignment.id} 
                    className="hover-elevate cursor-pointer" 
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setIsAssignmentDetailsOpen(true);
                    }}
                    data-testid={`assignment-card-${assignment.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium" data-testid={`assignment-title-${assignment.id}`}>
                              {assignment.title}
                            </h3>
                            <Badge variant="default" className="text-xs">Published</Badge>
                            {isFullyGraded && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" data-testid={`assignment-completed-badge-${assignment.id}`}>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {assignment.description || "No description"}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {assignment.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                              </span>
                            )}
                            {assignment.maxScore && (
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                Max Score: {assignment.maxScore}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Assignments Yet</h3>
                <p className="text-muted-foreground">
                  Assignments created for this course will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4" data-testid="tab-content-resources">
          {currentUser && (
            <CourseResources 
              courseId={courseId} 
              currentUser={currentUser} 
              canManage={true}
              teacherId={teacherId}
            />
          )}
        </TabsContent>

        {/* Curriculum Tab - Progress Tracking */}
        <TabsContent value="curriculum" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-muted/20 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Curriculum Progress</CardTitle>
                  <CardDescription className="mt-1.5">
                    Track student progress through the official curriculum. Mark units as complete to notify students and parents.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {students.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="progress-student-select" className="shrink-0">Select Student:</Label>
                    <Select 
                      value={selectedProgressStudent || ""} 
                      onValueChange={setSelectedProgressStudent}
                    >
                      <SelectTrigger id="progress-student-select" className="max-w-xs" data-testid="select-progress-student">
                        <SelectValue placeholder="Choose a student..." />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.firstName && student.lastName
                              ? `${student.firstName} ${student.lastName}`
                              : student.name || student.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedProgressStudent && (
                    <CurriculumProgress
                      courseId={courseId}
                      studentId={selectedProgressStudent}
                      student={students.find(s => s.id === selectedProgressStudent)!}
                      isTeacher={true}
                    />
                  )}

                  {!selectedProgressStudent && (
                    <div className="text-center py-12 border rounded-lg border-dashed">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Select a Student</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Choose a student from the dropdown above to view and manage their curriculum progress.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Students Enrolled</h3>
                  <p className="text-muted-foreground">
                    There are no students enrolled in this course yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Course Announcements</h2>
            <Button
              onClick={() => setIsAnnouncementDialogOpen(true)}
              data-testid="button-create-announcement"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Announcement
            </Button>
          </div>

          {announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="hover-elevate" data-testid={`announcement-card-${announcement.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base" data-testid={`announcement-title-${announcement.id}`}>
                          {announcement.title}
                        </CardTitle>
                        {announcement.createdAt && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(announcement.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                          disabled={deleteAnnouncementMutation.isPending}
                          data-testid={`button-delete-announcement-${announcement.id}`}
                          className="h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Announcements Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first announcement to communicate with your students.
                </p>
                <Button
                  onClick={() => setIsAnnouncementDialogOpen(true)}
                  data-testid="button-create-first-announcement"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Grading Tab */}
        <TabsContent value="grading" className="space-y-4">
          {(() => {
            // Filter to only show assignments that have graded submissions
            const gradedAssignments = assignments.filter(a => (a.stats?.gradedCount ?? 0) > 0);
            
            return (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Grading & Assessment</h2>
                  <Badge variant="secondary" data-testid="total-assignments-count">
                    {gradedAssignments.length} Graded {gradedAssignments.length === 1 ? "Assignment" : "Assignments"}
                  </Badge>
                </div>

                {gradedAssignments.length > 0 ? (
                  <div className="space-y-4">
                    {gradedAssignments.map((assignment) => {
                const totalSubmissions = assignment.stats?.totalSubmissions ?? 0;
                const gradedCount = assignment.stats?.gradedCount ?? 0;
                const ungradedCount = assignment.stats?.ungradedCount ?? 0;
                const isFullyGraded = totalSubmissions > 0 && ungradedCount === 0;
                const gradingProgress = totalSubmissions > 0 ? (gradedCount / totalSubmissions) * 100 : 0;

                return (
                  <Card 
                    key={assignment.id} 
                    className="hover-elevate cursor-pointer"
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setIsAssignmentDetailsOpen(true);
                    }}
                    data-testid={`grading-assignment-card-${assignment.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 overflow-hidden">
                              <h3 className="font-semibold text-base flex-1 min-w-0 truncate" data-testid={`grading-assignment-title-${assignment.id}`}>
                                {assignment.title}
                              </h3>
                              {isFullyGraded && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 flex-shrink-0">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  All Graded
                                </Badge>
                              )}
                              {ungradedCount > 0 && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 flex-shrink-0">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {ungradedCount} Pending
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              {assignment.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Due: {format(new Date(assignment.dueDate), "MMM d, yyyy 'at' h:mm a")}
                                </span>
                              )}
                              {assignment.maxScore && (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  Max: {assignment.maxScore} pts
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Grading Stats - Compact Inline */}
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Submissions:</span>
                            <span className="font-semibold" data-testid={`total-submissions-${assignment.id}`}>
                              {totalSubmissions}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Graded:</span>
                            <span className="font-semibold text-green-600 dark:text-green-400" data-testid={`graded-count-${assignment.id}`}>
                              {gradedCount}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Pending:</span>
                            <span className="font-semibold text-yellow-600 dark:text-yellow-400" data-testid={`ungraded-count-${assignment.id}`}>
                              {ungradedCount}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar - Compact */}
                        {totalSubmissions > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div
                                className="bg-green-600 dark:bg-green-400 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${gradingProgress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{Math.round(gradingProgress)}%</span>
                          </div>
                        )}

                        {/* No Submissions Message */}
                        {totalSubmissions === 0 && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileText className="w-3 h-3" />
                            <span>No submissions yet</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                    );
                  })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Graded Assignments</h3>
                      <p className="text-muted-foreground">
                        Assignments with graded submissions will appear here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* Assignment Form Modal */}
      <AssignmentFormModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        teacherId={teacherId}
        courseId={courseId}
      />

      {/* Create Announcement Dialog */}
      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="dialog-create-announcement">
          <DialogHeader>
            <DialogTitle>Create Targeted Announcement</DialogTitle>
            <DialogDescription>
              Send an announcement to specific students in this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                placeholder="Enter announcement title"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                data-testid="input-announcement-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-content">Content</Label>
              <Textarea
                id="announcement-content"
                placeholder="Enter announcement content"
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                rows={4}
                data-testid="textarea-announcement-content"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Recipients</Label>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="select-all-students"
                    checked={selectedStudentIds.length === students.length && students.length > 0}
                    onCheckedChange={(checked) => handleSelectAllStudents(checked as boolean)}
                    data-testid="checkbox-select-all-students"
                  />
                  <Label htmlFor="select-all-students" className="text-sm font-normal cursor-pointer">
                    Select All ({students.length})
                  </Label>
                </div>
              </div>
              
              {students.length > 0 ? (
                <ScrollArea className="h-40 border rounded-md p-3">
                  <div className="space-y-2">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center gap-3 py-1.5 px-2 hover-elevate rounded-md" data-testid={`student-recipient-${student.id}`}>
                        <Checkbox
                          id={`student-${student.id}`}
                          checked={selectedStudentIds.includes(student.id)}
                          onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                          data-testid={`checkbox-student-${student.id}`}
                        />
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={student.avatarUrl || student.profileImageUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {student.firstName?.[0] || student.name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <Label htmlFor={`student-${student.id}`} className="flex-1 text-sm font-normal cursor-pointer">
                          {student.firstName && student.lastName
                            ? `${student.firstName} ${student.lastName}`
                            : student.name || student.email}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4 border rounded-md">
                  No students enrolled in this course yet.
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                {selectedStudentIds.length === 0 
                  ? "No students selected - announcement will be sent to all enrolled students"
                  : `${selectedStudentIds.length} student(s) selected`}
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <Switch
                id="notify-parents"
                checked={notifyParents}
                onCheckedChange={setNotifyParents}
                data-testid="switch-notify-parents"
              />
              <div className="space-y-0.5">
                <Label htmlFor="notify-parents" className="text-sm font-medium cursor-pointer">
                  Notify Parents
                </Label>
                <p className="text-xs text-muted-foreground">
                  Send notification to parents of selected students
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAnnouncementDialogOpen(false);
                setAnnouncementTitle("");
                setAnnouncementContent("");
                setSelectedStudentIds([]);
                setNotifyParents(true);
              }}
              data-testid="button-cancel-announcement"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAnnouncement}
              disabled={createAnnouncementMutation.isPending || students.length === 0}
              data-testid="button-post-announcement"
            >
              <Send className="w-4 h-4 mr-2" />
              {createAnnouncementMutation.isPending ? "Posting..." : "Send Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Details Modal */}
      <AssignmentDetailsModal
        isOpen={isAssignmentDetailsOpen}
        onClose={() => {
          setIsAssignmentDetailsOpen(false);
          setSelectedAssignment(null);
        }}
        assignment={selectedAssignment}
        courseId={courseId}
        teacherId={teacherId}
      />

      {/* Student Assignments Modal */}
      <Dialog open={!!selectedStudentForModal} onOpenChange={(open) => !open && setSelectedStudentForModal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" data-testid="dialog-student-assignments">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedStudentForModal?.avatarUrl || selectedStudentForModal?.profileImageUrl || undefined} />
                <AvatarFallback>
                  {selectedStudentForModal?.firstName?.[0] || selectedStudentForModal?.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <span>
                  {selectedStudentForModal?.firstName && selectedStudentForModal?.lastName
                    ? `${selectedStudentForModal.firstName} ${selectedStudentForModal.lastName}`
                    : selectedStudentForModal?.name || selectedStudentForModal?.email}
                </span>
                <p className="text-sm font-normal text-muted-foreground">Assignments in {course?.title}</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              View all assignments and submission status for this student.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3 py-4">
              {studentAssignmentsData.length > 0 ? (
                studentAssignmentsData.map((assignment) => {
                  const hasSubmissions = (assignment.stats?.totalSubmissions ?? 0) > 0;
                  const isGraded = (assignment.stats?.gradedCount ?? 0) > 0;
                  
                  return (
                    <Card 
                      key={assignment.id} 
                      className="hover-elevate cursor-pointer"
                      onClick={() => {
                        setSelectedStudentForModal(null);
                        setSelectedAssignment(assignment);
                        setIsAssignmentDetailsOpen(true);
                      }}
                      data-testid={`student-assignment-${assignment.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{assignment.title}</h4>
                            {assignment.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                {assignment.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {assignment.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                                </span>
                              )}
                              {assignment.maxScore && (
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  Max: {assignment.maxScore} pts
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {hasSubmissions ? (
                              isGraded ? (
                                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Graded
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Submitted
                                </Badge>
                              )
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {assignment.stats?.totalSubmissions ?? 0} submissions
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Assignments</h3>
                  <p className="text-sm text-muted-foreground">
                    There are no published assignments in this course.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
