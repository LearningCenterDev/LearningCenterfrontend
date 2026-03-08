import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock as ClockComponent } from "./Clock";
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  AlertCircle, 
  Calendar, 
  User, 
  ArrowRight,
  Cake,
  PartyPopper, 
  MapPin, 
  CheckCircle, 
  FileText, 
  DollarSign, 
  Link as LinkIcon, 
  X, 
  UserRoundCog,
  GraduationCap,
  Target,
  Sparkles,
  Bell,
  Receipt,
  Video,
  ClipboardList,
  TrendingUp,
  FolderOpen,
  ExternalLink
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { format, formatDistanceToNow, parseISO, isBefore, endOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType, Course, Assignment, Enrollment, Grade, Submission, Schedule, Announcement, Notification, CourseResource } from "@shared/schema";
import { useEffect, useState, useMemo } from "react";

interface StudentDashboardProps {
  studentId: string;
  studentName: string;
}

export function StudentDashboard({ studentId, studentName }: StudentDashboardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [seenAnnouncementIds, setSeenAnnouncementIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const seen = localStorage.getItem(`seen-announcements-${studentId}`);
    return new Set(seen ? JSON.parse(seen) : []);
  });
  const [hiddenAnnouncementIds, setHiddenAnnouncementIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const hidden = localStorage.getItem(`hidden-announcements-${studentId}`);
    return new Set(hidden ? JSON.parse(hidden) : []);
  });
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments/user", studentId],
  });

  const { data: enrolledCourses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/students", studentId, "courses"],
    enabled: enrollments.length > 0,
  });

  const { data: studentAssignments = [], isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/students", studentId, "assignments"],
    enabled: enrollments.length > 0,
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/submissions/student", studentId],
  });

  const { data: grades = [], isLoading: gradesLoading } = useQuery<Grade[]>({
    queryKey: ["/api/grades/student", studentId],
  });

  const { data: teachers = [], isLoading: teachersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/students", studentId, "teachers"],
    enabled: enrolledCourses.length > 0,
  });

  const { data: teacherAssignments = [] } = useQuery({
    queryKey: ["/api/student-teacher-assignments/student", studentId],
    queryFn: async () => {
      const response = await fetch(`/api/student-teacher-assignments/student/${studentId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: enrolledCourses.length > 0,
  });

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/students", studentId, "schedules"],
    refetchInterval: 30000, // Refresh every 30 seconds for dynamic updates
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  // Get current student's data for birthday check
  const currentStudent = useMemo(() => {
    return users.find(u => u.id === studentId);
  }, [users, studentId]);

  // Check if today is the student's birthday
  const isBirthdayToday = useMemo(() => {
    if (!currentStudent?.dateOfBirth) return false;
    const today = new Date();
    const birthDate = new Date(currentStudent.dateOfBirth);
    return today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate();
  }, [currentStudent?.dateOfBirth]);

  // State to manage birthday banner visibility
  const [showBirthdayBanner, setShowBirthdayBanner] = useState(true);
  const [birthdayBannerDismissed, setBirthdayBannerDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const dismissed = localStorage.getItem(`birthday-dismissed-${studentId}-${new Date().toDateString()}`);
    return dismissed === 'true';
  });

  const handleDismissBirthday = () => {
    setShowBirthdayBanner(false);
    localStorage.setItem(`birthday-dismissed-${studentId}-${new Date().toDateString()}`, 'true');
    setBirthdayBannerDismissed(true);
  };

  const { data: invoices = [] as any[], isLoading: invoicesLoading } = useQuery<any[]>({
    queryKey: ["/api/student/invoices"],
  });

  const { data: announcements = [], isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/students", studentId, "announcements"],
  });

  const { data: courseResources = [] } = useQuery<(CourseResource & { courseName: string })[]>({
    queryKey: ["/api/students", studentId, "resources"],
    enabled: enrollments.length > 0,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", studentId],
  });

  const visibleAnnouncements = announcements.filter(a => {
    if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
    if (hiddenAnnouncementIds.has(a.id)) return false;
    return true;
  });

  const recentAnnouncements = visibleAnnouncements.slice(0, 3);

  useEffect(() => {
    const announcementNotifications = notifications.filter(n => n.type === 'announcement');
    const newAnnouncements = announcementNotifications.filter(n => !seenAnnouncementIds.has(n.relatedId || ''));
    
    if (newAnnouncements.length > 0) {
      newAnnouncements.forEach(notification => {
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000,
        });
        const newSeen = new Set(seenAnnouncementIds);
        newSeen.add(notification.relatedId || '');
        setSeenAnnouncementIds(newSeen);
        localStorage.setItem(`seen-announcements-${studentId}`, JSON.stringify(Array.from(newSeen)));
        
        const newHidden = new Set(hiddenAnnouncementIds);
        if (newHidden.has(notification.relatedId || '')) {
          newHidden.delete(notification.relatedId || '');
          setHiddenAnnouncementIds(newHidden);
          localStorage.setItem(`hidden-announcements-${studentId}`, JSON.stringify(Array.from(newHidden)));
        }
      });
    }
  }, [notifications.length, seenAnnouncementIds, hiddenAnnouncementIds, toast, studentId]);

  // Listen for new resource updates via WebSocket
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'new_resource') {
          // Refetch resources and notifications when a new resource is added
          queryClient.invalidateQueries({ queryKey: ["/api/students", studentId, "resources"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications", studentId] });
        }
      } catch (error) {
        // Silently ignore parsing errors
      }
    };

    const ws = (window as any).__ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, [studentId]);

  const handleHideAnnouncement = (announcementId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newHidden = new Set(hiddenAnnouncementIds);
    newHidden.add(announcementId);
    setHiddenAnnouncementIds(newHidden);
    localStorage.setItem(`hidden-announcements-${studentId}`, JSON.stringify(Array.from(newHidden)));
  };

  const getTeacherName = (teacherId: string): string => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return "Unknown Teacher";
    return teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || "Unknown Teacher";
  };

  const getAssignedTeacherForCourse = (courseId: string): string => {
    const assignment = teacherAssignments.find((a: any) => a.courseId === courseId);
    if (assignment?.teacherId) {
      return getTeacherName(assignment.teacherId);
    }
    return "Teacher Not Assigned";
  };

  const submittedAssignmentIds = submissions.map(s => s.assignmentId);
  const pendingAssignments = studentAssignments.filter(a => {
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return dueDate > now && dueDate <= threeDaysFromNow && !submittedAssignmentIds.includes(a.id);
  });
  
  const overdueAssignments = studentAssignments.filter(a => {
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    const now = new Date();
    return dueDate < now && !submittedAssignmentIds.includes(a.id);
  });

  const averageGrade = grades.length > 0 
    ? grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length
    : 0;

  const upcomingSchedules = schedules
    .filter(s => new Date(s.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3);

  const getTeacherNameFromUsers = (teacherId: string): string => {
    const teacher = users.find(u => u.id === teacherId);
    if (!teacher) return "Unknown Teacher";
    return teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || "Unknown Teacher";
  };

  const isLoading = enrollmentsLoading || coursesLoading || assignmentsLoading || submissionsLoading || gradesLoading || teachersLoading;

  const handleViewCourse = (courseId?: string) => navigate(courseId ? `/courses/${courseId}` : '/courses');
  const handleViewAllCourses = () => navigate('/courses');
  const handleViewAllAssignments = () => navigate('/assignments');
  const handleViewSchedule = () => navigate('/schedule');

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

  return (
    <div className="p-3 md:p-4 space-y-4 max-w-7xl mx-auto" data-testid="student-dashboard">
      {/* Birthday Flash Message */}
      {isBirthdayToday && showBirthdayBanner && !birthdayBannerDismissed && (
        <div 
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-4 shadow-lg animate-in slide-in-from-top-4 duration-500"
          data-testid="birthday-banner"
        >
          {/* Animated confetti background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '1.5s' }} />
            <div className="absolute top-2 left-1/2 w-3 h-3 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '1.8s' }} />
            <div className="absolute top-1 left-3/4 w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '1.6s' }} />
            <div className="absolute top-3 left-1/6 w-2 h-2 bg-green-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '1.7s' }} />
            <div className="absolute top-0 right-1/4 w-3 h-3 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '1.4s' }} />
          </div>
          
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                  <Cake className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:flex w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm items-center justify-center animate-bounce" style={{ animationDelay: '0.3s' }}>
                  <PartyPopper className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-white">
                <h3 className="text-lg sm:text-xl font-bold tracking-wide">
                  Happy Birthday, {studentName.split(' ')[0]}!
                </h3>
                <p className="text-white/90 text-sm">
                  Wishing you a fantastic day filled with joy and learning!
                </p>
              </div>
            </div>
            <button 
              onClick={handleDismissBirthday}
              className="shrink-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="Dismiss birthday message"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Grid and Clock Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="p-3">
                <Skeleton className="h-3 w-12 mb-2" />
                <Skeleton className="h-6 w-10" />
              </Card>
            ))
          ) : (
            <>
              <Card 
                className="p-2.5 hover:shadow-lg cursor-pointer transition-all border-[#1F3A5F]/10 hover:border-[#1F3A5F]/30 group" 
                onClick={handleViewAllCourses} 
                data-testid="stat-enrolled-courses"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-[#1F3A5F]/10 flex items-center justify-center group-hover:bg-[#1F3A5F]/20 transition-colors">
                    <GraduationCap className="w-3 h-3 text-[#1F3A5F]" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Courses</span>
                </div>
                <div className="text-xl font-bold text-[#1F3A5F]">{enrolledCourses.length}</div>
              </Card>
              
              <Card className="p-2.5 border-[#2FBF71]/10" data-testid="stat-average-grade">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-[#2FBF71]/10 flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-[#2FBF71]" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Avg Grade</span>
                </div>
                <div className="text-xl font-bold text-[#2FBF71]">
                  {averageGrade > 0 ? `${averageGrade.toFixed(0)}%` : "N/A"}
                </div>
              </Card>
              
              <Card 
                className={`p-2.5 hover:shadow-lg cursor-pointer transition-all group ${pendingAssignments.length > 0 ? 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20' : ''}`} 
                onClick={handleViewAllAssignments} 
                data-testid="stat-pending-tasks"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${pendingAssignments.length > 0 ? 'bg-amber-500/20' : 'bg-muted'}`}>
                    <Target className={`w-3 h-3 ${pendingAssignments.length > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Pending</span>
                </div>
                <div className={`text-xl font-bold ${pendingAssignments.length > 0 ? 'text-amber-600' : 'text-foreground'}`}>
                  {pendingAssignments.length}
                </div>
              </Card>
              
              <Card 
                className={`p-2.5 hover:shadow-lg cursor-pointer transition-all group ${overdueAssignments.length > 0 ? 'border-red-500/30 bg-red-50/50 dark:bg-red-950/20' : ''}`} 
                onClick={handleViewAllAssignments} 
                data-testid="stat-overdue-items"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${overdueAssignments.length > 0 ? 'bg-red-500/20' : 'bg-muted'}`}>
                    <AlertCircle className={`w-3 h-3 ${overdueAssignments.length > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Overdue</span>
                </div>
                <div className={`text-xl font-bold ${overdueAssignments.length > 0 ? 'text-red-600' : 'text-foreground'}`}>
                  {overdueAssignments.length}
                </div>
              </Card>
            </>
          )}
        </div>
        <div className="md:col-span-1">
          <ClockComponent />
        </div>
      </div>

      {/* Hero Section - Upcoming Schedule */}
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
                s.status === 'completed' || isBefore(parseISO(s.endTime as unknown as string), today)
              );

              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">{format(date, 'EEE')}</span>
                  <div className={`w-full aspect-square max-w-[34px] rounded-lg flex items-center justify-center text-[13px] font-bold transition-all ${
                    isToday ? 'bg-[#2FBF71] text-white shadow-lg scale-105' : 
                    allCompleted ? 'bg-slate-200 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' :
                    hasClasses ? 'bg-[#2FBF71]/20 text-white border border-[#2FBF71]/30' : 
                    'bg-white/5 text-white/40 border border-white/5'
                  }`}>
                    {format(date, 'd')}
                  </div>
                  {hasClasses && (
                    <div className="flex gap-0.5">
                      {daySchedules.map((_, idx) => (
                        <div key={idx} className={`w-1 h-1 rounded-full ${allCompleted ? 'bg-slate-400 dark:bg-slate-600' : 'bg-[#2FBF71]'}`} />
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
                const course = enrolledCourses.find(c => c.id === schedule.courseId);
                const startTime = new Date(schedule.startTime);
                const endTime = new Date(schedule.endTime);
                
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
                        {schedule.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {schedule.location}
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
                            <Video className="w-3 h-3" />
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

      {/* Announcements Section */}
      {recentAnnouncements.length > 0 && (
        <Card className="border-[#2FBF71]/20 shadow-md overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-[#2FBF71]/5 to-transparent">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-9 h-9 rounded-lg bg-[#2FBF71]/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#2FBF71]" />
                </div>
                Announcements
              </CardTitle>
              <Badge className="bg-[#2FBF71]/10 text-[#2FBF71] border-[#2FBF71]/20">
                {recentAnnouncements.length} New
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcementsLoading ? (
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="p-4 bg-muted/30 rounded-xl">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : (
              recentAnnouncements.map((announcement) => (
                <div 
                  key={announcement.id}
                  className="p-4 bg-gradient-to-r from-[#2FBF71]/5 to-transparent rounded-xl border border-[#2FBF71]/10 flex items-start justify-between gap-3"
                  data-testid={`announcement-${announcement.id}`}
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1.5">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{announcement.content}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {getTeacherNameFromUsers(announcement.authorId)}
                      </span>
                      <span>{format(parseISO(announcement.createdAt as any), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleHideAnnouncement(announcement.id, e)}
                    className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
                    data-testid={`button-hide-announcement-${announcement.id}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}


      {/* Course & Assignment Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-9 h-9 rounded-lg bg-[#1F3A5F]/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                My Courses
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleViewAllCourses}
                className="text-[#1F3A5F]"
                data-testid="button-all-courses"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 bg-muted/30 rounded-xl">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : enrolledCourses.length > 0 ? (
              enrolledCourses.slice(0, 4).map((course) => {
                const courseAssignments = studentAssignments.filter(a => a.courseId === course.id);
                const completedAssignments = courseAssignments.filter(a => 
                  submittedAssignmentIds.includes(a.id)
                ).length;
                const progress = courseAssignments.length > 0 
                  ? (completedAssignments / courseAssignments.length) * 100 
                  : 0;
                  
                const recentResources = courseResources.filter(r => r.courseId === course.id).slice(0, 2);
                
                return (
                  <div 
                    key={course.id} 
                    className="p-4 bg-gradient-to-r from-[#1F3A5F]/5 to-transparent rounded-xl border border-[#1F3A5F]/10 hover:border-[#1F3A5F]/30 hover:shadow-md cursor-pointer transition-all"
                    onClick={() => handleViewCourse(course.id)}
                    data-testid={`course-card-${course.id}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h4 className="font-semibold text-sm flex-1">{course.title}</h4>
                      <Badge className="bg-[#2FBF71]/10 text-[#2FBF71] border-[#2FBF71]/20 text-xs">
                        {Math.round(progress)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">{getAssignedTeacherForCourse(course.id)}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
                      <div 
                        className="h-full bg-gradient-to-r from-[#2FBF71] to-[#25a060] transition-all rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {recentResources.length > 0 && (
                      <div className="space-y-2">
                        {recentResources.map((resource) => (
                          <div 
                            key={resource.id}
                            className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(resource.resourceUrl, '_blank');
                            }}
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            <span className="text-xs font-medium text-amber-700 dark:text-amber-300 truncate flex-1">
                              {resource.title}
                            </span>
                            <ExternalLink className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#1F3A5F]/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-[#1F3A5F]/40" />
                </div>
                <p className="text-muted-foreground mb-3">No courses yet</p>
                <Button 
                  onClick={handleViewAllCourses} 
                  size="sm"
                  className="bg-[#1F3A5F] hover:bg-[#2a4a75]"
                  data-testid="button-browse-courses-empty"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Browse Courses
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Assignments */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-9 h-9 rounded-lg bg-[#2FBF71]/10 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-[#2FBF71]" />
                </div>
                Recent Assignments
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleViewAllAssignments}
                className="text-[#2FBF71]"
                data-testid="button-all-assignments"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 bg-muted/30 rounded-xl">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : studentAssignments.length > 0 ? (
              studentAssignments
                .filter(assignment => {
                  if (!assignment.title || assignment.title.trim() === '') return false;
                  const hasSubmission = submissions.some(s => s.assignmentId === assignment.id);
                  return !hasSubmission;
                })
                .sort((a, b) => {
                  if (!a.dueDate && !b.dueDate) return 0;
                  if (!a.dueDate) return 1;
                  if (!b.dueDate) return -1;
                  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                })
                .slice(0, 4)
                .map((assignment) => {
                  const course = enrolledCourses.find(c => c.id === assignment.courseId);
                  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
                  const now = new Date();
                  const isOverdue = dueDate && dueDate < now;
                  
                  return (
                    <div 
                      key={assignment.id}
                      className={`p-4 rounded-xl border hover:shadow-md cursor-pointer transition-all ${
                        isOverdue 
                          ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                          : 'bg-gradient-to-r from-[#2FBF71]/5 to-transparent border-[#2FBF71]/10 hover:border-[#2FBF71]/30'
                      }`}
                      onClick={handleViewAllAssignments}
                      data-testid={`assignment-card-${assignment.id}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{assignment.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{course?.title || 'Unknown'}</p>
                        </div>
                        {isOverdue ? (
                          <Badge variant="destructive" className="text-xs flex-shrink-0">Overdue</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-xs flex-shrink-0">
                            Pending
                          </Badge>
                        )}
                      </div>
                      {dueDate && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                            Due {isOverdue ? `${formatDistanceToNow(dueDate)} ago` : formatDistanceToNow(dueDate, { addSuffix: true })}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#2FBF71]/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[#2FBF71]/40" />
                </div>
                <p className="text-muted-foreground">No pending assignments</p>
                <p className="text-sm text-muted-foreground mt-1">Great job staying on top of your work!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices Section */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-lg bg-[#1F3A5F]/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[#1F3A5F]" />
            </div>
            Recent Invoices
          </CardTitle>
          <Badge variant="outline" className="text-xs">{invoices?.length || 0} Total</Badge>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : invoices && (invoices as any).length > 0 ? (
            <div className="space-y-3">
              {(invoices as any).slice(0, 3).map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-xl border hover:shadow-md transition-all"
                  data-testid={`student-invoice-${invoice.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      invoice.status === 'paid' 
                        ? 'bg-[#2FBF71]/10' 
                        : invoice.status === 'overdue' 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        invoice.status === 'paid' 
                          ? 'text-[#2FBF71]' 
                          : invoice.status === 'overdue' 
                          ? 'text-red-600' 
                          : 'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Invoice #{invoice.invoiceNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        Due: {format(parseISO(invoice.dueDate), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {parseFloat(invoice.total).toFixed(2)}
                    </div>
                    <Badge
                      className={`text-xs mt-1 ${
                        invoice.status === 'paid'
                          ? 'bg-[#2FBF71]/10 text-[#2FBF71] border-[#2FBF71]/20'
                          : invoice.status === 'overdue'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200'
                      }`}
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {(invoices as any).length > 3 && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/parent')}>
                  View All Invoices
                </Button>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground">No invoices yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          {selectedSchedule && (() => {
            const course = enrolledCourses.find(c => c.id === selectedSchedule.courseId);
            const startTime = parseISO(selectedSchedule.startTime as unknown as string);
            const endTime = parseISO(selectedSchedule.endTime as unknown as string);
            const substitution = (selectedSchedule as any).substitution;
            
            const getSubstituteTeacherName = (teacherId: string): string => {
              const teacher = users.find(u => u.id === teacherId);
              if (!teacher) return "Unknown Teacher";
              return teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || "Unknown Teacher";
            };

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-[#1F3A5F]">{course?.title || 'Schedule Details'}</DialogTitle>
                  <DialogDescription>{selectedSchedule.title}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#1F3A5F]/10">
                        <Calendar className="w-5 h-5 text-[#1F3A5F]" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="font-semibold text-sm">
                          {format(startTime, 'EEEE, MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#2FBF71]/10">
                        <Clock className="w-5 h-5 text-[#2FBF71]" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Time</p>
                        <p className="font-semibold text-sm">
                          {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedSchedule.teacherId && (
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#1F3A5F]/10">
                        <User className="w-5 h-5 text-[#1F3A5F]" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Teacher</p>
                        <p className="font-semibold text-sm">{getTeacherNameFromUsers(selectedSchedule.teacherId)}</p>
                      </div>
                    </div>
                  )}

                  {substitution && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50">
                        <UserRoundCog className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Substitute Teacher</p>
                        <p className="font-semibold text-sm">
                          {getSubstituteTeacherName(substitution.substituteTeacherId)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Reason: {substitution.reason}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedSchedule.location && (
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#2FBF71]/10">
                        <MapPin className="w-5 h-5 text-[#2FBF71]" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-semibold text-sm">{selectedSchedule.location}</p>
                      </div>
                    </div>
                  )}

                  {selectedSchedule.externalLink && (
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${new Date(selectedSchedule.endTime) <= new Date() || selectedSchedule.status === 'completed' || selectedSchedule.status === 'cancelled' ? 'bg-muted' : 'bg-[#2FBF71]/10'}`}>
                        <LinkIcon className={`w-5 h-5 ${new Date(selectedSchedule.endTime) <= new Date() || selectedSchedule.status === 'completed' || selectedSchedule.status === 'cancelled' ? 'text-muted-foreground' : 'text-[#2FBF71]'}`} />
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
                            className="font-semibold text-sm text-[#2FBF71] hover:underline"
                          >
                            Click here to join
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedSchedule.notes && (
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-[#1F3A5F]/10">
                        <FileText className="w-5 h-5 text-[#1F3A5F]" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Notes</p>
                        <p className="text-sm">{selectedSchedule.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => setIsDetailsDialogOpen(false)}
                    className="bg-[#1F3A5F] hover:bg-[#2a4a75]"
                    data-testid="button-close-schedule-dialog"
                  >
                    Close
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default StudentDashboard;
