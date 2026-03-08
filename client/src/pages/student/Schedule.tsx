import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, CalendarDays, BookOpen, FileText, Bell, Link as LinkIcon, UserCheck, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, endOfWeek, parseISO, subDays, startOfDay, getISOWeek } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { type Schedule, type ScheduleSubstitution } from "@shared/schema";
import { motion } from "framer-motion";

interface ScheduleWithSubstitution extends Schedule {
  substitution?: ScheduleSubstitution | null;
}

interface ScheduleProps {
  studentId: string;
}

export default function Schedule({ studentId }: ScheduleProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithSubstitution | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const { data: schedules = [], isLoading } = useQuery<ScheduleWithSubstitution[]>({
    queryKey: ["/api/students", studentId, "schedules"],
    refetchInterval: 30000,
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    refetchInterval: 60000,
  });

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    refetchInterval: 60000,
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthGridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const monthGridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const monthDays = eachDayOfInterval({ start: monthGridStart, end: monthGridEnd });

  const getActualStatus = (schedule: Schedule): string => {
    if (schedule.status === "cancelled") return "cancelled";
    
    // If it's explicitly set to rescheduled, respect that first if it's in the future
    const now = new Date();
    const startTime = new Date(schedule.startTime as unknown as string);
    const endTime = new Date(schedule.endTime as unknown as string);

    if (schedule.status === "rescheduled" && startTime > now) {
      return "rescheduled";
    }
    
    // If it's already past the end time, it's completed
    if (endTime < now) {
      return "completed";
    }
    
    return schedule.status;
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

  const getSchedulesForDay = (day: Date) => {
    return schedules.filter(schedule => 
      isSameDay(parseISO(schedule.startTime as unknown as string), day)
    );
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = users.find(u => u.id === teacherId);
    return teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.name || 'Unknown' : 'Unknown';
  };

  const getSubstituteTeacherName = (substituteTeacherId: string) => {
    const teacher = users.find(u => u.id === substituteTeacherId);
    return teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.name || 'Unknown' : 'Unknown';
  };

  const hasSubstitute = (schedule: ScheduleWithSubstitution) => {
    return schedule.substitution && schedule.substitution.substituteTeacherId;
  };

  const getCourseInfo = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course || { title: 'Unknown Course', description: '' };
  };

  const getDateLabel = () => {
    const today = startOfDay(new Date());
    const current = startOfDay(currentDate);
    if (isSameDay(current, today)) return "Today";
    if (isSameDay(current, addDays(today, 1))) return "Tomorrow";
    if (isSameDay(current, subDays(today, 1))) return "Yesterday";
    return format(currentDate, 'EEEE');
  };

  const handleViewDetails = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDetailsDialogOpen(true);
  };

  const goToPrevious = () => {
    if (view === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (view === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToCurrent = () => {
    setCurrentDate(new Date());
  };

  if (isLoading || courses.length === 0 || users.length === 0) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-40" />
        </div>
        
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-40" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 bg-background/70 rounded-lg flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-7">
              {Array.from({ length: 7 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-col items-center gap-1">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 min-h-[200px]">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <div key={j} className="p-3 rounded-lg bg-muted/30">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const upcomingSchedules = schedules
    .filter(s => new Date(s.startTime as unknown as string) > new Date())
    .sort((a, b) => new Date(a.startTime as unknown as string).getTime() - new Date(b.startTime as unknown as string).getTime())
    .slice(0, 3);

  return (
    <div className="p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto" data-testid="schedule-page">
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-r from-[#1F3A5F] to-[#2a4a75] rounded-2xl p-6 lg:p-8 shadow-xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 bg-[#2FBF71]/20 text-[#2FBF71] px-3 py-1.5 rounded-full text-sm font-medium mb-3">
              <Sparkles className="w-4 h-4" />
              Your Schedule
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Class Schedule</h1>
            <p className="text-white/70">
              View your {view === 'day' ? 'daily' : view === 'week' ? 'weekly' : 'monthly'} course schedule and upcoming events
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Tabs value={view} onValueChange={(v) => setView(v as 'day' | 'week' | 'month')}>
              <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20" data-testid="view-toggle">
                <TabsTrigger value="day" className="data-[state=active]:bg-[#2FBF71] data-[state=active]:text-white text-white/80" data-testid="view-day">
                  <Clock className="w-4 h-4 mr-2" />
                  Day
                </TabsTrigger>
                <TabsTrigger value="week" className="data-[state=active]:bg-[#2FBF71] data-[state=active]:text-white text-white/80" data-testid="view-week">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Week
                </TabsTrigger>
                <TabsTrigger value="month" className="data-[state=active]:bg-[#2FBF71] data-[state=active]:text-white text-white/80" data-testid="view-month">
                  <Calendar className="w-4 h-4 mr-2" />
                  Month
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={goToPrevious}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                data-testid="button-previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={goToCurrent}
                className="bg-[#2FBF71] border-[#2FBF71] text-white hover:bg-[#25a060] hover:text-white font-semibold"
                data-testid="button-today"
              >
                {getDateLabel()}
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={goToNext}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                data-testid="button-next"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Date and Timezone Row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {view === 'day' 
            ? format(currentDate, 'EEEE, MMMM d, yyyy')
            : view === 'week'
            ? `Week ${getISOWeek(weekStart)} • ${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
            : format(currentDate, 'MMMM yyyy')
          }
        </span>
        <span className="text-xs text-muted-foreground">
          {Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Upcoming Classes Alert */}
      {upcomingSchedules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-[#2FBF71]/30 bg-gradient-to-r from-[#2FBF71]/5 to-[#2FBF71]/10 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-10 h-10 bg-[#2FBF71]/20 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#2FBF71]" />
                </div>
                <div>
                  <span className="text-[#1F3A5F]">Upcoming Classes</span>
                  <p className="text-xs font-normal text-muted-foreground mt-0.5">Your next scheduled sessions</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingSchedules.map((schedule, index) => {
                  const courseInfo = getCourseInfo(schedule.courseId);
                  const teacherName = getTeacherName(schedule.teacherId);
                  const actualStatus = getActualStatus(schedule);
                  const startTime = parseISO(schedule.startTime as string);
                  const endTime = parseISO(schedule.endTime as string);
                  
                  return (
                    <motion.div 
                      key={schedule.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-white rounded-xl hover-elevate cursor-pointer flex items-start gap-4 border border-slate-100 shadow-sm"
                      onClick={() => handleViewDetails(schedule)}
                      data-testid={`upcoming-${schedule.id}`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] flex flex-col items-center justify-center shadow-lg">
                          <div className="text-xs font-medium text-white/80">{format(startTime, 'MMM')}</div>
                          <div className="text-xl font-bold text-white">{format(startTime, 'd')}</div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[#1F3A5F] truncate">{courseInfo.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#2FBF71]" />
                            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                          </span>
                          {schedule.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#2FBF71]" />
                              {schedule.location}
                            </span>
                          )}
                          {schedule.teacherId && (
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#2FBF71]" />
                              {hasSubstitute(schedule) 
                                ? getSubstituteTeacherName(schedule.substitution!.substituteTeacherId)
                                : teacherName}
                            </span>
                          )}
                        </div>
                        {schedule.externalLink && new Date(schedule.endTime) > new Date() && schedule.status !== 'completed' && schedule.status !== 'cancelled' && (
                          <Button
                            variant="default"
                            size="sm"
                            asChild
                            className="h-7 px-3 text-xs font-semibold bg-gradient-to-r from-[#2FBF71] to-[#25a060] hover:shadow-lg hover:shadow-[#2FBF71]/30 transition-all mt-2"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`schedule-external-link-${schedule.id}`}
                          >
                            <a 
                              href={schedule.externalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                              Join Class
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge variant={getStatusBadgeVariant(actualStatus)} className="shadow-sm">
                          {actualStatus}
                        </Badge>
                        {actualStatus === "cancelled" && schedule.cancelledBy && (() => {
                          const canceller = users.find(u => u.id === schedule.cancelledBy);
                          const displayName = canceller ? (canceller.role === 'teacher' ? 'teacher' : canceller.role === 'parent' ? 'parent' : canceller.role) : 'staff';
                          return (
                            <span className="text-[10px] text-muted-foreground">
                              Cancelled by {displayName}
                            </span>
                          );
                        })()}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Date Range Header */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center p-5 rounded-xl bg-gradient-to-r from-[#f8fafb] to-[#f0f4f8] border border-slate-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1F3A5F]/10 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[#1F3A5F]" />
          </div>
          <h2 className="text-xl font-bold text-[#1F3A5F]">
            {view === 'day'
              ? format(currentDate, 'EEEE, MMMM d, yyyy')
              : view === 'week' 
              ? `Week of ${format(weekStart, 'MMMM d')} - ${format(addDays(weekStart, 6), 'MMMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')
            }
          </h2>
        </div>
      </motion.div>

      {/* Day View */}
      {view === 'day' && (() => {
        const daySchedules = getSchedulesForDay(currentDate)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            {daySchedules.length === 0 ? (
              <Card className="border-slate-200 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-[#f8fafb] to-white p-1" />
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-[#1F3A5F]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-10 w-10 text-[#1F3A5F]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1F3A5F] mb-2">No classes scheduled</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    You have no classes scheduled for {format(currentDate, 'MMMM d, yyyy')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {daySchedules.map((schedule) => {
                  const courseInfo = getCourseInfo(schedule.courseId);
                  const teacherName = getTeacherName(schedule.teacherId);
                  const actualStatus = getActualStatus(schedule);
                  
                  return (
                    <Card 
                      key={schedule.id}
                      className="hover-elevate cursor-pointer transition-all"
                      onClick={() => handleViewDetails(schedule)}
                      data-testid={`day-schedule-${schedule.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            {/* Time Badge */}
                            <div className="flex items-center gap-3">
                              <div className="p-3 rounded-lg bg-primary/10 min-w-[100px] text-center">
                                <div className="text-xs text-muted-foreground mb-1">Start</div>
                                <div className="text-lg font-bold text-primary">
                                  {format(parseISO(schedule.startTime as string), 'h:mm a')}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-xl font-semibold">{schedule.title}</h3>
                                  <Badge variant={getStatusBadgeVariant(getActualStatus(schedule))}>
                                    {getActualStatus(schedule)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  <span>{format(parseISO(schedule.startTime as string), 'EEEE, MMMM d')}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  <span>{format(parseISO(schedule.startTime as string), 'h:mm a')} - {format(parseISO(schedule.endTime as string), 'h:mm a')}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <BookOpen className="w-4 h-4" />
                                  <span>{courseInfo.title}</span>
                                </div>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid md:grid-cols-2 gap-4 pt-3 border-t">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">Duration:</span>
                                  <span className="text-muted-foreground">
                                    {format(parseISO(schedule.startTime as string), 'h:mm a')} - {format(parseISO(schedule.endTime as string), 'h:mm a')}
                                  </span>
                                </div>
                                {hasSubstitute(schedule) ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm">
                                      <UserCheck className="w-4 h-4 text-amber-500" />
                                      <span className="font-medium text-amber-600 dark:text-amber-400">Substitute:</span>
                                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                                        {getSubstituteTeacherName(schedule.substitution!.substituteTeacherId)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm ml-6">
                                      <span className="text-xs text-muted-foreground">Regular teacher: {teacherName}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">Teacher:</span>
                                    <span className="text-muted-foreground">{teacherName}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                {schedule.location && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">Location:</span>
                                    <span className="text-muted-foreground">{schedule.location}</span>
                                  </div>
                                )}
                                {schedule.externalLink && new Date(schedule.endTime) > new Date() && schedule.status !== 'completed' && schedule.status !== 'cancelled' && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <LinkIcon className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">Join Meeting:</span>
                                    <a 
                                      href={schedule.externalLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline font-semibold"
                                      data-testid={`day-view-external-link-${schedule.id}`}
                                    >
                                      Click here
                                    </a>
                                  </div>
                                )}
                                {actualStatus === "cancelled" && schedule.cancelledBy && (() => {
                                  const canceller = users.find(u => u.id === schedule.cancelledBy);
                                  const displayName = canceller ? (canceller.role === 'teacher' ? 'teacher' : canceller.role === 'parent' ? 'parent' : canceller.role) : 'staff';
                                  return (
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="font-medium">Cancelled by:</span>
                                      <span className="text-destructive">{displayName}</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Description */}
                            {schedule.description && (
                              <div className="pt-3 border-t">
                                <p className="text-sm text-muted-foreground">
                                  {schedule.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        );
      })()}

      {/* Week Grid */}
      {view === 'week' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid gap-4 md:grid-cols-7"
        >
        {weekDays.map((day, index) => {
          const daySchedules = getSchedulesForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <Card 
              key={index} 
              className={`${isToday ? 'border-[#2FBF71] shadow-lg ring-2 ring-[#2FBF71]/20' : 'border-slate-200'} transition-all`}
              data-testid={`day-${format(day, 'yyyy-MM-dd')}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      {format(day, 'EEEE')}
                    </span>
                    <div className={`text-2xl font-bold mt-1 ${isToday ? 'text-[#2FBF71]' : 'text-[#1F3A5F]'}`}>
                      {format(day, 'd')}
                    </div>
                    {isToday && (
                      <Badge className="mt-2 text-xs bg-[#2FBF71] text-white">
                        Today
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 min-h-[240px] overflow-hidden">
                {daySchedules.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-12">
                    No classes
                  </div>
                ) : (
                  daySchedules
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((schedule) => {
                      const actualStatus = getActualStatus(schedule);
                      return (
                        <div 
                          key={schedule.id}
                          className="p-3 rounded-lg bg-muted/40 hover-elevate cursor-pointer transition-colors overflow-hidden"
                          onClick={() => handleViewDetails(schedule)}
                          data-testid={`schedule-${schedule.id}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-2 flex-1 min-w-0">
                              {schedule.title}
                            </h4>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0 max-w-[85px] overflow-hidden">
                              <Badge variant={getStatusBadgeVariant(actualStatus)} className="text-xs whitespace-nowrap max-w-full">
                                {actualStatus}
                              </Badge>
                              {actualStatus === "cancelled" && schedule.cancelledBy && (() => {
                              const canceller = users.find(u => u.id === schedule.cancelledBy);
                              const displayName = canceller ? (canceller.role === 'teacher' ? 'teacher' : canceller.role === 'parent' ? 'parent' : canceller.role) : 'staff';
                              return (
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  Cancelled by {displayName}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(parseISO(schedule.startTime as string), 'HH:mm')} - {format(parseISO(schedule.endTime as string), 'HH:mm')}
                            </span>
                          </div>
                          
                          {schedule.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span className="line-clamp-1">{schedule.location}</span>
                            </div>
                          )}

                          {schedule.externalLink && new Date(schedule.endTime) > new Date() && schedule.status !== 'completed' && schedule.status !== 'cancelled' && (
                            <Button
                              variant="default"
                              size="sm"
                              asChild
                              className="h-5 px-1.5 text-[10px] font-semibold bg-gradient-to-r from-primary to-primary/80 hover:shadow-md hover:shadow-primary/40 transition-all w-full justify-center mt-1"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`week-view-external-link-${schedule.id}`}
                            >
                              <a 
                                href={schedule.externalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-0.5"
                              >
                                <LinkIcon className="w-2.5 h-2.5" />
                                Join
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                      );
                    })
                )}
              </CardContent>
            </Card>
          );
        })}
        </motion.div>
      )}

      {/* Month Grid */}
      {view === 'month' && (
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
              {day}
            </div>
          ))}
          
          {monthDays.map((day, index) => {
            const daySchedules = getSchedulesForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={index}
                className={`min-h-24 p-2 border rounded-md ${
                  isCurrentMonth ? "bg-background" : "bg-muted/30"
                } ${isToday ? "ring-2 ring-primary" : ""}`}
                data-testid={`month-day-${format(day, "yyyy-MM-dd")}`}
              >
                <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {daySchedules.slice(0, 2).map(schedule => {
                    const actualStatus = getActualStatus(schedule);
                    const isFinished = actualStatus === "completed";
                    const statusColor = 
                      actualStatus === "completed" ? "bg-secondary" :
                      actualStatus === "cancelled" ? "bg-destructive" :
                      actualStatus === "rescheduled" ? "bg-primary" :
                      "bg-primary/50";
                    
                    return (
                      <div
                        key={schedule.id}
                        className="text-xs p-1 bg-primary/10 rounded hover-elevate cursor-pointer overflow-hidden"
                        onClick={() => handleViewDetails(schedule)}
                        data-testid={`month-schedule-${schedule.id}`}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor}`} title={actualStatus}></div>
                          <div className="font-medium truncate text-foreground flex-1 min-w-0">{schedule.title}</div>
                          {isFinished && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 flex-shrink-0 whitespace-nowrap no-default-hover-elevate">
                              Finished
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground truncate">
                          {format(parseISO(schedule.startTime as string), "h:mm a")}
                        </div>
                      </div>
                    );
                  })}
                  {daySchedules.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{daySchedules.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedSchedule && (() => {
            const actualStatus = getActualStatus(selectedSchedule);
            return (
            <>
              <DialogHeader>
                <DialogTitle>{getCourseInfo(selectedSchedule.courseId).title}</DialogTitle>
                <DialogDescription>{getCourseInfo(selectedSchedule.courseId).description || 'Course details'}</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Class Title and Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold flex-1 min-w-0">{selectedSchedule.title}</h3>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant={getStatusBadgeVariant(actualStatus)} className="text-sm max-w-[120px] truncate">
                        {actualStatus}
                      </Badge>
                      {actualStatus === "cancelled" && selectedSchedule.cancelledBy && (() => {
                        const canceller = users.find(u => u.id === selectedSchedule.cancelledBy);
                        const displayName = canceller ? (canceller.role === 'teacher' ? 'teacher' : canceller.role === 'parent' ? 'parent' : canceller.role) : 'staff';
                        return (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            Cancelled by {displayName}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  {selectedSchedule.description && (
                    <p className="text-sm text-muted-foreground">{selectedSchedule.description}</p>
                  )}
                </div>

              {/* Schedule Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-semibold">
                        {format(parseISO(selectedSchedule.startTime as string), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="font-semibold">
                        {format(parseISO(selectedSchedule.startTime as string), 'h:mm a')} - {format(parseISO(selectedSchedule.endTime as string), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {hasSubstitute(selectedSchedule) ? (
                    <>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-800">
                          <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Substitute Teacher</p>
                          <p className="font-semibold text-amber-800 dark:text-amber-200" data-testid="text-substitute-teacher">
                            {getSubstituteTeacherName(selectedSchedule.substitution!.substituteTeacherId)}
                          </p>
                          {selectedSchedule.substitution!.reason && (
                            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                              Reason: {selectedSchedule.substitution!.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Regular Teacher</p>
                          <p className="font-semibold text-muted-foreground">{getTeacherName(selectedSchedule.teacherId)}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Teacher</p>
                        <p className="font-semibold">{getTeacherName(selectedSchedule.teacherId)}</p>
                      </div>
                    </div>
                  )}

                  {selectedSchedule.location && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-semibold">{selectedSchedule.location}</p>
                      </div>
                    </div>
                  )}

                  {selectedSchedule.externalLink && (
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${actualStatus === 'completed' || actualStatus === 'cancelled' ? 'bg-muted' : 'bg-primary/10'}`}>
                        <LinkIcon className={`w-4 h-4 ${actualStatus === 'completed' || actualStatus === 'cancelled' ? 'text-muted-foreground' : 'text-primary'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Join Meeting</p>
                        {actualStatus === 'completed' || actualStatus === 'cancelled' ? (
                          <span className="font-semibold text-muted-foreground" data-testid={`dialog-external-link-${selectedSchedule.id}`}>
                            Session ended
                          </span>
                        ) : (
                          <a 
                            href={selectedSchedule.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary hover:underline"
                            data-testid={`dialog-external-link-${selectedSchedule.id}`}
                          >
                            Click here
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedSchedule.notes && (
                <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                  <p className="text-sm font-semibold text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedSchedule.notes}</p>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => setIsDetailsDialogOpen(false)} data-testid="button-close-details">
                  Close
                </Button>
              </div>
            </div>
            </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
