import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Search, 
  Users, 
  Calendar,
  GraduationCap,
  UserCheck,
  Clock,
  Filter,
  FileText,
  AlertCircle,
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
import { EnrollmentRequestModal } from "@/components/EnrollmentRequestModal";
import { ViewModeToggle, type ViewMode } from "@/components/ViewModeToggle";
import type { Course, User, Enrollment } from "@shared/schema";

interface CourseBrowserProps {
  currentUser: User;
  showEnrollButton?: boolean;
}

interface CourseWithTeacher extends Course {
  teacherName?: string;
  isEnrolled?: boolean;
  enrollmentCount?: number;
  enrollmentRequest?: {
    id: string;
    status: "requested" | "parent_approved" | "admin_approved" | "enrolled" | "rejected";
    createdAt: string;
  };
}

export function CourseBrowser({ currentUser, showEnrollButton = true }: CourseBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("courseBrowserViewMode") as ViewMode;
      // Validate that saved mode is valid, fallback to grid if not
      if (saved && (saved === "grid" || saved === "list" || saved === "table")) {
        return saved;
      }
    }
    return "grid";
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Save view mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("courseBrowserViewMode", viewMode);
    }
  }, [viewMode]);

  // Get student's enrollment requests if they're a student
  const { data: enrollmentRequests = [] } = useQuery({
    queryKey: ["/api/enrollment-requests", "student", currentUser.id],
    queryFn: async () => {
      const response = await fetch(`/api/enrollment-requests?studentId=${currentUser.id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: currentUser.role === "student",
  });

  // Get courses (filter active courses for students)
  const { data: courses = [], isLoading: coursesLoading } = useQuery<CourseWithTeacher[]>({
    queryKey: ["/api/courses", { role: currentUser.role }, { enrollmentRequests: enrollmentRequests.length }],
    queryFn: async () => {
      // Only show active courses to students, show all courses to other roles
      const url = currentUser.role === "student" ? "/api/courses?active=true" : "/api/courses";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      
      const coursesData = await response.json();
      
      // Get teacher names and enrollment data for each course
      const coursesWithDetails = await Promise.all(
        coursesData.map(async (course: Course) => {
          try {
            // Get teacher info
            const teacherResponse = await fetch(`/api/users/${course.teacherId}`);
            const teacher = teacherResponse.ok ? await teacherResponse.json() : null;
            
            // Get enrollment status if user is a student
            let isEnrolled = false;
            let enrollmentRequest = undefined;
            if (currentUser.role === "student") {
              const enrollmentResponse = await fetch(`/api/students/${currentUser.id}/enrollments`);
              if (enrollmentResponse.ok) {
                const enrollments = await enrollmentResponse.json();
                isEnrolled = enrollments.some((e: Enrollment) => e.courseId === course.id);
              }

              // Check for existing enrollment request
              if (enrollmentRequests.length > 0) {
                const existingRequest = enrollmentRequests.find(
                  (req: any) => req.courseId === course.id && req.status !== 'rejected'
                );
                if (existingRequest) {
                  enrollmentRequest = {
                    id: existingRequest.id,
                    status: existingRequest.status,
                    createdAt: existingRequest.createdAt,
                  };
                }
              }
            }
            
            return {
              ...course,
              teacherName: teacher ? (teacher.name || `${teacher.firstName} ${teacher.lastName}`) : "Unknown Teacher",
              isEnrolled,
              enrollmentRequest,
              enrollmentCount: 0, // TODO: Get actual enrollment count
            };
          } catch (error) {
            return {
              ...course,
              teacherName: "Unknown Teacher",
              isEnrolled: false,
              enrollmentCount: 0,
            };
          }
        })
      );
      
      return coursesWithDetails;
    },
  });

  // Helper function to get request status badge
  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return (
          <Badge variant="secondary" className="text-xs max-w-[180px] min-w-0 flex items-center gap-1 overflow-hidden">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Waiting for Parent's Approval</span>
          </Badge>
        );
      case 'parent_approved':
        return (
          <Badge className="text-xs max-w-[150px] min-w-0 flex items-center gap-1 overflow-hidden">
            <UserCheck className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Approved by Parent</span>
          </Badge>
        );
      case 'enrolled':
        return (
          <Badge className="text-xs max-w-[100px] min-w-0 flex items-center gap-1 overflow-hidden">
            <UserCheck className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Enrolled</span>
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="text-xs max-w-[100px] min-w-0 overflow-hidden">
            <span className="truncate">Rejected</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs max-w-[120px] min-w-0 overflow-hidden">
            <span className="truncate">{status}</span>
          </Badge>
        );
    }
  };

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchQuery === "" || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.teacherName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = subjectFilter === "all" || course.subject === subjectFilter;
    const matchesGrade = gradeFilter === "all" || course.grade === gradeFilter;
    
    // Exclude already enrolled courses for students
    const notEnrolled = !course.isEnrolled;
    
    return matchesSearch && matchesSubject && matchesGrade && course.isActive && notEnrolled;
  });

  // Get unique subjects and grades for filters
  const uniqueSubjects = Array.from(new Set(courses.map(c => c.subject)));
  const uniqueGrades = Array.from(new Set(courses.map(c => c.grade)));

  if (coursesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Browse Courses</h2>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
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
    <div className="space-y-6" data-testid="course-browser">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Badge variant="secondary" data-testid="available-courses-count">
          {filteredCourses.length} available
        </Badge>
        <ViewModeToggle 
          currentMode={viewMode}
          onModeChange={setViewMode}
          availableModes={["grid", "list", "table"]}
        />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by course name, subject, or teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-courses"
              />
            </div>
            
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger data-testid="filter-subject">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {uniqueSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger data-testid="filter-grade">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {uniqueGrades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Display */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || subjectFilter !== "all" || gradeFilter !== "all" 
                ? "No courses found" 
                : "No courses available"
              }
            </h3>
            <p className="text-muted-foreground">
              {searchQuery || subjectFilter !== "all" || gradeFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Check back later for new course offerings."
              }
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Course</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2 hidden md:table-cell">Teacher</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2 hidden sm:table-cell">Subject & Grade</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2 hidden lg:table-cell">Students</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCourses.map((course) => (
                <tr 
                  key={course.id}
                  className={`hover-elevate ${course.isEnrolled ? 'bg-primary/5' : ''}`}
                  data-testid={`course-row-${course.id}`}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{course.title}</div>
                        <div className="text-xs text-muted-foreground md:hidden truncate">{course.teacherName}</div>
                      </div>
                      {course.isEnrolled && (
                        <Badge className="text-xs flex-shrink-0">
                          <UserCheck className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    <div className="text-sm text-muted-foreground truncate max-w-[150px]">{course.teacherName}</div>
                  </td>
                  <td className="px-3 py-2 hidden sm:table-cell">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {course.subject}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        Grade {course.grade}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{course.enrollmentCount || 0}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <Link href={`/courses/${course.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-view-details-${course.id}`}
                        >
                          <Eye className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline text-xs">View</span>
                        </Button>
                      </Link>
                      {showEnrollButton && currentUser.role === "student" && (
                        <>
                          {course.isEnrolled ? (
                            <Button
                              disabled
                              size="sm"
                              variant="secondary"
                              data-testid={`button-enrolled-${course.id}`}
                            >
                              <UserCheck className="w-3 h-3 sm:mr-1" />
                              <span className="hidden sm:inline text-xs">Enrolled</span>
                            </Button>
                          ) : course.enrollmentRequest ? (
                            <Button
                              disabled
                              size="sm"
                              variant="secondary"
                              data-testid={`button-request-pending-${course.id}`}
                            >
                              <Clock className="w-3 h-3 sm:mr-1" />
                              <span className="hidden sm:inline text-xs">Pending</span>
                            </Button>
                          ) : (
                            <EnrollmentRequestModal course={course} student={currentUser}>
                              <Button 
                                size="sm"
                                data-testid={`button-request-enrollment-${course.id}`}
                              >
                                <FileText className="w-3 h-3 sm:mr-1" />
                                <span className="hidden sm:inline text-xs">Request</span>
                              </Button>
                            </EnrollmentRequestModal>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">{filteredCourses.map((course) => (
            <Card 
              key={course.id}
              className={`hover-elevate transition-all ${course.isEnrolled ? 'ring-2 ring-primary/20' : ''}`}
              data-testid={`course-card-${course.id}`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="flex items-start gap-2">
                        <h3 className="font-semibold text-base line-clamp-1 flex-1">
                          {course.title}
                        </h3>
                        {course.isEnrolled && (
                          <Badge className="text-xs">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Enrolled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {course.teacherName}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        Grade {course.grade}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {course.subject}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {course.enrollmentCount || 0} students
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 min-w-0 overflow-hidden">
                    <Link href={`/courses/${course.id}`} className="flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`button-view-details-${course.id}`}
                      >
                        <Eye className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    </Link>
                    {showEnrollButton && currentUser.role === "student" && (
                      <>
                        {course.isEnrolled ? (
                          <Button
                            disabled
                            size="sm"
                            variant="secondary"
                            className="flex-shrink-0"
                            data-testid={`button-enrolled-${course.id}`}
                          >
                            <UserCheck className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Enrolled</span>
                          </Button>
                        ) : course.enrollmentRequest ? (
                          <Button
                            disabled
                            size="sm"
                            variant="secondary"
                            className="min-w-0 flex-1"
                            data-testid={`button-request-pending-${course.id}`}
                          >
                            <Clock className="w-4 h-4 sm:mr-2 flex-shrink-0" />
                            <span className="hidden sm:inline truncate">Pending</span>
                          </Button>
                        ) : (
                          <EnrollmentRequestModal course={course} student={currentUser}>
                            <Button 
                              size="sm"
                              data-testid={`button-request-enrollment-${course.id}`}
                            >
                              <FileText className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">Request</span>
                            </Button>
                          </EnrollmentRequestModal>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCourses.map((course) => (
            <Card 
              key={course.id}
              className={`hover-elevate transition-all ${course.isEnrolled ? 'ring-2 ring-primary/20' : ''}`}
              data-testid={`course-card-${course.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-2 mb-0.5">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="text-xs truncate">
                      {course.teacherName}
                    </CardDescription>
                  </div>
                  {course.isEnrolled && (
                    <Badge className="text-xs flex-shrink-0">
                      <UserCheck className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-2 pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {course.description || "No description available."}
                </p>
                
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    <span>Grade {course.grade}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{course.subject}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{course.enrollmentCount || 0}</span>
                  </div>
                </div>
                
                <div className="pt-1 space-y-1.5">
                  <Link href={`/courses/${course.id}`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      data-testid={`button-view-details-${course.id}`}
                    >
                      <Eye className="w-3 h-3 mr-1.5" />
                      <span className="text-xs">View Details</span>
                    </Button>
                  </Link>

                  {showEnrollButton && currentUser.role === "student" && (
                    <>
                      {course.isEnrolled ? (
                        <Button
                          disabled
                          size="sm"
                          className="w-full"
                          variant="secondary"
                          data-testid={`button-enrolled-${course.id}`}
                        >
                          <UserCheck className="w-3 h-3 mr-1.5" />
                          <span className="text-xs">Enrolled</span>
                        </Button>
                      ) : course.enrollmentRequest ? (
                        <Button
                          disabled
                          size="sm"
                          className="w-full min-w-0"
                          variant="secondary"
                          data-testid={`button-request-pending-${course.id}`}
                        >
                          <Clock className="w-3 h-3 mr-1.5 flex-shrink-0" />
                          <span className="text-xs truncate">
                            {course.enrollmentRequest.status === 'requested' ? "Pending" : 
                             course.enrollmentRequest.status === 'parent_approved' ? 'Approved' : 'Pending'}
                          </span>
                        </Button>
                      ) : (
                        <EnrollmentRequestModal course={course} student={currentUser}>
                          <Button 
                            size="sm"
                            className="w-full"
                            data-testid={`button-request-enrollment-${course.id}`}
                          >
                            <FileText className="w-3 h-3 mr-1.5" />
                            <span className="text-xs">Request</span>
                          </Button>
                        </EnrollmentRequestModal>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}