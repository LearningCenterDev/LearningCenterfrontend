import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "./UserAvatar";
import { Clock as ClockComponent } from "./Clock";
import { 
  MessageCircle, 
  Calendar, 
  Users,
  GraduationCap,
  Award,
  CheckCircle,
  ArrowRight,
  User as UserIcon,
  Clock,
  UserCheck,
  MapPin,
  Bell,
  Link as LinkIcon
} from "lucide-react";
import { format, parseISO, addDays, startOfWeek, isBefore, formatDistanceToNow } from "date-fns";
import type { Schedule, Notification, ScheduleSubstitution } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ParentChild, Grade, Attendance, Message } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { RescheduleProposalModal, PendingProposals } from "./RescheduleProposalModal";

interface ScheduleWithSubstitution extends Schedule {
  substitution?: ScheduleSubstitution | null;
  studentName?: string | null;
}

interface RescheduleProposalWithRelations {
  id: string;
  scheduleId: string;
  proposerId: string;
  proposedStartTime: string;
  proposedEndTime: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  createdAt: string;
  schedule: Schedule;
  proposer: any;
}

interface ParentDashboardProps {
  parentId: string;
  parentName: string;
}

export function ParentDashboard({ parentId, parentName }: ParentDashboardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithSubstitution | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const { data: children = [], isLoading: childrenLoading } = useQuery<any[]>({
    queryKey: ["/api/parents", parentId, "children"],
  });

  const { data: grades = [], isLoading: gradesLoading } = useQuery<Grade[]>({
    queryKey: ["/api/parents", parentId, "grades"],
    enabled: children.length > 0,
  });

  const { data: attendance = [], isLoading: attendanceLoading } = useQuery<Attendance[]>({
    queryKey: ["/api/parents", parentId, "attendance"],
    enabled: children.length > 0,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/parents", parentId, "messages"],
  });

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<ScheduleWithSubstitution[]>({
    queryKey: ["/api/parents", parentId, "schedules"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const getCourseInfo = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course || { title: 'Unknown Course', description: '' };
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = users.find(u => u.id === teacherId);
    return teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.name || 'Unknown' : 'Unknown';
  };

  const getSubstituteTeacherName = (substituteTeacherId: string) => {
    const teacher = users.find((u: any) => u.id === substituteTeacherId);
    return teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.name || 'Unknown' : 'Unknown';
  };

  const handleViewDetails = (schedule: ScheduleWithSubstitution) => {
    setSelectedSchedule(schedule);
    setIsDetailsDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "scheduled": return "outline";
      case "completed": return "secondary";
      case "cancelled": return "destructive";
      case "rescheduled": return "default";
      default: return "outline";
    }
  };

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", parentId],
  });

  // Show announcement notifications as popups on first load
  useEffect(() => {
    const announcementNotifications = notifications.filter(n => n.type === 'announcement');
    if (announcementNotifications.length > 0) {
      announcementNotifications.forEach(notification => {
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000,
        });
      });
    }
  }, [notifications, toast]);

  const { data: pendingProposals = [] } = useQuery<RescheduleProposalWithRelations[]>({
    queryKey: ["/api/reschedule-proposals/pending"],
  });

  const invalidateScheduleQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/parents", parentId, "schedules"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reschedule-proposals/pending"] });
  };

  const isLoading = childrenLoading || gradesLoading || attendanceLoading || messagesLoading || schedulesLoading;

  // Get upcoming schedules (next 3)
  const upcomingSchedules = schedules
    .filter(s => new Date(s.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3);

  const childGradeAverages = children.map(child => {
    const childGrades = grades.filter((grade: any) => grade.studentId === child.id);
    if (childGrades.length === 0) return 0;
    const average = childGrades.reduce((acc, grade) => acc + grade.score, 0) / childGrades.length;
    return average;
  });

  const childAttendanceRates = children.map(child => {
    const childAttendance = attendance.filter(att => att.studentId === child.id);
    if (childAttendance.length === 0) return 100;
    const presentCount = childAttendance.filter(att => att.status === 'present').length;
    return (presentCount / childAttendance.length) * 100;
  });

  const overallAverage = childGradeAverages.length > 0 
    ? childGradeAverages.reduce((acc, avg) => acc + avg, 0) / childGradeAverages.length 
    : 0;
  
  const overallAttendance = childAttendanceRates.length > 0
    ? childAttendanceRates.reduce((acc, rate) => acc + rate, 0) / childAttendanceRates.length
    : 100;

  const unreadMessages = messages.filter(message => !message.isRead).length;

  const childrenWithDetails = children.map((child, index) => {
    const gradeAverage = childGradeAverages[index] || 0;
    const attendanceRate = childAttendanceRates[index] || 100;
    const childName = `${child.firstName || ''} ${child.lastName || ''}`.trim() || child.name || 'Unknown Student';
    
    return {
      id: child.id,
      name: childName,
      grade: `Student`,
      averageScore: gradeAverage,
      attendanceRate: attendanceRate,
    };
  });

  // Show first 3 children in hero section
  const featuredChildren = childrenWithDetails.slice(0, 3);

  // Week view calculations
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(s => {
      const scheduleDate = new Date(s.startTime);
      return format(scheduleDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  const handleViewSchedule = () => navigate('/schedule');

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto" data-testid="parent-dashboard">
      {/* Pending Reschedule Proposals */}
      {pendingProposals.length > 0 && (
        <PendingProposals 
          userId={parentId} 
          invalidateQueries={invalidateScheduleQueries} 
          proposals={pendingProposals} 
        />
      )}

      {/* KPI Stats Grid and Clock Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="p-2.5">
                <Skeleton className="h-3 w-12 mb-2" />
                <Skeleton className="h-6 w-10" />
              </Card>
            ))
          ) : (
            <>
              <Card className="p-2.5" data-testid="stat-children">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-[#1F3A5F]/10 flex items-center justify-center">
                    <Users className="w-3 h-3 text-[#1F3A5F]" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Children</span>
                </div>
                <div className="text-xl font-bold text-[#1F3A5F]">{children.length}</div>
              </Card>
              <Card className="p-2.5 border-[#2FBF71]/10" data-testid="stat-average">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-[#2FBF71]/10 flex items-center justify-center">
                    <Award className="w-3 h-3 text-[#2FBF71]" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Avg Grade</span>
                </div>
                <div className="text-xl font-bold text-[#2FBF71]">{overallAverage > 0 ? `${overallAverage.toFixed(0)}%` : "N/A"}</div>
              </Card>
              <Card className="p-2.5" data-testid="stat-attendance">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Attendance</span>
                </div>
                <div className="text-xl font-bold">{overallAttendance.toFixed(0)}%</div>
              </Card>
              <Card 
                className={`p-2.5 hover:shadow-lg cursor-pointer transition-all ${unreadMessages > 0 ? 'border-destructive/30 bg-red-50/50 dark:bg-red-950/20' : ''}`} 
                onClick={() => navigate('/messages')} 
                data-testid="stat-messages"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${unreadMessages > 0 ? 'bg-red-500/20' : 'bg-muted'}`}>
                    <MessageCircle className={`w-3 h-3 ${unreadMessages > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">Messages</span>
                </div>
                <div className={`text-xl font-bold ${unreadMessages > 0 ? 'text-red-600' : 'text-foreground'}`}>
                  {unreadMessages}
                </div>
              </Card>
            </>
          )}
        </div>
        <div className="md:col-span-1">
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
              data-testid="button-view-all-schedules"
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
                const course = getCourseInfo(schedule.courseId);
                const startTime = new Date(schedule.startTime);
                
                return (
                  <div 
                    key={schedule.id}
                    className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/15 cursor-pointer transition-all flex items-start gap-3"
                    onClick={() => handleViewDetails(schedule)}
                    data-testid={`schedule-item-${schedule.id}`}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-[#2FBF71] flex flex-col items-center justify-center shadow-lg">
                        <div className="text-[9px] font-medium text-white/80">{format(startTime, 'MMM')}</div>
                        <div className="text-sm font-bold text-white">{format(startTime, 'd')}</div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate text-white">{course?.title || schedule.title || 'Unknown Course'}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-white/70">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(startTime, 'h:mm a')}
                        </span>
                        {schedule.studentName && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5" />
                            {schedule.studentName}
                          </span>
                        )}
                        {schedule.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {schedule.location}
                          </span>
                        )}
                        {schedule.substitution?.substituteTeacherId && (
                          <span className="flex items-center gap-1 text-amber-300">
                            <UserCheck className="w-3.5 h-3.5" />
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
              <div className="p-6 text-center text-white/50 bg-white/5 rounded-xl">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No upcoming schedules</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedSchedule && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getStatusBadgeVariant(selectedSchedule.status)}>
                    {selectedSchedule.status}
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{selectedSchedule.title}</DialogTitle>
                <DialogDescription>
                  {getCourseInfo(selectedSchedule.courseId).title}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {selectedSchedule.externalLink && (
                  new Date(selectedSchedule.endTime) <= new Date() || selectedSchedule.status === 'completed' || selectedSchedule.status === 'cancelled' ? (
                    <Button variant="secondary" size="sm" disabled className="w-full">
                      <LinkIcon className="w-4 h-4 mr-2" /> Session ended
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" asChild className="w-full">
                      <a href={selectedSchedule.externalLink} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="w-4 h-4 mr-2" /> Join Class
                      </a>
                    </Button>
                  )
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date
                    </p>
                    <p className="text-sm font-medium">
                      {format(typeof selectedSchedule.startTime === 'string' ? parseISO(selectedSchedule.startTime) : selectedSchedule.startTime, 'EEEE, MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Time
                    </p>
                    <p className="text-sm font-medium">
                      {format(typeof selectedSchedule.startTime === 'string' ? parseISO(selectedSchedule.startTime) : selectedSchedule.startTime, 'h:mm a')} - {format(typeof selectedSchedule.endTime === 'string' ? parseISO(selectedSchedule.endTime) : selectedSchedule.endTime, 'h:mm a')}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Student</p>
                      <p className="text-sm font-semibold">{selectedSchedule.studentName || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Teacher</p>
                      <p className="text-sm font-semibold">
                        {selectedSchedule.substitution?.substituteTeacherId 
                          ? getSubstituteTeacherName(selectedSchedule.substitution.substituteTeacherId)
                          : getTeacherName(selectedSchedule.teacherId)}
                        {selectedSchedule.substitution?.substituteTeacherId && (
                          <span className="ml-2 text-[10px] text-amber-600 font-bold uppercase">(Substitute)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedSchedule.location && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Location</p>
                        <p className="text-sm font-semibold">{selectedSchedule.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedSchedule.description && (
                  <div className="pt-3 border-t">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedSchedule.description}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Tier 3: Children & Message Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Children's Progress - Compact Card Tiles */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Children's Progress</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/progress')}
                data-testid="button-all-children"
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
            ) : childrenWithDetails.length > 0 ? (
              childrenWithDetails.slice(0, 4).map((child) => (
                <div 
                  key={child.id} 
                  className="px-3 py-2 rounded-md hover-elevate cursor-pointer flex items-center justify-between gap-2 text-sm border border-border/40"
                  onClick={() => navigate('/progress')}
                  data-testid={`child-card-${child.id}`}
                >
                  <span className="font-medium truncate">{child.name}</span>
                  <Badge 
                    variant={child.averageScore >= 80 ? "default" : child.averageScore >= 60 ? "secondary" : "destructive"}
                    className="text-xs flex-shrink-0"
                  >
                    {child.averageScore.toFixed(0)}%
                  </Badge>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No children enrolled</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages - Compact Card Tiles */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Messages</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/messages')}
                data-testid="button-all-messages"
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
            ) : messages.length > 0 ? (
              messages.slice(0, 4).map((message) => (
                <div 
                  key={message.id} 
                  className={`p-3 rounded-md hover-elevate cursor-pointer ${!message.isRead ? 'bg-primary/10 border border-primary/20' : 'bg-muted/20'}`}
                  onClick={() => navigate('/messages')}
                  data-testid={`message-card-${message.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`font-semibold text-sm flex-1 truncate ${!message.isRead ? 'text-primary' : ''}`}>
                      {message.subject || 'No Subject'}
                    </h4>
                    {!message.isRead && (
                      <Badge variant="destructive" className="text-xs flex-shrink-0">New</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {message.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No recent messages</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ParentDashboard;
