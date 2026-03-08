import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import UserAvatar from "@/components/UserAvatar";
import { BookOpen, CheckCircle, XCircle, Clock, User, GraduationCap, Award, TrendingUp, Calendar, FileText, ChevronRight, Circle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Course, Grade, Enrollment, StudentTeacherAssignment, CourseProgressSummary } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface ChildProgressProps {
  parentId: string;
}

interface CourseProgress {
  course: Course;
  enrollment: Enrollment;
  grades: Grade[];
  completedAssignments: number;
  totalAssignments: number;
  averageScore: number;
}

interface ChildWithCourses {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  avatarUrl?: string;
  courseProgress: CourseProgress[];
}

export default function ChildProgress({ parentId }: ChildProgressProps) {
  const { toast } = useToast();

  const { data: children = [], isLoading: childrenLoading } = useQuery<any[]>({
    queryKey: ["/api/parents", parentId, "children"],
    queryFn: async () => {
      const res = await fetch(`/api/parents/${parentId}/children`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch children");
      return res.json();
    }
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

  const { data: courses = [] } = useQuery<Course[]>({
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

  const isLoading = childrenLoading || requestsLoading;
  const pendingRequests = enrollmentRequests.filter(r => r.status === 'requested');

  return (
    <div className="space-y-6 mx-auto max-w-7xl px-6 py-6" data-testid="child-progress-page">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Child Progress</h1>
        <p className="text-muted-foreground">
          Track your children's academic progress and authorize course enrollments
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
            {pendingRequests.map((request) => {
              const course = getCourseInfo(request.courseId);
              const childName = getChildName(request.studentId);
              
              return (
                <div key={request.id} className="p-4 border rounded-lg bg-card hover-elevate transition-colors" data-testid={`request-${request.id}`}>
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
            })}
          </CardContent>
        </Card>
      )}

      {/* Children Progress */}
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
                <Skeleton className="h-40 w-full" />
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
          children.map((child) => (
            <ChildProgressCard
              key={child.id}
              child={child}
              parentId={parentId}
              courses={courses}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ChildProgressCard({ child, parentId, courses }: any) {
  const [selectedCourse, setSelectedCourse] = useState<CourseProgress | null>(null);
  const childName = `${child.firstName || ''} ${child.lastName || ''}`.trim() || child.name || 'Unknown';

  const { data: enrolledCourses = [], isLoading: enrolledCoursesLoading } = useQuery<any[]>({
    queryKey: ["/api/students", child.id, "courses"],
    queryFn: async () => {
      const res = await fetch(`/api/students/${child.id}/courses`, {
        credentials: "include"
      });
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: grades = [], isLoading: gradesLoading } = useQuery<Grade[]>({
    queryKey: ["/api/grades/student", child.id],
    queryFn: async () => {
      const res = await fetch(`/api/grades/student/${child.id}`, {
        credentials: "include"
      });
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<any[]>({
    queryKey: ["/api/submissions/student", child.id],
    queryFn: async () => {
      const res = await fetch(`/api/submissions/student/${child.id}`, {
        credentials: "include"
      });
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Fetch all assignments to map them to courses
  const { data: allAssignments = [], isLoading: assignmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/assignments", child.id],
    queryFn: async () => {
      // Fetch assignments for all enrolled courses
      const assignmentPromises = enrolledCourses.map(async (course) => {
        const res = await fetch(`/api/courses/${course.id}/assignments`, {
          credentials: "include"
        });
        if (!res.ok) return [];
        return res.json();
      });
      const results = await Promise.all(assignmentPromises);
      return results.flat();
    },
    enabled: enrolledCourses.length > 0
  });

  // Fetch student-teacher assignments for this child
  const { data: studentAssignments = [] } = useQuery<StudentTeacherAssignment[]>({
    queryKey: ["/api/student-teacher-assignments/student", child.id],
    queryFn: async () => {
      const res = await fetch(`/api/student-teacher-assignments/student/${child.id}`, {
        credentials: "include"
      });
      if (!res.ok) return [];
      return res.json();
    }
  });

  const isLoading = enrolledCoursesLoading || gradesLoading || submissionsLoading || assignmentsLoading;

  // Build course progress data
  const courseProgress: CourseProgress[] = enrolledCourses.map((course) => {
    // Get assignments for this course
    const courseAssignments = allAssignments.filter(a => a.courseId === course.id);
    const courseAssignmentIds = courseAssignments.map(a => a.id);
    
    // Filter submissions and grades by this course's assignments
    const courseSubmissions = submissions.filter(s => courseAssignmentIds.includes(s.assignmentId));
    // Match grades to submissions, then filter by course assignments
    const courseGrades = grades.filter(g => {
      const submission = submissions.find(s => s.id === g.submissionId);
      return submission && courseAssignmentIds.includes(submission.assignmentId);
    });

    const completedAssignments = courseSubmissions.filter(s => 
      courseGrades.some(g => g.submissionId === s.id)
    ).length;
    const totalAssignments = courseAssignments.length;
    const averageScore = courseGrades.length > 0
      ? courseGrades.reduce((sum, g) => sum + g.score, 0) / courseGrades.length
      : 0;

    return {
      course: course,
      enrollment: { courseId: course.id, enrolledAt: new Date(), studentId: child.id } as any,
      grades: courseGrades,
      completedAssignments,
      totalAssignments,
      averageScore,
    };
  });

  const overallGPA = grades.length > 0
    ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length / 25
    : 0;

  const totalCompletedAssignments = submissions.filter(s => s.grade !== undefined && s.grade !== null).length;
  const totalAssignments = submissions.length;
  const completionRate = totalAssignments > 0 ? (totalCompletedAssignments / totalAssignments) * 100 : 0;

  return (
    <Card data-testid={`child-card-${child.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{childName}</CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-xs">
              GPA {overallGPA.toFixed(2)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {enrolledCourses.length} {enrolledCourses.length === 1 ? 'Course' : 'Courses'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats Summary */}
        <div className="flex items-center gap-4 py-2 px-3 rounded-lg bg-muted/30 border border-border/40">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Completion Rate</p>
            <p className="text-sm font-semibold">{completionRate.toFixed(0)}%</p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Assignments</p>
            <p className="text-sm font-semibold">{totalCompletedAssignments}/{totalAssignments}</p>
          </div>
          <Progress value={completionRate} className="h-2 w-16" />
        </div>

        {/* Course-by-Course Progress */}
        <div>
          <h4 className="font-semibold text-base mb-3">Courses</h4>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : courseProgress.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No courses enrolled
            </div>
          ) : (
            <div className="space-y-2">
              {courseProgress.map((cp) => (
                <div
                  key={cp.course.id}
                  className="p-3 border rounded-lg hover-elevate cursor-pointer flex items-center justify-between gap-3"
                  data-testid={`course-${cp.course.id}`}
                  onClick={() => setSelectedCourse(cp)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h5 className="font-medium text-sm">{cp.course.title}</h5>
                      {cp.course.subject && (
                        <p className="text-xs text-muted-foreground">
                          {cp.course.subject}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{cp.completedAssignments}/{cp.totalAssignments}</span>
                      <span>•</span>
                      <span>{cp.grades.length} grades</span>
                    </div>
                  </div>
                  <Badge 
                    variant={cp.averageScore >= 90 ? 'default' : cp.averageScore >= 70 ? 'secondary' : 'outline'}
                    className="flex-shrink-0 text-xs"
                  >
                    {cp.averageScore > 0 ? `${cp.averageScore.toFixed(0)}%` : 'N/A'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Course Details Dialog */}
      {selectedCourse && (
        <CourseDetailsDialog
          courseProgress={selectedCourse}
          childName={childName}
          childId={child.id}
          onClose={() => setSelectedCourse(null)}
          assignments={allAssignments.filter(a => a.courseId === selectedCourse.course.id)}
          submissions={submissions}
          studentAssignments={studentAssignments}
        />
      )}
    </Card>
  );
}

function CourseDetailsDialog({ courseProgress, childName, childId, onClose, assignments, submissions, studentAssignments }: any) {
  const { course, grades, enrollment, completedAssignments, totalAssignments, averageScore } = courseProgress;
  
  const assignment = studentAssignments.find((a: StudentTeacherAssignment) => a.courseId === course.id);
  const teacherIdToFetch = assignment ? assignment.teacherId : course.teacherId;
  
  const { data: teacher } = useQuery({
    queryKey: ["/api/users", teacherIdToFetch],
    queryFn: async () => {
      const res = await fetch(`/api/users/${teacherIdToFetch}`, {
        credentials: "include"
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!teacherIdToFetch
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["/api/courses", course.id, "schedules"],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${course.id}/schedules`, {
        credentials: "include"
      });
      if (!res.ok) return [];
      return res.json();
    }
  });

  const teacherName = teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.email : 'No teacher assigned';

  const assignmentsWithGrades = assignments.map((assignment: any) => {
    const submission = submissions.find((s: any) => s.assignmentId === assignment.id);
    const grade = submission ? grades.find((g: Grade) => g.submissionId === submission.id) : undefined;
    return {
      ...assignment,
      submission,
      grade
    };
  });

  const upcomingSchedules = schedules.filter((s: any) => {
    const scheduleDate = new Date(s.date);
    return scheduleDate >= new Date() && s.status !== 'cancelled';
  }).slice(0, 3);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            {course.title}
          </DialogTitle>
          <DialogDescription>
            {childName}'s progress in this course
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Overview */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-2xl font-bold text-primary">
                      {averageScore > 0 ? `${averageScore.toFixed(1)}%` : 'No grades'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <CheckCircle className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assignments</p>
                    <p className="text-2xl font-bold text-secondary">
                      {completedAssignments}/{totalAssignments}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Course Information</h3>
            <div className="grid gap-3">
              {course.description && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{course.description}</p>
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Teacher</p>
                  </div>
                  <p className="text-sm font-medium">{teacherName}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Enrolled</p>
                  </div>
                  <p className="text-sm font-medium">
                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Curriculum Progress */}
          <CurriculumProgressSection courseId={course.id} studentId={childId} />

          {/* Upcoming Schedule */}
          {upcomingSchedules.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming Classes
              </h3>
              <div className="space-y-2">
                {upcomingSchedules.map((schedule: any) => (
                  <div key={schedule.id} className="p-3 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{schedule.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(schedule.date).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{schedule.location || 'Online'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignments and Grades */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Assignments & Grades
            </h3>
            {assignmentsWithGrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No assignments yet
              </div>
            ) : (
              <div className="space-y-2">
                {assignmentsWithGrades.map((assignment: any) => (
                  <div key={assignment.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{assignment.title}</h4>
                        {assignment.description && (
                          <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          <span>Max Score: {assignment.maxScore}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        {assignment.grade ? (
                          <div>
                            <Badge 
                              variant={assignment.grade.score >= 90 ? 'default' : assignment.grade.score >= 70 ? 'secondary' : 'outline'}
                              className="text-lg px-3 py-1"
                            >
                              {assignment.grade.score}%
                            </Badge>
                            {assignment.grade.feedback && (
                              <p className="text-xs text-muted-foreground mt-1">Graded</p>
                            )}
                          </div>
                        ) : assignment.submission ? (
                          <Badge variant="outline">Submitted</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Not submitted</Badge>
                        )}
                      </div>
                    </div>
                    {assignment.grade?.feedback && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/50">
                        <p className="text-sm font-medium mb-1">Teacher Feedback:</p>
                        <p className="text-sm text-muted-foreground">{assignment.grade.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose} data-testid="button-close-dialog">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Curriculum Progress Section Component
function CurriculumProgressSection({ courseId, studentId }: { courseId: string; studentId: string }) {
  const { data: progressSummary, isLoading } = useQuery<CourseProgressSummary>({
    queryKey: ["/api/courses", courseId, "progress", studentId],
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!progressSummary || progressSummary.totalUnits === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <GraduationCap className="w-5 h-5" />
        Curriculum Progress
      </h3>
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {progressSummary.completedUnits} of {progressSummary.totalUnits} units completed
              </p>
            </div>
            <Badge 
              variant={progressSummary.progressPercentage >= 100 ? "default" : "secondary"}
              className={progressSummary.progressPercentage >= 100 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : ""}
            >
              {progressSummary.progressPercentage}% Complete
            </Badge>
          </div>
          <Progress value={progressSummary.progressPercentage} className="h-2" />
          
          <Accordion type="single" collapsible className="space-y-1">
            {progressSummary.units.map((unit) => (
              <AccordionItem 
                key={unit.id} 
                value={unit.id}
                className="border rounded-md overflow-hidden"
              >
                <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50 text-sm">
                  <div className="flex items-center gap-2 flex-1">
                    {unit.isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-left font-medium">{unit.title}</span>
                    {unit.isCompleted && (
                      <Badge variant="secondary" className="ml-auto text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        Completed
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  {unit.description && (
                    <p className="text-sm text-muted-foreground mb-3">{unit.description}</p>
                  )}
                  {unit.subsections && unit.subsections.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Topics covered:</p>
                      <ul className="space-y-1">
                        {unit.subsections.map((sub) => (
                          <li key={sub.id} className="flex items-start gap-2 text-sm pl-2">
                            <ChevronRight className="w-3 h-3 mt-1 text-muted-foreground" />
                            <span>{sub.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {unit.completedAt && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Completed on {new Date(unit.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
