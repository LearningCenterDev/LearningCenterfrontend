import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Clock as ClockComponent } from "./Clock";
import { 
  BookOpen, 
  Users, 
  MessageCircle, 
  Calendar, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  User as UserIcon,
  MapPin,
  UserPlus,
  Link as LinkIcon,
  UserRoundCog
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, parseISO, formatDistanceToNow, isBefore } from "date-fns";
import type { User, Course, Submission, Message, Grade, Schedule } from "@shared/schema";

import { RescheduleProposalModal, PendingProposals } from "./RescheduleProposalModal";
import { queryClient } from "@/lib/queryClient";

interface RecentEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string | null;
  approvalStatus: string;
  student: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  course: {
    id: string;
    title: string;
    subject: string | null;
  };
}

interface RescheduleProposalWithRelations {
  id: string;
  scheduleId: string;
  proposerId: string;
  proposedStartTime: string;
  proposedEndTime: string;
  message: string | null;
  status: any;
  createdAt: any;
  updatedAt: any;
  proposedBy: string;
  proposedTo: string;
  counterProposalId: string | null;
  respondedAt: any;
  schedule: Schedule;
  proposer: any;
}

interface TeacherDashboardProps {
  teacherId: string;
  teacherName: string;
}

export function TeacherDashboard({ teacherId, teacherName }: TeacherDashboardProps) {
  const [, navigate] = useLocation();
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/teachers", teacherId, "courses"],
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<User[]>({
    queryKey: ["/api/teachers", teacherId, "students"],
    enabled: courses.length > 0,
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/teachers", teacherId, "submissions"],
    enabled: courses.length > 0,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/teachers", teacherId, "messages"],
  });

  const { data: recentEnrollments = [], isLoading: enrollmentsLoading } = useQuery<RecentEnrollment[]>({
    queryKey: ["/api/teachers", teacherId, "recent-enrollments"],
  });

  const { data: grades = [], isLoading: gradesLoading } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
    enabled: submissions.length > 0,
  });

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/teachers", teacherId, "schedules"],
    refetchInterval: 30000, // Refresh every 30 seconds for dynamic updates
  });

  // Fetch all users for proper name lookups
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch all enrollments for showing enrolled students in schedules
  const { data: allEnrollments = [] } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });

  const activeCourses = courses.filter(course => course.isActive).length;
  const totalStudents = students.length;
  const unreadMessages = messages.filter(message => !message.isRead).length;
  
  const gradedSubmissionIds = grades.map(grade => grade.submissionId);
  const pendingReviews = submissions.filter(submission => 
    !gradedSubmissionIds.includes(submission.id)
  ).length;

  // Get upcoming schedules (next 3)
  const upcomingSchedules = schedules
    .filter(s => new Date(s.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3);

  const getCourseById = (courseId: string) => {
    return courses.find(c => c.id === courseId);
  };

  const getStudentById = (studentId: string) => {
    return students.find(s => s.id === studentId) || allUsers.find(u => u.id === studentId);
  };

  const getStudentName = (studentId: string) => {
    const student = getStudentById(studentId);
    if (!student) return "Unknown Student";
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.name || student.email || "Unknown Student";
  };

  const getEnrolledStudentsForCourse = (courseId: string) => {
    const courseEnrollments = allEnrollments.filter(
      (e: any) => e.courseId === courseId && e.approvalStatus === 'approved'
    );
    return courseEnrollments.map((e: any) => {
      const student = allUsers.find((u: any) => u.id === e.studentId);
      if (student) {
        return `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || 'Unknown';
      }
      return null;
    }).filter(Boolean);
  };

  const getSubstituteTeacherName = (substituteTeacherId: string) => {
    const teacher = allUsers.find(u => u.id === substituteTeacherId);
    if (!teacher) return "Substitute";
    if (teacher.firstName && teacher.lastName) {
      return `${teacher.firstName} ${teacher.lastName}`;
    }
    return teacher.name || "Substitute";
  };

  const { data: pendingProposals = [] } = useQuery<RescheduleProposalWithRelations[]>({
    queryKey: ["/api/reschedule-proposals/pending"],
  });

  const invalidateScheduleQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/teachers", teacherId, "schedules"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reschedule-proposals/pending"] });
  };

  const today = new Date();
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    const diff = today.getDay() - 1; // start from Monday
    d.setDate(today.getDate() - diff + i);
    return d;
  });

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(s => {
      const sDate = new Date(s.startTime);
      return sDate.getFullYear() === date.getFullYear() &&
             sDate.getMonth() === date.getMonth() &&
             sDate.getDate() === date.getDate();
    });
  };

  const isLoading = coursesLoading || studentsLoading || submissionsLoading || messagesLoading || gradesLoading || schedulesLoading || enrollmentsLoading;

  const handleManageCourse = (courseId?: string) => navigate(courseId ? `/courses/${courseId}` : '/courses');
  const handleViewSchedule = () => navigate('/schedule');
  const handleViewAllStudents = () => navigate('/students');
  const handleViewAllMessages = () => navigate('/messages');

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto" data-testid="teacher-dashboard">
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="flex-1 w-full space-y-4">
          {pendingProposals.length > 0 && (
            <PendingProposals 
              userId={teacherId} 
              invalidateQueries={invalidateScheduleQueries} 
              proposals={pendingProposals as any} 
            />
          )}

          {/* KPI Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <Card key={i} className="p-3">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-7 w-12" />
                </Card>
              ))
            ) : (
              <>
                <Card className="p-3 hover-elevate cursor-pointer" onClick={() => navigate('/courses')} data-testid="stat-active-courses">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>Courses</span>
                  </div>
                  <div className="text-2xl font-bold">{activeCourses}</div>
                </Card>
                <Card className="p-3" data-testid="stat-total-students">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span>Students</span>
                  </div>
                  <div className="text-2xl font-bold">{totalStudents}</div>
                </Card>
                <Card className={`p-3 hover-elevate cursor-pointer ${pendingReviews > 0 ? 'border-yellow-500/50' : ''}`} onClick={() => navigate('/assignments')} data-testid="stat-pending-reviews">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Pending</span>
                  </div>
                  <div className={`text-2xl font-bold ${pendingReviews > 0 ? 'text-yellow-600 dark:text-yellow-500' : ''}`}>
                    {pendingReviews}
                  </div>
                </Card>
                <Card className={`p-3 hover-elevate cursor-pointer ${unreadMessages > 0 ? 'border-destructive/50' : ''}`} onClick={handleViewAllMessages} data-testid="stat-unread-messages">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>Messages</span>
                  </div>
                  <div className={`text-2xl font-bold ${unreadMessages > 0 ? 'text-destructive' : ''}`}>
                    {unreadMessages}
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
        <div className="w-full md:w-auto md:min-w-[200px] flex-shrink-0">
          <ClockComponent />
        </div>
      </div>

      {/* Tier 1: Upcoming Schedule - Hero Section */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-[#1F3A5F] via-[#2a4a75] to-[#1F3A5F] text-white relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2FBF71]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#2FBF71]/10 rounded-full blur-2xl"></div>
        
        <CardHeader className="py-2.5 px-4 relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#2FBF71]" />
              </div>
              Schedule
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleViewSchedule}
              className="h-7 text-[11px] text-white/80 hover:text-white hover:bg-white/10 px-2"
              data-testid="button-view-schedule"
            >
              Full Calendar <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 pb-4 px-4">
          {/* Week Overview */}
          <div className="grid grid-cols-7 gap-1.5 mb-4">
            {weekDates.map((date, i) => {
              const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
              const daySchedules = getSchedulesForDate(date);
              const hasClasses = daySchedules.length > 0;
              
              // Check if all classes on this date are completed
              const allCompleted = hasClasses && daySchedules.every(s => 
                s.status === 'completed' || isBefore(new Date(s.endTime), today)
              );

              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">{format(date, 'EEE')}</span>
                  <div className={`w-full aspect-square max-w-[34px] rounded-lg flex items-center justify-center text-[13px] font-bold transition-all ${
                    isToday ? 'bg-[#2FBF71] text-white shadow-lg scale-105' : 
                    allCompleted ? 'bg-slate-200/20 text-slate-400 border-slate-300/10' :
                    hasClasses ? 'bg-[#2FBF71]/20 text-white border border-[#2FBF71]/30' : 
                    'bg-white/5 text-white/40 border border-white/5'
                  }`}>
                    {format(date, 'd')}
                  </div>
                  {hasClasses && (
                    <div className="flex gap-0.5">
                      {daySchedules.map((_, idx) => (
                        <div key={idx} className={`w-1 h-1 rounded-full ${allCompleted ? 'bg-slate-400' : 'bg-[#2FBF71]'}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2">Today's Classes</h5>
            {schedulesLoading ? (
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                  <Skeleton className="h-3 w-3/4 mb-1.5 bg-white/20" />
                  <Skeleton className="h-2.5 w-1/2 bg-white/20" />
                </div>
              ))
            ) : upcomingSchedules.length > 0 ? (
              upcomingSchedules.map((schedule) => {
                const course = getCourseById(schedule.courseId);
                const startTime = new Date(schedule.startTime);
                
                return (
                  <div 
                    key={schedule.id}
                    className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/15 cursor-pointer transition-all flex items-start gap-3"
                    onClick={() => {
                      setSelectedSchedule(schedule);
                      setIsDetailsDialogOpen(true);
                    }}
                    data-testid={`schedule-item-${schedule.id}`}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-[#2FBF71] flex flex-col items-center justify-center shadow-lg">
                        <div className="text-[9px] font-medium text-white/80">{format(startTime, 'MMM')}</div>
                        <div className="text-sm font-bold text-white">{format(startTime, 'd')}</div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate text-white">{course?.title || 'Unknown Course'}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-white/70">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(startTime, 'h:mm a')}
                        </span>
                        {schedule.studentId ? (
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5" />
                            {getStudentName(schedule.studentId)}
                          </span>
                        ) : (
                          (() => {
                            const enrolledStudents = getEnrolledStudentsForCourse(schedule.courseId);
                            if (enrolledStudents.length > 0) {
                              return (
                                <span className="flex items-center gap-1">
                                  <UserIcon className="w-3.5 h-3.5" />
                                  {enrolledStudents.length === 1 
                                    ? enrolledStudents[0] 
                                    : `${enrolledStudents.length} students`}
                                </span>
                              );
                            }
                            return null;
                          })()
                        )}
                        {(schedule as any).substitution && (
                          <span className="flex items-center gap-1 text-amber-300">
                            <UserRoundCog className="w-3.5 h-3.5" />
                            Sub
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge className="bg-white/20 text-white border-0 text-[10px] h-5 px-1.5">
                        {formatDistanceToNow(startTime, { addSuffix: true })}
                      </Badge>
                      {schedule.externalLink && new Date(schedule.endTime) > new Date() && schedule.status !== 'completed' && schedule.status !== 'cancelled' && (
                        <Button
                          variant="default"
                          size="sm"
                          asChild
                          className="h-6 px-2 text-[10px] font-semibold bg-[#2FBF71] hover:bg-[#25a060] text-white shadow-md"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`schedule-external-link-${schedule.id}`}
                        >
                          <a 
                            href={schedule.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <LinkIcon className="w-3 h-3" />
                            Join
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center bg-white/10 backdrop-blur-sm rounded-xl">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-white/40" />
                <p className="text-xs text-white/60">No classes scheduled</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tier 3: Course & Message Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Courses - Compact Card Tiles */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">My Courses</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/courses')}
                data-testid="button-all-courses"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-3 bg-muted/20 rounded-md">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : courses.length > 0 ? (
              courses.filter(course => course.isActive).slice(0, 4).map((course) => {
                return (
                  <div 
                    key={course.id} 
                    className="p-3 bg-muted/20 rounded-md hover-elevate cursor-pointer"
                    onClick={() => handleManageCourse(course.id)}
                    data-testid={`course-card-${course.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm flex-1">{course.title}</h4>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <GraduationCap className="w-3 h-3" />
                      <span className="truncate">{course.subject} • Grade {course.grade}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No courses assigned</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Enrolled Students - Compact Card Tiles */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Enrolled Students</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleViewAllStudents}
                data-testid="button-all-students"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {enrollmentsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-3 bg-muted/20 rounded-md flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : recentEnrollments.length > 0 ? (
              recentEnrollments.slice(0, 4).map((enrollment) => (
                <div 
                  key={enrollment.id} 
                  className="p-3 rounded-md hover-elevate cursor-pointer bg-muted/20"
                  onClick={() => navigate(`/courses/${enrollment.courseId}`)}
                  data-testid={`enrollment-card-${enrollment.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={enrollment.student.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {enrollment.student.firstName?.[0]}{enrollment.student.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {enrollment.student.firstName && enrollment.student.lastName
                          ? `${enrollment.student.firstName} ${enrollment.student.lastName}`
                          : enrollment.student.email || 'Unknown Student'}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{enrollment.course.title}</span>
                        {enrollment.enrolledAt && (
                          <>
                            <span>•</span>
                            <span className="flex-shrink-0">{formatDistanceToNow(new Date(enrollment.enrolledAt), { addSuffix: true })}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No recent enrollments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          {selectedSchedule && (
            <>
              <DialogHeader>
                <DialogTitle>{getCourseById(selectedSchedule.courseId)?.title || 'Schedule Details'}</DialogTitle>
                <DialogDescription>{selectedSchedule.title}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-semibold text-sm">
                        {format(new Date(selectedSchedule.startTime), 'EEEE, MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="font-semibold text-sm">
                        {format(new Date(selectedSchedule.startTime), 'h:mm a')} - {format(new Date(selectedSchedule.endTime), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Student */}
                {selectedSchedule.studentId ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <UserIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Student</p>
                      <p className="font-semibold text-sm">{getStudentName(selectedSchedule.studentId)}</p>
                    </div>
                  </div>
                ) : (
                  (() => {
                    const enrolledStudents = getEnrolledStudentsForCourse(selectedSchedule.courseId);
                    if (enrolledStudents.length > 0) {
                      return (
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <UserIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {enrolledStudents.length === 1 ? 'Student' : 'Students'}
                            </p>
                            <p className="font-semibold text-sm">
                              {enrolledStudents.length === 1 
                                ? enrolledStudents[0] 
                                : enrolledStudents.join(', ')}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()
                )}

                {/* Substitute Teacher */}
                {(selectedSchedule as any).substitution && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                      <UserRoundCog className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Substitute Teacher</p>
                      <p className="font-semibold text-sm">
                        {getSubstituteTeacherName((selectedSchedule as any).substitution.substituteTeacherId)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Reason: {(selectedSchedule as any).substitution.reason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location */}
                {selectedSchedule.location && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-semibold text-sm">{selectedSchedule.location}</p>
                    </div>
                  </div>
                )}

                {/* External Link */}
                {selectedSchedule.externalLink && (
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${new Date(selectedSchedule.endTime) <= new Date() || selectedSchedule.status === 'completed' || selectedSchedule.status === 'cancelled' ? 'bg-muted' : 'bg-primary/10'}`}>
                      <LinkIcon className={`w-4 h-4 ${new Date(selectedSchedule.endTime) <= new Date() || selectedSchedule.status === 'completed' || selectedSchedule.status === 'cancelled' ? 'text-muted-foreground' : 'text-primary'}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Join Meeting</p>
                      {new Date(selectedSchedule.endTime) <= new Date() || selectedSchedule.status === 'completed' || selectedSchedule.status === 'cancelled' ? (
                        <span className="font-semibold text-sm text-muted-foreground">
                          Session ended
                        </span>
                      ) : (
                        <a 
                          href={selectedSchedule.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sm text-primary hover:underline"
                        >
                          Click here
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedSchedule.notes && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Notes</p>
                    <p className="text-sm">{selectedSchedule.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => setIsDetailsDialogOpen(false)}>
                    Close
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleViewSchedule}>
                    View All Schedules <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TeacherDashboard;
