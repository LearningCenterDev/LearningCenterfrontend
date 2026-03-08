import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, 
  Trophy,
  GraduationCap,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  TrendingUp,
  CheckCircle,
  ClipboardList,
  Library,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Course, User, Assignment, Grade, Enrollment, StudentTeacherAssignment } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { CourseBrowser } from "@/components/CourseBrowser";

interface MyCoursesProps {
  studentId: string;
}

interface CourseDetails extends Course {
  teacherName?: string;
  enrollmentDate?: string;
  assignmentCount?: number;
  upcomingAssignments?: Assignment[];
  recentGrades?: Grade[];
  totalStudents?: number;
  completedAssignments?: number;
  averageGrade?: number;
  enrollmentStatus?: 'enrolled' | 'approved' | 'none';
}

export default function MyCourses({ studentId }: MyCoursesProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: courses = [], isLoading } = useQuery<CourseDetails[]>({
    queryKey: ["/api/students/courses", studentId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/students/${studentId}/courses`);
      const coursesData = await response.json();
      
      let allEnrollments: Enrollment[] = [];
      try {
        const enrollmentResponse = await apiRequest("GET", `/api/students/${studentId}/enrollments`);
        allEnrollments = await enrollmentResponse.json();
      } catch (error) {
        console.error('Error fetching enrollments:', error);
      }

      let studentAssignments: StudentTeacherAssignment[] = [];
      try {
        const assignmentsResponse = await apiRequest("GET", `/api/student-teacher-assignments/student/${studentId}`);
        studentAssignments = await assignmentsResponse.json();
      } catch (error) {
        console.error('Error fetching student-teacher assignments:', error);
      }
      
      const coursesWithDetails = await Promise.all(
        coursesData.map(async (course: Course) => {
          let teacher: User | null = null;
          let assignments: Assignment[] = [];
          let grades: Grade[] = [];
          let courseEnrollments: Enrollment[] = [];
          
          const assignment = studentAssignments.find((a: StudentTeacherAssignment) => a.courseId === course.id);
          const teacherIdToFetch = assignment ? assignment.teacherId : course.teacherId;
          
          if (teacherIdToFetch) {
            try {
              const teacherResponse = await apiRequest("GET", `/api/users/${teacherIdToFetch}`);
              teacher = await teacherResponse.json();
            } catch (error) {
              console.error(`Error fetching teacher for course ${course.id}:`, error);
            }
          }
          
          try {
            const assignmentsResponse = await apiRequest("GET", `/api/students/${studentId}/courses/${course.id}/visible-assignments`);
            assignments = await assignmentsResponse.json();
          } catch (error) {
            console.error(`Error fetching assignments for course ${course.id}:`, error);
          }
          
          try {
            const gradesResponse = await apiRequest("GET", `/api/grades/student/${studentId}?courseId=${course.id}`);
            grades = await gradesResponse.json();
          } catch (error) {
            console.error(`Error fetching grades for course ${course.id}:`, error);
          }
          
          try {
            const courseEnrollmentsResponse = await apiRequest("GET", `/api/courses/${course.id}/enrollments`);
            courseEnrollments = await courseEnrollmentsResponse.json();
          } catch (error) {
            console.error(`Error fetching course enrollments for course ${course.id}:`, error);
          }
          
          const enrollment = allEnrollments.find((e: Enrollment) => e.courseId === course.id);
          
          const upcomingAssignments = assignments.filter((a: Assignment) => 
            a.dueDate && new Date(a.dueDate) > new Date()
          ).slice(0, 3);
          
          const recentGrades = grades
            .sort((a: Grade, b: Grade) => {
              const dateA = a.gradedAt ? new Date(a.gradedAt).getTime() : 0;
              const dateB = b.gradedAt ? new Date(b.gradedAt).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 3);
            
          const completedAssignments = grades.length;
          const averageGrade = grades.length > 0 
            ? grades.reduce((sum: number, g: Grade) => sum + (g.score || 0), 0) / grades.length 
            : 0;
          
          return {
            ...course,
            teacherName: teacher ? (teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.email) : "No teacher assigned",
            enrollmentDate: enrollment?.enrolledAt,
            assignmentCount: assignments.length,
            upcomingAssignments,
            recentGrades,
            totalStudents: courseEnrollments.length,
            completedAssignments,
            averageGrade,
          };
        })
      );
      
      return coursesWithDetails;
    },
  });

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
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto" data-testid="my-courses-page">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] flex items-center justify-center shadow-lg">
            <Library className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
            <p className="text-muted-foreground">Continue learning and track your progress</p>
          </div>
        </div>
        <Badge className="bg-[#1F3A5F]/10 text-[#1F3A5F] dark:bg-[#1F3A5F]/20 dark:text-blue-300 border-[#1F3A5F]/20 text-sm px-4 py-2 w-fit" data-testid="course-count">
          <BookOpen className="w-4 h-4 mr-2" />
          {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} Enrolled
        </Badge>
      </div>

      {courses.length === 0 ? (
        <Card className="border-2 border-dashed rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#1F3A5F]/10 flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-10 h-10 text-[#1F3A5F]/40" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No courses enrolled</h3>
          <p className="text-muted-foreground mb-6">Contact your administrator to get started with your learning journey</p>
          <Button className="bg-[#1F3A5F] hover:bg-[#2a4a75]">
            <Sparkles className="w-4 h-4 mr-2" />
            Browse Available Courses
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course, index) => {
            const progressPercent = course.assignmentCount && course.assignmentCount > 0
              ? Math.round(((course.completedAssignments || 0) / course.assignmentCount) * 100)
              : 0;
            
            const colorThemes = [
              { 
                bg: 'bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75]', 
                light: 'bg-[#1F3A5F]/10 dark:bg-[#1F3A5F]/20', 
                accent: 'text-[#1F3A5F] dark:text-blue-400', 
                progressBg: 'bg-[#1F3A5F]/20', 
                progressFill: 'bg-gradient-to-r from-[#1F3A5F] to-[#2a4a75]',
                border: 'border-l-[#1F3A5F]',
                badge: 'bg-[#1F3A5F]/10 text-[#1F3A5F] dark:text-blue-400'
              },
              { 
                bg: 'bg-gradient-to-br from-[#2FBF71] to-[#25a060]', 
                light: 'bg-[#2FBF71]/10 dark:bg-[#2FBF71]/20', 
                accent: 'text-[#2FBF71] dark:text-emerald-400', 
                progressBg: 'bg-[#2FBF71]/20', 
                progressFill: 'bg-gradient-to-r from-[#2FBF71] to-[#25a060]',
                border: 'border-l-[#2FBF71]',
                badge: 'bg-[#2FBF71]/10 text-[#2FBF71] dark:text-emerald-400'
              },
              { 
                bg: 'bg-gradient-to-br from-purple-500 to-purple-600', 
                light: 'bg-purple-100 dark:bg-purple-900/30', 
                accent: 'text-purple-600 dark:text-purple-400', 
                progressBg: 'bg-purple-200 dark:bg-purple-800/50', 
                progressFill: 'bg-gradient-to-r from-purple-500 to-purple-600',
                border: 'border-l-purple-500',
                badge: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
              },
              { 
                bg: 'bg-gradient-to-br from-amber-500 to-orange-500', 
                light: 'bg-amber-100 dark:bg-amber-900/30', 
                accent: 'text-amber-600 dark:text-amber-400', 
                progressBg: 'bg-amber-200 dark:bg-amber-800/50', 
                progressFill: 'bg-gradient-to-r from-amber-500 to-orange-500',
                border: 'border-l-amber-500',
                badge: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
              },
              { 
                bg: 'bg-gradient-to-br from-rose-500 to-pink-500', 
                light: 'bg-rose-100 dark:bg-rose-900/30', 
                accent: 'text-rose-600 dark:text-rose-400', 
                progressBg: 'bg-rose-200 dark:bg-rose-800/50', 
                progressFill: 'bg-gradient-to-r from-rose-500 to-pink-500',
                border: 'border-l-rose-500',
                badge: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
              },
              { 
                bg: 'bg-gradient-to-br from-cyan-500 to-teal-500', 
                light: 'bg-cyan-100 dark:bg-cyan-900/30', 
                accent: 'text-cyan-600 dark:text-cyan-400', 
                progressBg: 'bg-cyan-200 dark:bg-cyan-800/50', 
                progressFill: 'bg-gradient-to-r from-cyan-500 to-teal-500',
                border: 'border-l-cyan-500',
                badge: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400'
              },
            ];
            const theme = colorThemes[index % colorThemes.length];
            
            return (
              <Card 
                key={course.id}
                className={`group overflow-hidden hover:shadow-xl cursor-pointer transition-all duration-300 border-l-4 ${theme.border}`}
                onClick={() => setLocation(`/courses/${course.id}`)}
                data-testid={`course-${course.id}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-5 p-5">
                  {/* Course Icon */}
                  <div className={`w-14 h-14 rounded-xl ${theme.bg} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform`}>
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-1 group-hover:text-[#1F3A5F] dark:group-hover:text-blue-400 transition-colors">{course.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant="outline" className="font-normal text-xs">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {course.subject}
                      </Badge>
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Grade {course.grade}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5" />
                        {course.teacherName}
                      </span>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="lg:w-52 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Progress
                      </span>
                      <span className={`font-bold ${theme.accent}`}>{progressPercent}%</span>
                    </div>
                    <div className={`h-2.5 ${theme.progressBg} rounded-full overflow-hidden`}>
                      <div 
                        className={`h-full ${theme.progressFill} transition-all duration-500 rounded-full`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {course.completedAssignments || 0} of {course.assignmentCount || 0} completed
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${theme.light}`}>
                        <Trophy className={`w-5 h-5 ${theme.accent}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Score</p>
                        <p className={`text-base font-bold ${theme.accent}`}>
                          {course.averageGrade ? `${course.averageGrade.toFixed(0)}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-xl p-2 -m-2 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation('/assignments');
                      }}
                      data-testid={`button-assignments-${course.id}`}
                    >
                      <div className={`p-2.5 rounded-xl ${theme.light}`}>
                        <ClipboardList className={`w-5 h-5 ${theme.accent}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tasks</p>
                        <p className="text-base font-bold">{course.assignmentCount || 0}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Available New Courses Section */}
      <div className="mt-12 pt-10 border-t-2 border-dashed">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2FBF71] to-[#25a060] flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Discover New Courses</h2>
              <p className="text-muted-foreground">
                Expand your knowledge with our available courses
              </p>
            </div>
          </div>
        </div>
        {user && (
          <CourseBrowser 
            currentUser={user}
            showEnrollButton={true}
          />
        )}
      </div>
    </div>
  );
}
