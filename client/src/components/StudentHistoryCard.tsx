import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileText, Award, ChevronDown, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import type { Enrollment, Submission, Grade, Assignment, Course, User } from "@shared/schema";

interface EnrollmentWithCourse extends Enrollment {
  course?: Course;
}

interface SubmissionWithDetails extends Submission {
  assignment?: Assignment;
  grade?: Grade;
}

interface GradeWithDetails extends Grade {
  submission?: Submission & {
    assignment?: Assignment;
  };
}

interface StudentHistory {
  enrollments: EnrollmentWithCourse[];
  submissions: SubmissionWithDetails[];
  grades: GradeWithDetails[];
}

export default function StudentHistoryCard({ studentId }: { studentId: string }) {
  // Fetch comprehensive history data
  const { data: history, isLoading } = useQuery<StudentHistory>({
    queryKey: ["/api/students", studentId, "history"],
  });

  const enrollments = history?.enrollments || [];
  const submissions = history?.submissions || [];
  const grades = history?.grades || [];

  // Get active and completed courses
  const activeCourses = enrollments.filter(e => e.course?.isActive);
  const completedCourses = enrollments.filter(e => !e.course?.isActive);

  // Helper function to get submissions for a course
  const getCourseSubmissions = (courseId: string) => {
    return submissions.filter(s => s.assignment?.courseId === courseId);
  };

  // Helper function to get grades for a course
  const getCourseGrades = (courseId: string) => {
    return grades.filter(g => g.submission?.assignment?.courseId === courseId);
  };

  const CourseSection = ({ enrollment, isActive }: { enrollment: EnrollmentWithCourse; isActive: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const courseSubmissions = getCourseSubmissions(enrollment.course?.id || '');
    const courseGrades = getCourseGrades(enrollment.course?.id || '');
    
    const gradedSubmissions = courseSubmissions.filter(s => s.grade);
    const pendingSubmissions = courseSubmissions.filter(s => !s.grade);

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-3 rounded-md bg-muted">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-start justify-between gap-3 w-full">
              <div className="flex-1 text-left">
                <div className="font-medium flex items-center gap-2">
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                  {enrollment.course?.title}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {enrollment.course?.subject} • {enrollment.course?.grade}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Enrolled: {format(new Date(enrollment.enrolledAt!), 'MMM d, yyyy')}
                </div>
              </div>
              <Badge variant={isActive ? "default" : "outline"} className="shrink-0">
                {isActive ? 'Active' : 'Completed'}
              </Badge>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-4">
            <div className="space-y-4 pl-6">
              {/* Assignments Section */}
              {courseSubmissions.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Assignments ({courseSubmissions.length})
                  </h5>
                  <div className="space-y-2">
                    {gradedSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="p-2 rounded bg-background flex items-start justify-between gap-3"
                        data-testid={`submission-${submission.id}`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{submission.assignment?.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {submission.assignment?.type} • Submitted: {format(new Date(submission.submittedAt!), 'MMM d, yyyy')}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold">
                            {submission.grade?.score}/{submission.assignment?.maxScore}
                          </div>
                          <Badge variant="default" className="mt-1">Graded</Badge>
                        </div>
                      </div>
                    ))}
                    {pendingSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="p-2 rounded bg-background flex items-start justify-between gap-3"
                        data-testid={`submission-${submission.id}`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{submission.assignment?.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {submission.assignment?.type} • Submitted: {format(new Date(submission.submittedAt!), 'MMM d, yyyy')}
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0">Pending</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grades Section */}
              {courseGrades.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Grades ({courseGrades.length})
                  </h5>
                  <div className="space-y-2">
                    {courseGrades.map((grade) => (
                      <div
                        key={grade.id}
                        className="p-2 rounded bg-background"
                        data-testid={`grade-${grade.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{grade.submission?.assignment?.title}</div>
                            <div className="text-xs text-muted-foreground">
                              Graded: {format(new Date(grade.gradedAt!), 'MMM d, yyyy')}
                            </div>
                            {grade.feedback && (
                              <div className="text-xs mt-1 text-muted-foreground">
                                <span className="font-medium">Feedback:</span> {grade.feedback}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-semibold">{grade.score}/{grade.submission?.assignment?.maxScore}</div>
                            <div className="text-xs text-muted-foreground">
                              {((grade.score / (grade.submission?.assignment?.maxScore || 100)) * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {courseSubmissions.length === 0 && courseGrades.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No assignments or grades yet
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Student History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading history...</div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No courses found</div>
        ) : (
          <>
            {activeCourses.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Active Courses ({activeCourses.length})
                </h4>
                {activeCourses.map((enrollment) => (
                  <CourseSection key={enrollment.id} enrollment={enrollment} isActive={true} />
                ))}
              </div>
            )}

            {completedCourses.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Completed Courses ({completedCourses.length})
                </h4>
                {completedCourses.map((enrollment) => (
                  <CourseSection key={enrollment.id} enrollment={enrollment} isActive={false} />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
