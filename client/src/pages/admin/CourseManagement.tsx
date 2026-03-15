import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, Plus, Users, Calendar, MoreVertical, UserCog, Trash2, Edit, UserPlus, Layers, ArrowUp, ArrowDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ViewModeToggle, type ViewMode } from "@/components/ViewModeToggle";
import type { Course, User } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CourseWithStats extends Course {
  studentCount: number;
  instructorName: string;
  status: string;
}
import { CourseCreationModal } from "@/components/CourseCreationModal";
import { CourseEditModal } from "@/components/CourseEditModal";
import { SubjectManagement } from "@/components/SubjectManagement";
import { TeacherAssignmentModal } from "@/components/TeacherAssignmentModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CourseManagementProps {
  adminId: string;
}

export default function CourseManagement({ adminId }: CourseManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"default" | "asc" | "desc">("default");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("adminCourseManagementViewMode");
      return (saved as ViewMode) || "table";
    }
    return "table";
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("adminCourseManagementViewMode", viewMode);
    }
  }, [viewMode]);
  const [changeTeacherDialogOpen, setChangeTeacherDialogOpen] = useState(false);
  const [selectedCourseForTeacherChange, setSelectedCourseForTeacherChange] = useState<Course | null>(null);
  const [selectedNewTeacherId, setSelectedNewTeacherId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [assignTeachersModalOpen, setAssignTeachersModalOpen] = useState(false);
  const [courseForTeacherAssignment, setCourseForTeacherAssignment] = useState<Course | null>(null);
  const [enrollStudentDialogOpen, setEnrollStudentDialogOpen] = useState(false);
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState<Course | null>(null);
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery<CourseWithStats[]>({
    queryKey: ["/api/admin/courses"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch all teachers for change teacher functionality
  const { data: allTeachers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const users: User[] = await response.json();
      return users.filter(u => u.role === "teacher");
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Change teacher mutation
  const changeTeacherMutation = useMutation({
    mutationFn: async ({ courseId, newTeacherId }: { courseId: string; newTeacherId: string; oldTeacherId?: string }) => {
      const response = await apiRequest("PATCH", `/api/courses/${courseId}`, { teacherId: newTeacherId });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      
      // Dynamically update the old teacher's dashboard
      if (variables.oldTeacherId) {
        queryClient.invalidateQueries({ queryKey: ["/api/teachers", variables.oldTeacherId, "courses"] });
      }
      
      // Dynamically update the new teacher's dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/teachers", variables.newTeacherId, "courses"] });
      
      setChangeTeacherDialogOpen(false);
      setSelectedCourseForTeacherChange(null);
      setSelectedNewTeacherId("");
      toast({
        title: "Teacher Updated",
        description: "The course teacher has been successfully changed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update teacher",
        variant: "destructive",
      });
    },
  });

  const handleChangeTeacher = () => {
    if (selectedCourseForTeacherChange && selectedNewTeacherId && selectedNewTeacherId !== selectedCourseForTeacherChange.teacherId) {
      changeTeacherMutation.mutate({
        courseId: selectedCourseForTeacherChange.id,
        newTeacherId: selectedNewTeacherId,
        oldTeacherId: selectedCourseForTeacherChange.teacherId || undefined,
      });
    }
  };

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ courseId, teacherId }: { courseId: string; teacherId?: string }) => {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete course");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      
      // Dynamically update the teacher's dashboard
      if (variables.teacherId) {
        queryClient.invalidateQueries({ queryKey: ["/api/teachers", variables.teacherId, "courses"] });
      }
      
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
      toast({
        title: "Course Deleted",
        description: "The course has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete course",
        variant: "destructive",
      });
    },
  });

  const handleDeleteCourse = () => {
    if (courseToDelete) {
      deleteMutation.mutate({
        courseId: courseToDelete.id,
        teacherId: courseToDelete.teacherId || undefined,
      });
    }
  };

  // Fetch all students for enrollment functionality
  const { data: allStudents = [] } = useQuery<User[]>({
    queryKey: ["/api/users", "students"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const users: User[] = await response.json();
      return users.filter(u => u.role === "student");
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Fetch enrolled students for the selected course
  const { data: enrolledStudents = [], isLoading: isLoadingEnrollments, isFetching: isFetchingEnrollments } = useQuery({
    queryKey: ["/api/courses", selectedCourseForEnrollment?.id, "enrollments"],
    queryFn: async () => {
      if (!selectedCourseForEnrollment?.id) return [];
      const response = await fetch(`/api/courses/${selectedCourseForEnrollment.id}/enrollments`);
      if (!response.ok) throw new Error("Failed to fetch enrollments");
      return response.json();
    },
    enabled: !!selectedCourseForEnrollment?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Combined loading state to handle both initial load and refetching when switching courses
  const isEnrollmentsLoading = isLoadingEnrollments || isFetchingEnrollments;

  // Enroll student mutation
  const enrollStudentMutation = useMutation({
    mutationFn: async ({ courseId, studentId }: { courseId: string; studentId: string }) => {
      const response = await fetch(`/api/admin/courses/${courseId}/enroll-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to enroll student");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", selectedCourseForEnrollment?.id, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      
      setEnrollStudentDialogOpen(false);
      setSelectedCourseForEnrollment(null);
      setSelectedStudentToEnroll("");
      toast({
        title: "Student Enrolled",
        description: "The student has been successfully enrolled in the course.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enroll student",
        variant: "destructive",
      });
    },
  });

  const handleEnrollStudent = () => {
    if (selectedCourseForEnrollment && selectedStudentToEnroll) {
      enrollStudentMutation.mutate({
        courseId: selectedCourseForEnrollment.id,
        studentId: selectedStudentToEnroll,
      });
    }
  };

  // Get non-enrolled students (only compute when enrollments are loaded and not refetching)
  const enrolledStudentIds = new Set(enrolledStudents.map((e: any) => e.studentId));
  const nonEnrolledStudents = isEnrollmentsLoading ? [] : allStudents.filter(student => !enrolledStudentIds.has(student.id));

  const uniqueGrades = Array.from(new Set(courses.map(c => c.grade))).sort();

  const filteredCourses = courses
    .filter(course => {
      const matchesSearch = searchQuery === "" || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.subject.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && course.isActive) ||
        (statusFilter === "inactive" && !course.isActive);

      const matchesGrade = gradeFilter === "all" || 
        course.grade === gradeFilter;
      
      return matchesSearch && matchesStatus && matchesGrade;
    })
    .sort((a, b) => {
      if (sortOrder === "default") return 0;
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="bg-gradient-to-r from-[#1F3A5F]/10 via-[#1F3A5F]/5 to-[#2a4a75]/5 relative overflow-hidden border-b border-[#1F3A5F]/10">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, #1F3A5F 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
          <Skeleton className="h-8 w-48 bg-[#1F3A5F]/10 dark:bg-white/20 mb-2" />
          <Skeleton className="h-4 w-32 bg-[#1F3A5F]/5 dark:bg-white/10" />
        </div>
      </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-16 mb-3" />
                  <Skeleton className="h-8 w-12 mb-1" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeCourses = courses.filter(c => c.isActive).length;
  const inactiveCourses = courses.filter(c => !c.isActive).length;
  const subjectCounts = courses.reduce((acc, course) => {
    acc[course.subject] = (acc[course.subject] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" data-testid="course-management-page">
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
                  <BookOpen className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white">Course Management</h1>
              </div>
              <p className="text-[#1F3A5F]/60 dark:text-white/60 text-sm sm:text-base font-medium">Manage courses and subjects</p>
            </div>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#2FBF71] hover:bg-[#27a862] text-white shadow-lg"
              data-testid="button-create-course"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="inline-flex h-11 items-center justify-start rounded-xl bg-white dark:bg-slate-800 shadow-sm p-1 gap-1 border border-slate-200 dark:border-slate-700 flex-wrap" data-testid="course-tabs-list">
            <TabsTrigger 
              value="courses" 
              data-testid="tab-courses"
              className="data-[state=active]:bg-[#1F3A5F] data-[state=active]:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger 
              value="subjects" 
              data-testid="tab-subjects"
              className="data-[state=active]:bg-[#1F3A5F] data-[state=active]:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
            >
              <Layers className="w-4 h-4" />
              Subjects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6 mt-6">
            {/* Course Statistics */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-[#1F3A5F]/5 to-transparent hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-slate-500">Total Courses</span>
                    <div className="p-2 rounded-lg bg-[#1F3A5F]/10">
                      <BookOpen className="w-4 h-4 text-[#1F3A5F]" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#1F3A5F]" data-testid="stat-total-courses">
                    {courses.length}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-[#2FBF71]/5 to-transparent hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-slate-500">Active</span>
                    <div className="p-2 rounded-lg bg-[#2FBF71]/10">
                      <BookOpen className="w-4 h-4 text-[#2FBF71]" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#2FBF71]" data-testid="stat-active-courses">
                    {activeCourses}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/5 to-transparent hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-slate-500">Inactive</span>
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <BookOpen className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-amber-500" data-testid="stat-inactive-courses">
                    {inactiveCourses}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500/5 to-transparent hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-slate-500">Subjects</span>
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Layers className="w-4 h-4 text-purple-500" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-500" data-testid="stat-subjects">
                    {Object.keys(subjectCounts).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="Search by title or subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                      data-testid="search-courses"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex gap-1 flex-wrap">
                      {['all', 'active', 'inactive'].map((status) => (
                        <Button
                          key={status}
                          variant={statusFilter === status ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setStatusFilter(status)}
                          data-testid={`filter-${status}`}
                          className={`h-9 rounded-lg ${statusFilter === status ? 'bg-[#1F3A5F] hover:bg-[#2a4a75]' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 border-l pl-2 ml-1">
                      <Select value={gradeFilter} onValueChange={setGradeFilter}>
                        <SelectTrigger className="w-32 h-9 rounded-lg border-slate-200 dark:border-slate-700" data-testid="filter-grade">
                          <SelectValue placeholder="Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Grades</SelectItem>
                          {uniqueGrades.map((grade) => (
                            <SelectItem key={grade} value={grade} data-testid={`grade-${grade}`}>
                              Grade {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (sortOrder === "default") setSortOrder("asc");
                          else if (sortOrder === "asc") setSortOrder("desc");
                          else setSortOrder("default");
                        }}
                        data-testid="button-sort"
                        className="h-9 w-9 p-0"
                        title={sortOrder === "default" ? "Sort ascending (oldest first)" : sortOrder === "asc" ? "Sort descending (newest first)" : "Remove sorting"}
                      >
                        {sortOrder === "asc" && <ArrowUp className="w-4 h-4" />}
                        {sortOrder === "desc" && <ArrowDown className="w-4 h-4" />}
                        {sortOrder === "default" && <ArrowDown className="w-4 h-4 opacity-50" />}
                      </Button>
                    </div>
                    <ViewModeToggle 
                      currentMode={viewMode}
                      onModeChange={setViewMode}
                      availableModes={["table", "grid", "list"]}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

      {/* Courses Display */}
      {!isLoading && filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || statusFilter !== "all" ? "No courses found" : "No courses created"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Start by creating courses for teachers and students."
              }
            </p>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              data-testid="button-create-first-course"
            >
              Create First Course
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card 
              key={course.id}
              className="hover-elevate cursor-pointer transition-all"
              onClick={() => navigate(`/courses/${course.id}`)}
              data-testid={`course-${course.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-base line-clamp-2 mb-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description || "No description provided."}
                    </p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          data-testid={`button-menu-${course.id}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedCourse(course);
                            setIsEditModalOpen(true);
                          }}
                          data-testid={`menu-edit-${course.id}`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Course
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedCourseForEnrollment(course);
                            setEnrollStudentDialogOpen(true);
                          }}
                          data-testid={`menu-enroll-student-${course.id}`}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Enroll Student
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setCourseToDelete(course);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                          data-testid={`menu-delete-${course.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">{course.subject}</Badge>
                  <Badge variant="secondary" className="text-xs">Grade {course.grade}</Badge>
                  <Badge 
                    variant={course.isActive ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {course.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Teacher:</span>
                    {course.instructorName || course.teacherId ? (
                      <span className="text-xs">{course.instructorName || `ID: ${course.teacherId?.slice(0, 8)}...`}</span>
                    ) : (
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-no-teacher-${course.id}`}>
                        Not Assigned
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Students:</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {course.studentCount || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {filteredCourses.map((course) => (
            <Card 
              key={course.id}
              className="hover-elevate cursor-pointer transition-all"
              onClick={() => navigate(`/courses/${course.id}`)}
              data-testid={`course-${course.id}`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-base line-clamp-1">{course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {course.description || "No description provided."}
                        </p>
                      </div>
                      <Badge 
                        variant={course.isActive ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {course.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {course.subject}
                      </span>
                      <span>•</span>
                      <span>Grade {course.grade}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {course.studentCount || 0} students
                      </span>
                      {course.instructorName && (
                        <>
                          <span>•</span>
                          <span>{course.instructorName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            data-testid={`button-menu-${course.id}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/courses/${course.id}`);
                          }}
                          data-testid={`menu-view-${course.id}`}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCourseForEnrollment(course);
                            setEnrollStudentDialogOpen(true);
                          }}
                          data-testid={`menu-enroll-student-${course.id}`}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Enroll Student
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCourseToDelete(course);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                          data-testid={`menu-delete-${course.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Course Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-[80px]">Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="w-[100px]">Students</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[180px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow 
                    key={course.id}
                    data-testid={`course-${course.id}`}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="font-medium">{course.title}</div>
                        {course.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {course.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {course.subject}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{course.grade}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={course.isActive ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {course.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {course.instructorName || course.teacherId ? (
                        <span className="text-muted-foreground">
                          {course.instructorName || (course.teacherId ? `ID: ${course.teacherId.slice(0, 8)}...` : '')}
                        </span>
                      ) : (
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-no-teacher-${course.id}`}>
                          Not Assigned
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{course.studentCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {course.createdAt 
                        ? new Date(course.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                data-testid={`button-menu-${course.id}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/courses/${course.id}`);
                              }}
                              data-testid={`menu-view-${course.id}`}
                            >
                              <BookOpen className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCourseForEnrollment(course);
                                setEnrollStudentDialogOpen(true);
                              }}
                              data-testid={`menu-enroll-student-${course.id}`}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Enroll Student
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                setCourseToDelete(course);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                              data-testid={`menu-delete-${course.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Course
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="subjects" className="space-y-6">
          <SubjectManagement />
        </TabsContent>
      </Tabs>
      </div>

      <CourseCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Course Edit Modal */}
      <CourseEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCourse(null);
        }}
        course={selectedCourse}
      />

      {/* Change Teacher Dialog */}
      <Dialog open={changeTeacherDialogOpen} onOpenChange={setChangeTeacherDialogOpen}>
        <DialogContent data-testid="dialog-change-teacher">
          <DialogHeader>
            <DialogTitle>Change Course Teacher</DialogTitle>
            <DialogDescription>
              Select a new teacher for "{selectedCourseForTeacherChange?.title}". The current teacher ID is {selectedCourseForTeacherChange?.teacherId}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teacher-select">New Teacher</Label>
              <Select value={selectedNewTeacherId} onValueChange={setSelectedNewTeacherId}>
                <SelectTrigger id="teacher-select" data-testid="select-new-teacher">
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {allTeachers.map((teacher) => (
                    <SelectItem 
                      key={teacher.id} 
                      value={teacher.id}
                      data-testid={`teacher-option-${teacher.id}`}
                    >
                      {teacher.firstName && teacher.lastName 
                        ? `${teacher.firstName} ${teacher.lastName}`
                        : teacher.name || teacher.email}
                      {teacher.id === selectedCourseForTeacherChange?.teacherId && " (Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setChangeTeacherDialogOpen(false)}
              data-testid="button-cancel-change-teacher"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleChangeTeacher}
              disabled={!selectedNewTeacherId || selectedNewTeacherId === selectedCourseForTeacherChange?.teacherId || changeTeacherMutation.isPending}
              data-testid="button-confirm-change-teacher"
            >
              {changeTeacherMutation.isPending ? "Updating..." : "Change Teacher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Course Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent data-testid="dialog-delete-course">
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{courseToDelete?.title}"? This action cannot be undone. All course data, enrollments, and related information will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setCourseToDelete(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteCourse}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Student Dialog */}
      <Dialog open={enrollStudentDialogOpen} onOpenChange={setEnrollStudentDialogOpen}>
        <DialogContent data-testid="dialog-enroll-student">
          <DialogHeader>
            <DialogTitle>Enroll Student in Course</DialogTitle>
            <DialogDescription>
              Select a non-enrolled student to add to "{selectedCourseForEnrollment?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isEnrollmentsLoading ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2">Loading enrolled students...</p>
              </div>
            ) : nonEnrolledStudents.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                All students are already enrolled in this course.
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="student-select">Select Student</Label>
                <Select value={selectedStudentToEnroll} onValueChange={setSelectedStudentToEnroll}>
                  <SelectTrigger id="student-select" data-testid="select-student">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {nonEnrolledStudents.map((student) => (
                      <SelectItem 
                        key={student.id} 
                        value={student.id}
                        data-testid={`student-option-${student.id}`}
                      >
                        {student.firstName && student.lastName 
                          ? `${student.firstName} ${student.lastName}`
                          : student.name || student.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setEnrollStudentDialogOpen(false);
                setSelectedCourseForEnrollment(null);
                setSelectedStudentToEnroll("");
              }}
              data-testid="button-cancel-enroll-student"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEnrollStudent}
              disabled={!selectedStudentToEnroll || enrollStudentMutation.isPending || nonEnrolledStudents.length === 0 || isEnrollmentsLoading}
              data-testid="button-confirm-enroll-student"
            >
              {enrollStudentMutation.isPending ? "Enrolling..." : "Enroll Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teacher Assignment Modal */}
      {courseForTeacherAssignment && (
        <TeacherAssignmentModal
          courseId={courseForTeacherAssignment.id}
          isOpen={assignTeachersModalOpen}
          onClose={() => {
            setAssignTeachersModalOpen(false);
            setCourseForTeacherAssignment(null);
          }}
        />
      )}
    </div>
  );
}