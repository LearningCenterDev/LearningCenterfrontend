import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Check, X, UserPlus, ChevronLeft, BookOpen, Users, Calendar, GraduationCap, Trash2, Plus, Clock, LogOut, Edit } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseEditModal } from "@/components/CourseEditModal";
import { CourseCoverImage } from "@/components/CourseCoverImage";
import type { Course, User, StudentTeacherAssignment } from "@shared/schema";

interface AdminCoursePageProps {
  courseId: string;
  adminId: string;
}

interface EnrollmentWithStudent {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  approvalStatus: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  student: User;
}

export default function AdminCoursePage({ courseId, adminId }: AdminCoursePageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithStudent | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isAssignTeacherDialogOpen, setIsAssignTeacherDialogOpen] = useState(false);
  const [isUnenrollDialogOpen, setIsUnenrollDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [editingCurriculum, setEditingCurriculum] = useState<Array<{ heading: string; description: string }>>([]);
  const [editingCurriculumIndex, setEditingCurriculumIndex] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
  });

  // Initialize curriculum when course loads
  useEffect(() => {
    if (course?.curriculum && Array.isArray(course.curriculum)) {
      setEditingCurriculum(course.curriculum);
    }
  }, [course]);

  // Fetch enrollments for this course
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<EnrollmentWithStudent[]>({
    queryKey: ["/api/courses", courseId, "enrollments"],
    enabled: !!courseId,
  });

  // Fetch all teachers
  const { data: allTeachers = [] } = useQuery<User[]>({
    queryKey: ['/api/users', { role: 'teacher' }],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      const users: User[] = await response.json();
      return users.filter(u => u.role === 'teacher');
    },
  });

  // Fetch student-teacher assignments for this course
  const { data: teacherAssignments = [] } = useQuery<StudentTeacherAssignment[]>({
    queryKey: [`/api/student-teacher-assignments/course/${courseId}`],
    enabled: !!courseId,
  });

  // Approve enrollment mutation
  const approveEnrollmentMutation = useMutation({
    mutationFn: async ({ enrollmentId, studentId }: { enrollmentId: string; studentId: string }) => {
      return await apiRequest('PATCH', `/api/enrollments/${enrollmentId}/approve`);
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Enrollment Approved",
        description: "The student has been successfully enrolled in the course.",
      });
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      
      // Invalidate student-specific queries to dynamically update their portal
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/user', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'teachers'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve enrollment",
        variant: "destructive",
      });
    },
  });

  // Reject enrollment mutation
  const rejectEnrollmentMutation = useMutation({
    mutationFn: async ({ enrollmentId, reason, studentId }: { enrollmentId: string; reason: string; studentId: string }) => {
      return await apiRequest('PATCH', `/api/enrollments/${enrollmentId}/reject`, {
        rejectionReason: reason,
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Enrollment Rejected",
        description: "The enrollment request has been rejected.",
      });
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      
      // Invalidate student-specific queries to dynamically update their portal
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/user', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'teachers'] });
      
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedEnrollment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject enrollment",
        variant: "destructive",
      });
    },
  });

  // Assign teacher mutation
  const assignTeacherMutation = useMutation({
    mutationFn: async ({ studentId, teacherId, courseId }: { studentId: string; teacherId: string; courseId: string }) => {
      return await apiRequest('POST', '/api/student-teacher-assignments', {
        studentId,
        teacherId,
        courseId,
        assignedBy: adminId,
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Teacher Assigned",
        description: "Teacher has been successfully assigned to the student.",
      });
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: [`/api/student-teacher-assignments/course/${courseId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "enrollments"] });
      
      // Invalidate student-specific queries to dynamically update their portal
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/user', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'teachers'] });
      
      // Invalidate all teacher assignment queries for this student (using predicate to catch all patterns)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          if (typeof key === 'string' && key.includes('/api/student-teacher-assignments')) {
            // Match queries with studentId in the key
            const hasStudentId = query.queryKey.some(part => 
              typeof part === 'object' && part !== null && 'studentId' in part && part.studentId === variables.studentId
            ) || query.queryKey.includes(variables.studentId);
            return hasStudentId;
          }
          return false;
        }
      });
      
      setIsAssignTeacherDialogOpen(false);
      setSelectedTeacherId("");
      setSelectedEnrollment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign teacher",
        variant: "destructive",
      });
    },
  });

  // Unenroll student mutation
  const unenrollMutation = useMutation({
    mutationFn: async ({ enrollmentId, studentId }: { enrollmentId: string; studentId: string }) => {
      return await apiRequest('DELETE', `/api/enrollments/${enrollmentId}`);
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Student Unenrolled",
        description: "The student has been successfully removed from the course.",
      });
      // Invalidate admin queries - course enrollments
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      
      // Invalidate course-level queries to update student count in course lists
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      
      // Invalidate analytics and related course data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
      
      // Invalidate student-specific queries to dynamically update their portal
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/user', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'teachers'] });
      
      setIsUnenrollDialogOpen(false);
      setSelectedEnrollment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unenroll student",
        variant: "destructive",
      });
    },
  });

  // Update curriculum mutation
  const updateCurriculumMutation = useMutation({
    mutationFn: async (curriculum: Array<{ heading: string; description: string }>) => {
      return await apiRequest('PATCH', `/api/courses/${courseId}`, {
        curriculum,
      });
    },
    onSuccess: () => {
      toast({
        title: "Curriculum Updated",
        description: "Course curriculum has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update curriculum",
        variant: "destructive",
      });
    },
  });

  // Update teacher assignment mutation
  const updateTeacherAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, teacherId, studentId }: { assignmentId: string; teacherId: string; studentId: string }) => {
      return await apiRequest('PATCH', `/api/student-teacher-assignments/${assignmentId}`, {
        teacherId,
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Teacher Updated",
        description: "Teacher assignment has been successfully updated.",
      });
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: [`/api/student-teacher-assignments/course/${courseId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/enrollments`] });
      
      // Invalidate student-specific queries to dynamically update their portal
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/user', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'teachers'] });
      
      // Invalidate all teacher assignment queries for this student (using predicate to catch all patterns)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          if (typeof key === 'string' && key.includes('/api/student-teacher-assignments')) {
            // Match queries with studentId in the key
            const hasStudentId = query.queryKey.some(part => 
              typeof part === 'object' && part !== null && 'studentId' in part && part.studentId === variables.studentId
            ) || query.queryKey.includes(variables.studentId);
            return hasStudentId;
          }
          return false;
        }
      });
      
      setIsAssignTeacherDialogOpen(false);
      setSelectedTeacherId("");
      setSelectedEnrollment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update teacher assignment",
        variant: "destructive",
      });
    },
  });

  const handleApproveEnrollment = (enrollment: EnrollmentWithStudent) => {
    approveEnrollmentMutation.mutate({
      enrollmentId: enrollment.id,
      studentId: enrollment.studentId,
    });
  };

  const handleRejectEnrollment = () => {
    if (!selectedEnrollment) return;
    rejectEnrollmentMutation.mutate({
      enrollmentId: selectedEnrollment.id,
      reason: rejectionReason,
      studentId: selectedEnrollment.studentId,
    });
  };

  const handleAssignTeacher = () => {
    if (!selectedEnrollment || !selectedTeacherId) return;

    const existingAssignment = teacherAssignments.find(
      (a: any) => a.studentId === selectedEnrollment.student.id && a.courseId === courseId
    );

    if (existingAssignment) {
      // Update existing assignment
      updateTeacherAssignmentMutation.mutate({
        assignmentId: existingAssignment.id,
        teacherId: selectedTeacherId,
        studentId: selectedEnrollment.student.id,
      });
    } else {
      // Create new assignment
      assignTeacherMutation.mutate({
        studentId: selectedEnrollment.student.id,
        teacherId: selectedTeacherId,
        courseId,
      });
    }
  };

  const getTeacherAssignment = (studentId: string) => {
    return teacherAssignments.find((a: any) => a.studentId === studentId);
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = allTeachers.find((t: any) => t.id === teacherId);
    if (!teacher) return "Unknown";
    return teacher.firstName && teacher.lastName
      ? `${teacher.firstName} ${teacher.lastName}`
      : teacher.name || teacher.email;
  };

  if (courseLoading) {
    return <div className="p-6">Loading course details...</div>;
  }

  if (!course) {
    return <div className="p-6">Course not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" data-testid="admin-course-page">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation("/courses")}
                className="hover:bg-[#1F3A5F]/10 dark:hover:bg-white/10"
              >
                <ChevronLeft className="w-5 h-5 text-[#1F3A5F] dark:text-white" />
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1F3A5F]/10 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#1F3A5F]" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white">
                    {course.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-[#1F3A5F]/5 border-[#1F3A5F]/10 text-[#1F3A5F]">
                      Grade {course.grade}
                    </Badge>
                    <Badge variant="outline" className="bg-[#2FBF71]/5 border-[#2FBF71]/10 text-[#2FBF71]">
                      {course.subject}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSelectedCourse(course);
                  setIsEditModalOpen(true);
                }}
                className="bg-[#1F3A5F]/10 border-[#1F3A5F]/20 text-[#1F3A5F] hover:bg-[#1F3A5F]/20 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20"
                data-testid="button-edit-course"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Course
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Card with Cover Image */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-8">
        <Card className="border-0 shadow-md overflow-hidden">
          {course && <CourseCoverImage course={course} courseId={courseId} isAdmin={true} />}

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
                  {course.duration && (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 font-medium">
                      <Calendar className="w-3 h-3 mr-1" />
                      {course.duration}
                    </Badge>
                  )}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Tabs defaultValue="students" className="space-y-8">
        <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20" data-testid="course-tabs">
          <TabsTrigger 
            value="students"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-students"
          >
            <Users className="w-4 h-4 mr-2" />
            Enrolled Students
            <Badge variant="secondary" className="ml-2 px-2 py-0.5">
              {enrollments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="details"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-details"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Course Details
          </TabsTrigger>
          <TabsTrigger 
            value="curriculum"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            data-testid="tab-curriculum"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Curriculum
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-muted/20 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Enrolled Students</CardTitle>
                  <CardDescription className="mt-1.5">Manage student enrollments and teacher assignments</CardDescription>
                </div>
                <Badge variant="outline" className="px-3 py-1.5">
                  {enrollments.length} {enrollments.length === 1 ? 'Student' : 'Students'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {enrollmentsLoading ? (
                <div>Loading students...</div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students enrolled yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Teacher</TableHead>
                      <TableHead>Enrolled Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment: any) => {
                      const teacherAssignment = getTeacherAssignment(enrollment.student.id);
                      return (
                        <TableRow key={enrollment.id} data-testid={`enrollment-${enrollment.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={enrollment.student.avatarUrl} />
                                <AvatarFallback>
                                  {enrollment.student.firstName?.[0]}{enrollment.student.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {enrollment.student.firstName} {enrollment.student.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {enrollment.student.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {enrollment.approvalStatus === 'approved' && (
                              <Badge variant="default" className="bg-green-500">Approved</Badge>
                            )}
                            {enrollment.approvalStatus === 'pending' && (
                              <Badge variant="secondary">Pending Approval</Badge>
                            )}
                            {enrollment.approvalStatus === 'rejected' && (
                              <Badge variant="destructive">Rejected</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {teacherAssignment ? (
                              <div className="flex items-center gap-2">
                                <span>{getTeacherName(teacherAssignment.teacherId)}</span>
                              </div>
                            ) : (
                              <Badge variant="outline">Not Assigned</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {enrollment.approvalStatus === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApproveEnrollment(enrollment)}
                                    disabled={approveEnrollmentMutation.isPending}
                                    data-testid={`button-approve-${enrollment.id}`}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedEnrollment(enrollment);
                                      setIsRejectDialogOpen(true);
                                    }}
                                    disabled={rejectEnrollmentMutation.isPending}
                                    data-testid={`button-reject-${enrollment.id}`}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {enrollment.approvalStatus === 'approved' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedEnrollment(enrollment);
                                      const existingAssignment = getTeacherAssignment(enrollment.student.id);
                                      setSelectedTeacherId(existingAssignment?.teacherId || "");
                                      setIsAssignTeacherDialogOpen(true);
                                    }}
                                    data-testid={`button-assign-teacher-${enrollment.id}`}
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    {teacherAssignment ? "Change Teacher" : "Assign Teacher"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedEnrollment(enrollment);
                                      setIsUnenrollDialogOpen(true);
                                    }}
                                    disabled={unenrollMutation.isPending}
                                    data-testid={`button-unenroll-${enrollment.id}`}
                                  >
                                    <LogOut className="h-4 w-4 mr-1" />
                                    Leave
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-muted/20 pb-6">
              <CardTitle className="text-2xl">Course Information</CardTitle>
              <CardDescription className="mt-1.5">Detailed information about this course</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 border border-blue-100 dark:border-blue-900/20">
                    <Label className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Philosophy</Label>
                    <p className="mt-2 text-sm leading-relaxed">{course.philosophy || "Not specified"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/20 border border-purple-100 dark:border-purple-900/20">
                    <Label className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Learning Objectives</Label>
                    <p className="mt-2 text-sm leading-relaxed">{course.learningObjectives || "Not specified"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/20 border border-emerald-100 dark:border-emerald-900/20">
                    <Label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Practical Sessions</Label>
                    <p className="mt-2 text-sm leading-relaxed">{course.practicalSessions || "Not specified"}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/20 border border-amber-100 dark:border-amber-900/20">
                    <Label className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Prerequisites</Label>
                    <p className="mt-2 text-sm leading-relaxed">{course.prerequisites || "None"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-muted/20 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Curriculum</CardTitle>
                  <CardDescription className="mt-1.5">
                    {isEditModalOpen ? "Edit course curriculum sections" : "View course curriculum"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {!isEditModalOpen ? (
                // Read-only view
                <>
                  {editingCurriculum.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No curriculum sections yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {editingCurriculum.map((item, index) => (
                        <Card key={index} className="p-4 border bg-card">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-base">{item.heading}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Edit view
                <>
                  {editingCurriculum.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No curriculum sections yet</p>
                      <Button 
                        onClick={() => setEditingCurriculum([...editingCurriculum, { heading: '', description: '' }])}
                        variant="outline"
                        size="sm"
                        data-testid="button-add-curriculum"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Section
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {editingCurriculum.map((item, index) => (
                          <Card key={index} className="p-4 border bg-card">
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor={`heading-${index}`} className="text-sm font-medium">Section Title</Label>
                                <Input
                                  id={`heading-${index}`}
                                  value={item.heading}
                                  onChange={(e) => {
                                    const newCurriculum = [...editingCurriculum];
                                    newCurriculum[index].heading = e.target.value;
                                    setEditingCurriculum(newCurriculum);
                                  }}
                                  placeholder="e.g., Introduction to Algebra"
                                  data-testid={`input-heading-${index}`}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`description-${index}`} className="text-sm font-medium">Description</Label>
                                <Textarea
                                  id={`description-${index}`}
                                  value={item.description}
                                  onChange={(e) => {
                                    const newCurriculum = [...editingCurriculum];
                                    newCurriculum[index].description = e.target.value;
                                    setEditingCurriculum(newCurriculum);
                                  }}
                                  placeholder="Describe what will be covered in this section..."
                                  rows={3}
                                  data-testid={`textarea-description-${index}`}
                                />
                              </div>
                              <div className="flex gap-2 justify-end pt-2">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    const newCurriculum = editingCurriculum.filter((_, i) => i !== index);
                                    setEditingCurriculum(newCurriculum);
                                  }}
                                  data-testid={`button-delete-curriculum-${index}`}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                      <Button 
                        onClick={() => setEditingCurriculum([...editingCurriculum, { heading: '', description: '' }])}
                        variant="outline"
                        size="sm"
                        data-testid="button-add-curriculum-more"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Section
                      </Button>
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={() => updateCurriculumMutation.mutate(editingCurriculum)}
                          disabled={updateCurriculumMutation.isPending}
                          data-testid="button-save-curriculum"
                        >
                          {updateCurriculumMutation.isPending ? "Saving..." : "Save Curriculum"}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent data-testid="dialog-reject-enrollment">
          <DialogHeader>
            <DialogTitle>Reject Enrollment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this enrollment request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={4}
                data-testid="textarea-rejection-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason("");
                setSelectedEnrollment(null);
              }}
              data-testid="button-cancel-reject"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectEnrollment}
              disabled={rejectEnrollmentMutation.isPending || !rejectionReason.trim()}
              data-testid="button-confirm-reject"
            >
              {rejectEnrollmentMutation.isPending ? "Rejecting..." : "Reject Enrollment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Course Dialog */}
      <Dialog open={isUnenrollDialogOpen} onOpenChange={setIsUnenrollDialogOpen}>
        <DialogContent data-testid="dialog-unenroll-student">
          <DialogHeader>
            <DialogTitle>Leave Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedEnrollment?.student.firstName} {selectedEnrollment?.student.lastName} from this course? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUnenrollDialogOpen(false);
                setSelectedEnrollment(null);
              }}
              data-testid="button-cancel-unenroll"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedEnrollment) {
                  unenrollMutation.mutate({
                    enrollmentId: selectedEnrollment.id,
                    studentId: selectedEnrollment.studentId,
                  });
                }
              }}
              disabled={unenrollMutation.isPending}
              data-testid="button-confirm-unenroll"
            >
              {unenrollMutation.isPending ? "Removing..." : "Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Teacher Dialog */}
      <Dialog open={isAssignTeacherDialogOpen} onOpenChange={setIsAssignTeacherDialogOpen}>
        <DialogContent data-testid="dialog-assign-teacher">
          <DialogHeader>
            <DialogTitle>Assign Teacher</DialogTitle>
            <DialogDescription>
              Select a teacher to assign to {selectedEnrollment?.student.firstName} {selectedEnrollment?.student.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teacher-select">Teacher</Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger id="teacher-select" data-testid="select-teacher">
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {allTeachers.map((teacher: any) => (
                    <SelectItem
                      key={teacher.id}
                      value={teacher.id}
                      data-testid={`teacher-option-${teacher.id}`}
                    >
                      {teacher.firstName && teacher.lastName
                        ? `${teacher.firstName} ${teacher.lastName}`
                        : teacher.name || teacher.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignTeacherDialogOpen(false);
                setSelectedTeacherId("");
                setSelectedEnrollment(null);
              }}
              data-testid="button-cancel-assign"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignTeacher}
              disabled={
                assignTeacherMutation.isPending ||
                updateTeacherAssignmentMutation.isPending ||
                !selectedTeacherId
              }
              data-testid="button-confirm-assign"
            >
              {assignTeacherMutation.isPending || updateTeacherAssignmentMutation.isPending
                ? "Assigning..."
                : "Assign Teacher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Edit Modal */}
      <CourseEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCourse(null);
          // Reload curriculum from course data when modal closes
          if (course?.curriculum && Array.isArray(course.curriculum)) {
            setEditingCurriculum(course.curriculum);
          }
        }}
        course={selectedCourse}
      />
      </div>
    </div>
  );
}
