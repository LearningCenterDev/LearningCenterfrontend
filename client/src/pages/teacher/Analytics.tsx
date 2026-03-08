import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award, 
  BookOpen, 
  Target, 
  Calendar,
  Download,
  FileText,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface TeacherAnalyticsProps {
  teacherId: string;
}

interface AnalyticsData {
  coursePerformance: {
    courseId: string;
    courseName: string;
    averageGrade: number;
    studentCount: number;
    assignmentCount: number;
    completionRate: number;
  }[];
  studentProgress: {
    totalStudents: number;
    passingStudents: number;
    strugglingStudents: number;
    honorStudents: number;
  };
  assignmentStats: {
    totalAssignments: number;
    gradedAssignments: number;
    averageScore: number;
    submissionRate: number;
  };
  attendanceData: {
    averageAttendance: number;
    presentStudents: number;
    absentStudents: number;
    lateStudents: number;
  };
}

export default function TeacherAnalytics({ teacherId }: TeacherAnalyticsProps) {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/teacher/analytics", teacherId],
    queryFn: async () => {
      const res = await fetch(`/api/teacher/analytics/${teacherId}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
    refetchOnWindowFocus: true, // Refetch when window regains focus
    staleTime: 0, // Allow refetching when section is opened
  });

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'default';
    if (grade >= 80) return 'secondary';
    if (grade >= 70) return 'outline';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const {
    coursePerformance = [],
    studentProgress = { totalStudents: 0, passingStudents: 0, strugglingStudents: 0, honorStudents: 0 },
    assignmentStats = { totalAssignments: 0, gradedAssignments: 0, averageScore: 0, submissionRate: 0 },
    attendanceData = { averageAttendance: 0, presentStudents: 0, absentStudents: 0, lateStudents: 0 }
  } = analytics || {};

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto" data-testid="teacher-analytics-page">
      {/* Modern Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Track teaching performance and student progress
          </p>
        </div>
        <Button variant="outline" data-testid="button-export-analytics">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics with Vibrant Colors */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Total Students</span>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary mb-1" data-testid="total-students">
              {studentProgress.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card className="border-secondary/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Average Grade</span>
              <div className="p-2 rounded-lg bg-secondary/10">
                <Award className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-secondary mb-1" data-testid="average-grade">
              {assignmentStats.averageScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Class performance</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Submission Rate</span>
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary mb-1" data-testid="submission-rate">
              {assignmentStats.submissionRate.toFixed(0)}%
            </div>
            <Progress 
              value={assignmentStats.submissionRate} 
              className="mt-2"
              data-testid="submission-progress"
            />
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Attendance Rate</span>
              <div className="p-2 rounded-lg bg-secondary/10">
                <Calendar className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-secondary mb-1" data-testid="attendance-rate">
              {attendanceData.averageAttendance.toFixed(0)}%
            </div>
            <Progress 
              value={attendanceData.averageAttendance} 
              className="mt-2"
              data-testid="attendance-progress"
            />
          </CardContent>
        </Card>
      </div>

      {/* Student Performance Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <span>Student Performance Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Honor Students (90%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{studentProgress.honorStudents}</span>
                  <Badge variant="default" className="text-xs">
                    {studentProgress.totalStudents > 0 
                      ? ((studentProgress.honorStudents / studentProgress.totalStudents) * 100).toFixed(0)
                      : 0
                    }%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Passing Students (70%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{studentProgress.passingStudents}</span>
                  <Badge variant="secondary" className="text-xs">
                    {studentProgress.totalStudents > 0 
                      ? ((studentProgress.passingStudents / studentProgress.totalStudents) * 100).toFixed(0)
                      : 0
                    }%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Struggling Students (&lt;70%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{studentProgress.strugglingStudents}</span>
                  <Badge variant="destructive" className="text-xs">
                    {studentProgress.totalStudents > 0 
                      ? ((studentProgress.strugglingStudents / studentProgress.totalStudents) * 100).toFixed(0)
                      : 0
                    }%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-secondary/10">
                <BarChart3 className="w-5 h-5 text-secondary" />
              </div>
              <span>Assignment Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Assignments</span>
                <span className="text-lg font-semibold">{assignmentStats.totalAssignments}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Graded</span>
                <span className="text-lg font-semibold">{assignmentStats.gradedAssignments}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Grading Progress</span>
                  <span className="text-sm font-medium">
                    {assignmentStats.totalAssignments > 0 
                      ? ((assignmentStats.gradedAssignments / assignmentStats.totalAssignments) * 100).toFixed(0)
                      : 0
                    }%
                  </span>
                </div>
                <Progress 
                  value={assignmentStats.totalAssignments > 0 
                    ? (assignmentStats.gradedAssignments / assignmentStats.totalAssignments) * 100 
                    : 0
                  } 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <span>Course Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coursePerformance.length === 0 ? (
            <div className="py-20 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-4 rounded-full bg-primary/10 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">No course data available</h3>
                <p className="text-muted-foreground">
                  Course performance analytics will appear here once you have active courses with student data.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {coursePerformance.map((course) => (
                <Card 
                  key={course.courseId}
                  className="cursor-pointer transition-all group hover:border-primary/40"
                  data-testid={`course-analytics-${course.courseId}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{course.courseName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.studentCount} students • {course.assignmentCount} assignments
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getGradeColor(course.averageGrade)} className="text-xs">
                          {course.averageGrade.toFixed(1)}% avg
                        </Badge>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <div className="text-muted-foreground">Average Grade</div>
                        <div className="font-medium">{course.averageGrade.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Students</div>
                        <div className="font-medium">{course.studentCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Assignments</div>
                        <div className="font-medium">{course.assignmentCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Completion</div>
                        <div className="font-medium">{course.completionRate.toFixed(0)}%</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Course Performance</span>
                        <span>{course.averageGrade.toFixed(0)}%</span>
                      </div>
                      <Progress value={course.averageGrade} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-secondary/10">
              <BarChart3 className="w-5 h-5 text-secondary" />
            </div>
            <span>Analytics Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center gap-3"
              data-testid="button-export-data"
            >
              <div className="p-3 rounded-full bg-primary/10">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-base mb-1">Export Data</div>
                <div className="text-sm text-muted-foreground">Download detailed reports</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center gap-3"
              data-testid="button-student-reports"
            >
              <div className="p-3 rounded-full bg-secondary/10">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-base mb-1">Student Reports</div>
                <div className="text-sm text-muted-foreground">Individual progress reports</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
