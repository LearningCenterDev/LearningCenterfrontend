import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  TrendingUp, 
  BookOpen, 
  Award, 
  Target, 
  BarChart3, 
  Calendar, 
  ArrowRight, 
  GraduationCap, 
  CheckCircle, 
  Circle, 
  ChevronRight,
  Trophy,
  Sparkles,
  Clock,
  Star,
  Zap,
  LineChart
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Course, Grade, Assignment, Enrollment, Submission, CourseProgressSummary } from "@shared/schema";

interface StudentProgressProps {
  studentId: string;
}

export default function StudentProgress({ studentId }: StudentProgressProps) {
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments/user", studentId],
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/students", studentId, "courses"],
    enabled: enrollments.length > 0,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/students", studentId, "assignments"],
    enabled: enrollments.length > 0,
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/submissions/student", studentId],
  });

  const { data: grades = [], isLoading: gradesLoading } = useQuery<Grade[]>({
    queryKey: ["/api/grades/student", studentId],
  });

  const isLoading = enrollmentsLoading || coursesLoading || assignmentsLoading || submissionsLoading || gradesLoading;

  const totalAssignments = assignments.length;
  const completedAssignments = submissions.length;
  const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
  
  const averageGrade = grades.length > 0 
    ? grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length
    : 0;
  
  const overallGPA = (averageGrade / 100) * 4.0;
  const attendanceRate = 0;

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 80) return 'secondary';
    if (score >= 70) return 'outline';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-20 mb-3" />
              <Skeleton className="h-10 w-20" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto" data-testid="progress-page">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] flex items-center justify-center shadow-lg">
            <LineChart className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Academic Progress</h1>
            <p className="text-muted-foreground">Track your performance and achievements</p>
          </div>
        </div>
        <Badge className="bg-[#2FBF71]/10 text-[#2FBF71] dark:bg-[#2FBF71]/20 dark:text-emerald-400 border-[#2FBF71]/20 text-sm px-4 py-2 w-fit" data-testid="progress-overview">
          <TrendingUp className="w-4 h-4 mr-2" />
          Performance Overview
        </Badge>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-[#1F3A5F] via-[#2a4a75] to-[#1F3A5F] text-white relative" data-testid="overall-gpa">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
          <CardContent className="p-5 relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/80 text-sm font-medium">GPA</span>
            </div>
            <div className="text-3xl font-bold">{overallGPA.toFixed(2)}</div>
            <div className="text-sm text-white/60 mt-1">Out of 4.0</div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden relative" data-testid="completion-rate">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#2FBF71]/10 rounded-full blur-xl"></div>
          <CardContent className="p-5 relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#2FBF71]/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#2FBF71]" />
              </div>
              <span className="text-muted-foreground text-sm font-medium">Completion</span>
            </div>
            <div className="text-3xl font-bold text-[#2FBF71]">{completionRate.toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground mt-1">{completedAssignments}/{totalAssignments} done</div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden relative" data-testid="attendance-rate">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl"></div>
          <CardContent className="p-5 relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-muted-foreground text-sm font-medium">Attendance</span>
            </div>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{attendanceRate.toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground mt-1">Class attendance</div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden relative" data-testid="active-courses">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl"></div>
          <CardContent className="p-5 relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-muted-foreground text-sm font-medium">Courses</span>
            </div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{courses.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Currently enrolled</div>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance */}
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-[#1F3A5F]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#1F3A5F]" />
              </div>
              Course Performance
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="border-2 border-dashed rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1F3A5F]/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-[#1F3A5F]/40" />
              </div>
              <p className="font-semibold mb-1">No courses enrolled</p>
              <p className="text-sm text-muted-foreground">Your course progress will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course, index) => {
                const courseAssignments = assignments.filter(a => a.courseId === course.id);
                const courseSubmissions = submissions.filter(s => 
                  courseAssignments.some(a => a.id === s.assignmentId)
                );
                const courseGrades = grades.filter(g => 
                  courseSubmissions.some(s => s.id === g.submissionId)
                );
                const courseAverage = courseGrades.length > 0 
                  ? courseGrades.reduce((sum, g) => sum + g.score, 0) / courseGrades.length 
                  : 0;
                const courseCompletion = courseAssignments.length > 0 
                  ? (courseSubmissions.length / courseAssignments.length) * 100 
                  : 0;

                const colorThemes = [
                  { bg: 'bg-[#1F3A5F]', light: 'bg-[#1F3A5F]/10', accent: 'text-[#1F3A5F]', progressFill: 'bg-gradient-to-r from-[#1F3A5F] to-[#2a4a75]' },
                  { bg: 'bg-[#2FBF71]', light: 'bg-[#2FBF71]/10', accent: 'text-[#2FBF71]', progressFill: 'bg-gradient-to-r from-[#2FBF71] to-[#25a060]' },
                  { bg: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-900/30', accent: 'text-purple-600 dark:text-purple-400', progressFill: 'bg-gradient-to-r from-purple-500 to-purple-600' },
                  { bg: 'bg-amber-500', light: 'bg-amber-100 dark:bg-amber-900/30', accent: 'text-amber-600 dark:text-amber-400', progressFill: 'bg-gradient-to-r from-amber-500 to-orange-500' },
                ];
                const theme = colorThemes[index % colorThemes.length];

                return (
                  <div 
                    key={course.id}
                    className="p-4 rounded-xl border hover:shadow-md transition-all hover:border-[#1F3A5F]/30"
                    data-testid={`course-progress-${course.id}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${theme.bg} flex items-center justify-center flex-shrink-0`}>
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base mb-1">{course.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.subject} • Grade {course.grade}
                        </p>
                      </div>
                      
                      <div className="md:w-48 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className={`font-bold ${theme.accent}`}>{courseCompletion.toFixed(0)}%</span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${theme.progressFill} transition-all duration-500 rounded-full`}
                            style={{ width: `${courseCompletion}%` }}
                            data-testid={`course-progress-bar-${course.id}`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {courseSubmissions.length}/{courseAssignments.length} submitted
                          {courseGrades.length > 0 && ` • ${courseGrades.length} graded`}
                        </p>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <Badge 
                          className={`text-sm px-3 py-1.5 ${
                            courseAverage >= 90 ? 'bg-[#2FBF71]/10 text-[#2FBF71] border-[#2FBF71]/20' :
                            courseAverage >= 80 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200' :
                            courseAverage >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200' :
                            courseAverage > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200' :
                            'bg-muted text-muted-foreground'
                          }`}
                        >
                          {courseAverage > 0 ? `${courseAverage.toFixed(1)}%` : 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Curriculum Progress Section */}
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-[#2FBF71]/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-[#2FBF71]" />
              </div>
              Curriculum Progress
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="border-2 border-dashed rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#2FBF71]/10 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-[#2FBF71]/40" />
              </div>
              <p className="font-semibold mb-1">No courses enrolled</p>
              <p className="text-sm text-muted-foreground">Your curriculum progress will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <CurriculumProgressCard 
                  key={course.id} 
                  courseId={course.id} 
                  courseTitle={course.title}
                  studentId={studentId} 
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Grades */}
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              Recent Grades
            </CardTitle>
            {grades.length > 5 && (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-[#1F3A5F]"
                data-testid="button-view-all-grades"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="border-2 border-dashed rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-amber-600/40 dark:text-amber-400/40" />
              </div>
              <p className="font-semibold mb-1">No grades yet</p>
              <p className="text-sm text-muted-foreground">Grades will appear once teachers grade your work</p>
            </div>
          ) : (
            <div className="space-y-3">
              {grades
                .sort((a, b) => {
                  const dateA = a.gradedAt ? new Date(a.gradedAt).getTime() : 0;
                  const dateB = b.gradedAt ? new Date(b.gradedAt).getTime() : 0;
                  return dateB - dateA;
                })
                .slice(0, 10)
                .map((grade) => {
                  const submission = submissions.find(s => s.id === grade.submissionId);
                  const assignment = submission ? assignments.find(a => a.id === submission.assignmentId) : undefined;
                  const course = assignment ? courses.find(c => c.id === assignment.courseId) : undefined;
                  
                  return (
                    <div 
                      key={grade.id}
                      className="p-4 rounded-xl border hover:shadow-md transition-all flex items-center gap-4"
                      data-testid={`grade-${grade.id}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        grade.score >= 90 ? 'bg-[#2FBF71]/10' :
                        grade.score >= 80 ? 'bg-blue-100 dark:bg-blue-900/30' :
                        grade.score >= 70 ? 'bg-amber-100 dark:bg-amber-900/30' :
                        'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        <Star className={`w-6 h-6 ${
                          grade.score >= 90 ? 'text-[#2FBF71]' :
                          grade.score >= 80 ? 'text-blue-600 dark:text-blue-400' :
                          grade.score >= 70 ? 'text-amber-600 dark:text-amber-400' :
                          'text-red-600 dark:text-red-400'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{assignment?.title || 'Assignment'}</h4>
                        <p className="text-xs text-muted-foreground truncate">{course?.title || 'Unknown Course'}</p>
                        {grade.feedback && (
                          <p className="text-xs text-muted-foreground italic line-clamp-1 mt-1">
                            "{grade.feedback}"
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          {grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString() : 'Recently'}
                        </div>
                        <Badge 
                          className={`text-sm px-3 py-1 ${
                            grade.score >= 90 ? 'bg-[#2FBF71]/10 text-[#2FBF71] border-[#2FBF71]/20' :
                            grade.score >= 80 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200' :
                            grade.score >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
                          }`}
                        >
                          {grade.score}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CurriculumProgressCard({ courseId, courseTitle, studentId }: { courseId: string; courseTitle: string; studentId: string }) {
  const { data: progressSummary, isLoading } = useQuery<CourseProgressSummary>({
    queryKey: ["/api/courses", courseId, "progress", studentId],
  });

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-2 flex-1 ml-4" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    );
  }

  if (!progressSummary || progressSummary.totalUnits === 0) {
    return (
      <div className="p-4 rounded-xl border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="font-medium">{courseTitle}</span>
          </div>
          <Badge variant="secondary" className="text-xs">No curriculum</Badge>
        </div>
      </div>
    );
  }

  return (
    <Card className="border shadow-sm" data-testid={`curriculum-progress-${courseId}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              progressSummary.progressPercentage >= 100 ? 'bg-[#2FBF71]/10' : 'bg-[#1F3A5F]/10'
            }`}>
              <GraduationCap className={`w-5 h-5 ${
                progressSummary.progressPercentage >= 100 ? 'text-[#2FBF71]' : 'text-[#1F3A5F]'
              }`} />
            </div>
            <CardTitle className="text-base font-semibold">{courseTitle}</CardTitle>
          </div>
          <Badge 
            className={`${
              progressSummary.progressPercentage >= 100 
                ? 'bg-[#2FBF71]/10 text-[#2FBF71] border-[#2FBF71]/20' 
                : 'bg-[#1F3A5F]/10 text-[#1F3A5F] border-[#1F3A5F]/20'
            }`}
          >
            {progressSummary.progressPercentage >= 100 && <CheckCircle className="w-3.5 h-3.5 mr-1" />}
            {progressSummary.progressPercentage}% Complete
          </Badge>
        </div>
        <CardDescription className="ml-13">
          {progressSummary.completedUnits} of {progressSummary.totalUnits} curriculum units completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              progressSummary.progressPercentage >= 100 
                ? 'bg-gradient-to-r from-[#2FBF71] to-[#25a060]' 
                : 'bg-gradient-to-r from-[#1F3A5F] to-[#2a4a75]'
            }`}
            style={{ width: `${progressSummary.progressPercentage}%` }}
          />
        </div>
        
        <Accordion type="single" collapsible className="space-y-2">
          {progressSummary.units.map((unit, index) => (
            <AccordionItem 
              key={unit.id} 
              value={unit.id}
              className="border rounded-xl overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 text-sm">
                <div className="flex items-center gap-3 flex-1">
                  {unit.isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-[#2FBF71]/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-[#2FBF71]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-left font-medium">{unit.title}</span>
                  {unit.isCompleted && (
                    <Badge className="ml-auto mr-2 text-xs bg-[#2FBF71]/10 text-[#2FBF71] border-[#2FBF71]/20">
                      Completed
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {unit.description && (
                  <p className="text-sm text-muted-foreground mb-3 ml-9">{unit.description}</p>
                )}
                {unit.subsections && unit.subsections.length > 0 && (
                  <div className="ml-9 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Topics covered:</p>
                    <ul className="space-y-1.5">
                      {unit.subsections.map((sub) => (
                        <li key={sub.id} className="flex items-start gap-2 text-sm">
                          <ChevronRight className="w-4 h-4 mt-0.5 text-[#2FBF71]" />
                          <span>{sub.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {unit.completedAt && (
                  <p className="text-xs text-muted-foreground mt-3 ml-9 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Completed on {new Date(unit.completedAt).toLocaleDateString()}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
