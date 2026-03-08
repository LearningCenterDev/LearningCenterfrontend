import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  FileText,
  GraduationCap,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ViewModeToggle, type ViewMode } from "@/components/ViewModeToggle";
import type { Course, CourseActivationRequest } from "@shared/schema";
import { CourseActivationModal } from "@/components/CourseActivationModal";

interface CourseAggregateProgress {
  totalUnits: number;
  averageProgress: number;
  studentsCount: number;
}

interface TeacherCoursesProps {
  teacherId: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge variant="default" className="text-xs" data-testid="status-active"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    case "draft":
      return <Badge variant="secondary" className="text-xs" data-testid="status-draft"><FileText className="w-3 h-3 mr-1" />Draft</Badge>;
    case "pending_parent":
      return <Badge variant="outline" className="text-xs" data-testid="status-pending-parent"><Clock className="w-3 h-3 mr-1" />Pending Parent</Badge>;
    case "parent_authorized":
      return <Badge variant="outline" className="text-xs" data-testid="status-parent-authorized"><Users className="w-3 h-3 mr-1" />Parent Authorized</Badge>;
    case "pending_admin":
      return <Badge variant="outline" className="text-xs" data-testid="status-pending-admin"><AlertCircle className="w-3 h-3 mr-1" />Pending Admin</Badge>;
    case "rejected":
      return <Badge variant="destructive" className="text-xs" data-testid="status-rejected"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs" data-testid={`status-${status}`}>{status}</Badge>;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "active": return "Active";
    case "draft": return "Draft";
    case "pending_parent": return "Awaiting Parent";
    case "parent_authorized": return "Parent Approved";
    case "pending_admin": return "Awaiting Admin";
    case "rejected": return "Rejected";
    default: return status;
  }
};

export default function TeacherCourses({ teacherId }: TeacherCoursesProps) {
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("teacherMyCoursesViewMode");
      return (saved as ViewMode) || "grid";
    }
    return "grid";
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("teacherMyCoursesViewMode", viewMode);
    }
  }, [viewMode]);
  
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/teachers", teacherId, "courses"],
  });

  const { data: activationRequests = [] } = useQuery<CourseActivationRequest[]>({
    queryKey: ["/api/course-activation-requests", { teacherId }],
    enabled: courses.length > 0,
  });

  const progressQueries = useQueries({
    queries: courses.map(course => ({
      queryKey: ["/api/courses", course.id, "aggregate-progress"],
      enabled: !!course.isActive,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const getProgressForCourse = (courseId: string): CourseAggregateProgress | null => {
    const courseIndex = courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return null;
    const query = progressQueries[courseIndex];
    return query?.data as CourseAggregateProgress | null;
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Courses</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
    <div className="p-8 space-y-8 max-w-7xl mx-auto" data-testid="teacher-courses-page">
      {/* Modern Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Courses</h1>
          <p className="text-muted-foreground">
            Manage and track all your assigned courses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" data-testid="course-count" className="text-lg px-4 py-2">
            {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}
          </Badge>
          <ViewModeToggle 
            currentMode={viewMode}
            onModeChange={setViewMode}
            availableModes={["grid", "list", "table"]}
          />
        </div>
      </div>

      {courses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 rounded-full bg-primary/10 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No courses assigned</h3>
              <p className="text-muted-foreground">
                You will see your assigned courses here once an administrator creates and assigns them to you.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => {
                const activationRequest = activationRequests.find(req => req.courseId === course.id);
                const activationStatus = course.isActive ? "active" : activationRequest?.status || "draft";
                
                return (
                  <TableRow 
                    key={course.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => navigate(`/courses/${course.id}`)}
                    data-testid={`course-${course.id}`}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {course.description || "No description"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {course.subject}
                      </Badge>
                    </TableCell>
                    <TableCell>Grade {course.grade}</TableCell>
                    <TableCell>
                      {(() => {
                        const progress = getProgressForCourse(course.id);
                        if (progress && progress.totalUnits > 0) {
                          return (
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress value={progress.averageProgress} className="h-2 flex-1" />
                              <span className="text-xs font-medium w-8">{progress.averageProgress}%</span>
                            </div>
                          );
                        }
                        return <span className="text-xs text-muted-foreground">-</span>;
                      })()}
                    </TableCell>
                    <TableCell>{getStatusBadge(activationStatus)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {courses.map((course) => {
            const activationRequest = activationRequests.find(req => req.courseId === course.id);
            const activationStatus = course.isActive ? "active" : activationRequest?.status || "draft";
            
            return (
              <Card 
                key={course.id} 
                className="hover-elevate cursor-pointer transition-all"
                onClick={() => navigate(`/courses/${course.id}`)}
                data-testid={`course-${course.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-base line-clamp-1">
                            {course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {course.description || "No description provided."}
                          </p>
                        </div>
                        {getStatusBadge(activationStatus)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {course.subject}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          Grade {course.grade}
                        </span>
                        <span>•</span>
                        <span>{getStatusText(activationStatus)}</span>
                      </div>
                      {(() => {
                        const progress = getProgressForCourse(course.id);
                        if (progress && progress.totalUnits > 0) {
                          return (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <BarChart3 className="w-3 h-3" />
                                  Avg Progress
                                </span>
                                <span className="font-medium">{progress.averageProgress}%</span>
                              </div>
                              <Progress value={progress.averageProgress} className="h-1.5" />
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const activationRequest = activationRequests.find(req => req.courseId === course.id);
            const activationStatus = course.isActive ? "active" : activationRequest?.status || "draft";
            
            return (
              <Card 
                key={course.id} 
                className="cursor-pointer transition-all group hover:border-primary/40"
                onClick={() => navigate(`/courses/${course.id}`)}
                data-testid={`course-${course.id}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {course.subject}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Grade {course.grade}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {course.description || "No description provided."}
                  </p>
                  
                  {(() => {
                    const progress = getProgressForCourse(course.id);
                    if (progress && progress.totalUnits > 0) {
                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <BarChart3 className="w-4 h-4" />
                              Avg Progress
                            </span>
                            <span className="font-medium">{progress.averageProgress}%</span>
                          </div>
                          <Progress value={progress.averageProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {progress.studentsCount} student{progress.studentsCount !== 1 ? 's' : ''} • {progress.totalUnits} units
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="w-4 h-4" />
                    <span>{getStatusText(activationStatus)}</span>
                  </div>

                  <div className="pt-2 border-t">
                    {getStatusBadge(activationStatus)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
