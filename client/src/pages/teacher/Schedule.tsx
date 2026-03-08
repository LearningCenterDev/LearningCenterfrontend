import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Schedule } from "@shared/schema";
import { z } from "zod";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Calendar, Clock, MapPin, CalendarDays, FileText, User, Link as LinkIcon, UserRoundCog, RefreshCw, Users, Check, X, GraduationCap } from "lucide-react";
import { RescheduleProposalModal, PendingProposals } from "@/components/RescheduleProposalModal";
import { GoogleCalendarButton } from "@/components/GoogleCalendarButton";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, endOfWeek, subDays, startOfDay, getISOWeek, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getTeacherColor } from "@/lib/teacherColors";
import type { RescheduleProposalWithRelations } from "@shared/schema";

interface TeacherScheduleProps {
  teacherId: string;
}

const rescheduleSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
});

type RescheduleFormData = z.infer<typeof rescheduleSchema>;

export default function TeacherSchedule({ teacherId }: TeacherScheduleProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [expandedDayPopover, setExpandedDayPopover] = useState<string | null>(null);
  const [isUpcomingCollapsed, setIsUpcomingCollapsed] = useState(false);
  const [selectedStudentFilterIds, setSelectedStudentFilterIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("teacherScheduleStudentFilter");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isStudentFilterOpen, setIsStudentFilterOpen] = useState(false);
  const { toast } = useToast();

  const getActualStatus = (schedule: Schedule): string => {
    if (schedule.status === "cancelled") return "cancelled";
    
    const now = new Date();
    const startTime = new Date(schedule.startTime as unknown as string);
    const endTime = new Date(schedule.endTime as unknown as string);
    
    if (schedule.status === "rescheduled" && startTime > now) {
      return "rescheduled";
    }

    if (endTime < now) {
      return "completed";
    }
    
    return schedule.status;
  };

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/teachers", teacherId, "schedules"],
  });

  const { data: pendingProposals = [], isLoading: proposalsLoading } = useQuery<RescheduleProposalWithRelations[]>({
    queryKey: ["/api/reschedule-proposals/pending"],
  });

  const isLoading = schedulesLoading || proposalsLoading;

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });

  // Get substitution data directly from selected schedule (included in schedules response)
  const currentSubstitution = selectedSchedule ? (selectedSchedule as any).substitution : null;

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthGridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const monthGridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const monthDays = eachDayOfInterval({ start: monthGridStart, end: monthGridEnd });

  const form = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      startTime: "",
      endTime: "",
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RescheduleFormData }) => {
      const payload = {
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        status: "rescheduled" as const,
      };
      return await apiRequest("PATCH", `/api/schedules/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers", teacherId, "schedules"] });
      setIsRescheduleDialogOpen(false);
      setSelectedSchedule(null);
      toast({ title: "Course rescheduled successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/schedules/${id}`, { status: "cancelled", cancelledBy: teacherId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers", teacherId, "schedules"] });
      setIsDetailsDialogOpen(false);
      setSelectedSchedule(null);
      toast({ title: "Class cancelled successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCancelSchedule = () => {
    if (selectedSchedule && window.confirm("Are you sure you want to cancel this scheduled class? This action cannot be undone.")) {
      cancelMutation.mutate(selectedSchedule.id);
    }
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = users.find(u => u.id === teacherId);
    return teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.name || 'Unknown' : 'Unknown';
  };

  const getStudentName = (studentId: string | null) => {
    if (!studentId) return null;
    const student = users.find(u => u.id === studentId);
    return student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || 'Unknown' : 'Unknown';
  };

  const getCourseInfo = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course || { title: 'Unknown Course', description: '' };
  };

  const getEnrolledStudentsForCourse = (courseId: string) => {
    const courseEnrollments = enrollments.filter(
      (e: any) => e.courseId === courseId && e.approvalStatus === 'approved'
    );
    return courseEnrollments.map((e: any) => {
      const student = users.find((u: any) => u.id === e.studentId);
      if (student) {
        return `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || 'Unknown';
      }
      return null;
    }).filter(Boolean);
  };

  // Get unique students assigned to this teacher from schedules
  const assignedStudents = useMemo(() => {
    const studentIds = new Set<string>();
    schedules.forEach(schedule => {
      if (schedule.studentId) {
        studentIds.add(schedule.studentId);
      }
    });
    return Array.from(studentIds)
      .map(id => users.find(u => u.id === id))
      .filter(Boolean) as any[];
  }, [schedules, users]);

  // Student colors for filter
  const studentColors = [
    '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', 
    '#6366F1', '#14B8A6', '#F97316', '#84CC16', '#06B6D4',
    '#A855F7', '#EF4444', '#22C55E', '#0EA5E9', '#D946EF'
  ];

  const studentColorMap = useMemo(() => {
    const map = new Map<string, string>();
    assignedStudents.forEach((student, index) => {
      if (student?.id) {
        map.set(student.id, studentColors[index % studentColors.length] || '#6b7280');
      }
    });
    return map;
  }, [assignedStudents]);

  const getStudentColor = useCallback((studentId: string): string => {
    return studentColorMap.get(studentId) || '#6b7280';
  }, [studentColorMap]);

  // Save student filter to localStorage
  useEffect(() => {
    localStorage.setItem("teacherScheduleStudentFilter", JSON.stringify(selectedStudentFilterIds));
  }, [selectedStudentFilterIds]);

  // Filtered schedules based on student filter
  const filteredSchedules = useMemo(() => {
    if (selectedStudentFilterIds.length === 0) return schedules;
    return schedules.filter(schedule => 
      schedule.studentId && selectedStudentFilterIds.includes(schedule.studentId)
    );
  }, [schedules, selectedStudentFilterIds]);

  const schedulesByDay = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    filteredSchedules.forEach(schedule => {
      const scheduleDate = parseISO(schedule.startTime as unknown as string);
      const dayKey = format(scheduleDate, 'yyyy-MM-dd');
      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }
      map.get(dayKey)!.push(schedule);
    });
    return map;
  }, [filteredSchedules]);

  const getSchedulesForDay = useCallback((day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    return schedulesByDay.get(dayKey) || [];
  }, [schedulesByDay]);

  const getFilteredSchedulesForDay = getSchedulesForDay;

  const toggleStudentFilter = (studentId: string) => {
    setSelectedStudentFilterIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const clearStudentFilter = () => {
    setSelectedStudentFilterIds([]);
  };

  const selectAllStudents = () => {
    setSelectedStudentFilterIds(assignedStudents.map(s => s.id));
  };

  // Get teacher's color for background
  const teacher = users.find(u => u.id === teacherId);
  const myTeacherColor = teacher ? getTeacherColor(teacherId, (teacher as any).calendarColor) : '#6b7280';

  const handleViewDetails = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDetailsDialogOpen(true);
  };

  const handleOpenReschedule = () => {
    if (selectedSchedule) {
      const startTime = new Date(selectedSchedule.startTime);
      const endTime = new Date(selectedSchedule.endTime);
      
      form.reset({
        startTime: format(startTime, "yyyy-MM-dd'T'HH:mm"),
        endTime: format(endTime, "yyyy-MM-dd'T'HH:mm"),
      });
      setIsDetailsDialogOpen(false);
      setIsRescheduleDialogOpen(true);
    }
  };

  const handleOpenProposalModal = () => {
    if (selectedSchedule) {
      setIsDetailsDialogOpen(false);
      setIsProposalModalOpen(true);
    }
  };

  const invalidateScheduleQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/teachers", teacherId, "schedules"] });
  };

  const onSubmit = (data: RescheduleFormData) => {
    if (selectedSchedule) {
      rescheduleMutation.mutate({ id: selectedSchedule.id, data });
    }
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

  const goToToday = () => setCurrentDate(new Date());

  // Get dynamic label for "Today" button based on current view date
  const getDateNavigationLabel = () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const yesterday = subDays(today, 1);
    
    if (isSameDay(currentDate, today)) {
      return "Today";
    } else if (isSameDay(currentDate, tomorrow)) {
      return "Tomorrow";
    } else if (isSameDay(currentDate, yesterday)) {
      return "Yesterday";
    } else {
      return format(currentDate, "EEEE");
    }
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

  // Get upcoming schedules (next 3)
  const upcomingSchedules = filteredSchedules
    .filter(s => new Date(s.startTime as unknown as string) > new Date())
    .sort((a, b) => new Date(a.startTime as unknown as string).getTime() - new Date(b.startTime as unknown as string).getTime())
    .slice(0, 3);

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

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto" data-testid="teacher-schedule-page">
      {/* Pending Reschedule Proposals */}
      <PendingProposals userId={teacherId} invalidateQueries={invalidateScheduleQueries} proposals={pendingProposals} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-schedule-title">My Schedule</h1>
          <p className="text-muted-foreground" data-testid="text-schedule-subtitle">
            View and reschedule your classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GoogleCalendarButton />
          <Tabs value={view} onValueChange={(v) => setView(v as 'day' | 'week' | 'month')} className="mr-2">
            <TabsList data-testid="tabs-view-toggle">
              <TabsTrigger value="day" data-testid="tab-day">
                <Clock className="w-4 h-4 mr-2" />
                Day
              </TabsTrigger>
              <TabsTrigger value="week" data-testid="tab-week">Week</TabsTrigger>
              <TabsTrigger value="month" data-testid="tab-month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={goToPrevious} data-testid="button-previous">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-today">
            {getDateNavigationLabel()}
          </Button>
          <Button variant="outline" size="sm" onClick={goToNext} data-testid="button-next">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Date, Timezone Row and Student Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {view === 'day' 
              ? format(currentDate, 'EEEE, MMMM d, yyyy')
              : view === 'week'
              ? `Week ${getISOWeek(weekStart)} • ${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')
            }
          </span>
          
          {/* Student Filter */}
          {assignedStudents.length > 0 && (
            <Popover open={isStudentFilterOpen} onOpenChange={setIsStudentFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">Students</span>
                  {selectedStudentFilterIds.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                      {selectedStudentFilterIds.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search students..." />
                  <CommandList>
                    <CommandEmpty>No students found.</CommandEmpty>
                    <CommandGroup>
                      <div className="flex items-center justify-between px-2 py-1.5 border-b">
                        <Button variant="ghost" size="sm" onClick={selectAllStudents} className="h-7 text-xs">
                          Select All
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearStudentFilter} className="h-7 text-xs">
                          Clear
                        </Button>
                      </div>
                      {assignedStudents.map((student) => {
                        const color = getStudentColor(student.id);
                        const isSelected = selectedStudentFilterIds.includes(student.id);
                        return (
                          <CommandItem
                            key={student.id}
                            value={student.name || student.email || student.id}
                            onSelect={() => toggleStudentFilter(student.id)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <span className="truncate">
                                {student.firstName && student.lastName 
                                  ? `${student.firstName} ${student.lastName}` 
                                  : student.name || student.email}
                              </span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-primary" />}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Selected student badges */}
          {selectedStudentFilterIds.length > 0 && selectedStudentFilterIds.length <= 3 && (
            <div className="hidden md:flex items-center gap-1">
              {selectedStudentFilterIds.map(id => {
                const student = assignedStudents.find(s => s.id === id);
                if (!student) return null;
                const color = getStudentColor(student.id);
                return (
                  <Badge 
                    key={id} 
                    variant="outline" 
                    className="gap-1 text-xs"
                    style={{ borderColor: color, color: color }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {student.firstName || student.name?.split(' ')[0] || 'Student'}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:opacity-70" 
                      onClick={(e) => { e.stopPropagation(); toggleStudentFilter(id); }}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            {Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Upcoming Schedule - Day View only */}
      {view === 'day' && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Upcoming Classes
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsUpcomingCollapsed(!isUpcomingCollapsed)}
              className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {isUpcomingCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {!isUpcomingCollapsed && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
                ))
              ) : upcomingSchedules.length > 0 ? (
                upcomingSchedules.map((schedule) => {
                  const course = getCourseInfo(schedule.courseId);
                  const startTime = new Date(schedule.startTime);
                  
                  return (
                    <div 
                      key={schedule.id}
                      className="group relative p-3 bg-card border border-border/50 rounded-xl hover-elevate transition-all cursor-pointer overflow-hidden"
                      onClick={() => handleViewDetails(schedule)}
                    >
                      <div className="absolute top-0 right-0 p-2">
                        <Badge 
                          variant={getStatusBadgeVariant(getActualStatus(schedule))}
                          className="text-[10px] px-1.5 py-0 h-4 uppercase font-bold tracking-tight"
                        >
                          {getActualStatus(schedule)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
                          <span className="text-[10px] font-bold text-primary uppercase leading-none">{format(startTime, 'MMM')}</span>
                          <span className="text-sm font-black text-primary leading-none mt-0.5">{format(startTime, 'd')}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm truncate leading-tight group-hover:text-primary transition-colors">
                            {course?.title || 'Course'}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-medium">
                            <Clock className="w-3 h-3 text-primary/70" />
                            {format(startTime, 'h:mm a')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="md:col-span-3 p-4 text-center rounded-xl bg-muted/20 border border-dashed border-muted-foreground/20">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Quiet moment • No upcoming classes</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (() => {
        const daySchedules = getFilteredSchedulesForDay(currentDate)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
        return (
          <div className="max-w-4xl mx-auto">
            {daySchedules.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-4 bg-gradient-to-b from-card/50 to-transparent rounded-3xl border border-dashed border-border/60">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <div className="relative w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                    <CalendarDays className="h-10 w-10 text-primary opacity-80" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                  Schedule Clear
                </h3>
                <p className="text-muted-foreground max-w-[280px] leading-relaxed font-medium">
                  Enjoy your time! You have no classes scheduled for <span className="text-foreground font-bold">{format(currentDate, 'MMMM d')}</span>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {daySchedules.map((schedule) => {
                  const courseInfo = getCourseInfo(schedule.courseId);
                  const studentColor = schedule.studentId ? getStudentColor(schedule.studentId) : '#6b7280';
                  
                  return (
                    <Card 
                      key={schedule.id}
                      className="hover-elevate cursor-pointer transition-all overflow-hidden"
                      onClick={() => handleViewDetails(schedule)}
                      data-testid={`day-schedule-${schedule.id}`}
                      style={{
                        backgroundColor: `${myTeacherColor}30`,
                        borderRight: `6px solid ${studentColor}`,
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
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
                                  <FileText className="w-4 h-4" />
                                  <span>{courseInfo.title}</span>
                                </div>
                                {schedule.studentId ? (
                                  getStudentName(schedule.studentId) && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <User className="w-4 h-4" />
                                      <span>Student: {getStudentName(schedule.studentId)}</span>
                                    </div>
                                  )
                                ) : (
                                  (() => {
                                    const enrolledStudents = getEnrolledStudentsForCourse(schedule.courseId);
                                    if (enrolledStudents.length > 0) {
                                      return (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                          <User className="w-4 h-4" />
                                          <span>
                                            {enrolledStudents.length === 1 
                                              ? `Student: ${enrolledStudents[0]}` 
                                              : `Students: ${enrolledStudents.length} enrolled`}
                                          </span>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()
                                )}
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 pt-3 border-t">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">Duration:</span>
                                  <span className="text-muted-foreground">
                                    {format(parseISO(schedule.startTime as string), 'h:mm a')} - {format(parseISO(schedule.endTime as string), 'h:mm a')}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                {schedule.location && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">Location:</span>
                                    <span className="text-muted-foreground">{schedule.location}</span>
                                  </div>
                                )}
                                {schedule.externalLink && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <LinkIcon className={`w-4 h-4 ${new Date(schedule.endTime) <= new Date() || schedule.status === 'completed' || schedule.status === 'cancelled' ? 'text-muted-foreground' : 'text-muted-foreground'}`} />
                                    <span className="font-medium">Join Meeting:</span>
                                    {new Date(schedule.endTime) <= new Date() || schedule.status === 'completed' || schedule.status === 'cancelled' ? (
                                      <span className="text-muted-foreground font-semibold" data-testid={`day-view-external-link-${schedule.id}`}>
                                        Session ended
                                      </span>
                                    ) : (
                                      <a 
                                        href={schedule.externalLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline font-semibold"
                                        data-testid={`day-view-external-link-${schedule.id}`}
                                      >
                                        Click here
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

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
          </div>
        );
      })()}

      {/* Week Grid */}
      {view === 'week' && (
        <div className="grid gap-4 md:grid-cols-7">
          {weekDays.map((day, index) => {
            const daySchedules = getFilteredSchedulesForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <Card 
                key={index} 
                className={`${isToday ? 'ring-2 ring-primary border-primary/40' : ''}`}
                data-testid={`day-${format(day, 'yyyy-MM-dd')}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {format(day, 'EEEE')}
                      </span>
                      <span className={`text-lg font-bold mt-1 ${isToday ? 'text-primary' : ''}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 min-h-[200px] overflow-hidden">
                  {daySchedules.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No classes
                    </div>
                  ) : (
                    daySchedules
                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .map((schedule) => {
                        const studentColor = schedule.studentId ? getStudentColor(schedule.studentId) : '#6b7280';
                        return (
                        <div 
                          key={schedule.id}
                          className="p-3 rounded-lg cursor-pointer transition-all hover-elevate overflow-hidden"
                          onClick={() => handleViewDetails(schedule)}
                          data-testid={`schedule-${schedule.id}`}
                          style={{
                            backgroundColor: `${myTeacherColor}30`,
                            borderRight: `5px solid ${studentColor}`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-2 flex-1 min-w-0">
                              {schedule.title}
                            </h4>
                            <div className="flex flex-wrap gap-1 flex-shrink-0 justify-end max-w-[85px] overflow-hidden">
                              {new Date(schedule.endTime) <= new Date() && (
                                <Badge variant="secondary" className="text-xs whitespace-nowrap max-w-full">
                                  Finished
                                </Badge>
                              )}
                              <Badge variant={getStatusBadgeVariant(schedule.status)} className="text-xs whitespace-nowrap max-w-full">
                                {schedule.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {format(parseISO(schedule.startTime as string), 'HH:mm')} - {format(parseISO(schedule.endTime as string), 'HH:mm')}
                              </span>
                            </div>
                            
                            {schedule.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{schedule.location}</span>
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
                      );})
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
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
            const daySchedules = getFilteredSchedulesForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            
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
                    const studentColor = schedule.studentId ? getStudentColor(schedule.studentId) : '#6b7280';
                    const statusColor = 
                      actualStatus === "completed" ? "bg-secondary" :
                      actualStatus === "cancelled" ? "bg-destructive" :
                      actualStatus === "rescheduled" ? "bg-primary" :
                      "bg-primary/50";

                    return (
                      <div
                        key={schedule.id}
                        className="text-xs p-1 rounded hover-elevate cursor-pointer overflow-hidden"
                        onClick={() => handleViewDetails(schedule)}
                        data-testid={`month-schedule-${schedule.id}`}
                        style={{
                          backgroundColor: `${myTeacherColor}30`,
                          borderRight: `3px solid ${studentColor}`,
                        }}
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
                    <Popover 
                      open={expandedDayPopover === format(day, 'yyyy-MM-dd')} 
                      onOpenChange={(open) => setExpandedDayPopover(open ? format(day, 'yyyy-MM-dd') : null)}
                    >
                      <PopoverTrigger asChild>
                        <button 
                          className="text-xs text-primary font-medium text-center w-full hover:underline cursor-pointer"
                          data-testid={`more-schedules-${format(day, 'yyyy-MM-dd')}`}
                        >
                          +{daySchedules.length - 2} more
                        </button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-72 p-0 max-h-[350px] overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 ease-out" 
                        align="start"
                        side="bottom"
                      >
                        <div className="bg-primary/5 px-3 py-2 border-b">
                          <div className="font-semibold text-sm">{format(day, 'EEEE, MMMM d')}</div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">{daySchedules.length} schedules</div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block"></span>Student
                            </div>
                          </div>
                        </div>
                        <div className="max-h-[280px] overflow-y-auto p-2 space-y-1.5 popover-scroll">
                          {daySchedules.map(schedule => {
                            const actualStatus = getActualStatus(schedule);
                            const isFinished = actualStatus === "completed";
                            const studentColor = schedule.studentId ? getStudentColor(schedule.studentId) : '#6b7280';
                            const studentName = getStudentName(schedule.studentId);
                            const statusColor = 
                              actualStatus === "completed" ? "bg-secondary" :
                              actualStatus === "cancelled" ? "bg-destructive" :
                              actualStatus === "rescheduled" ? "bg-primary" :
                              "bg-primary/50";
                            return (
                              <div
                                key={schedule.id}
                                className="text-xs p-2 rounded hover-elevate cursor-pointer"
                                onClick={() => {
                                  setExpandedDayPopover(null);
                                  handleViewDetails(schedule);
                                }}
                                style={{
                                  backgroundColor: `${myTeacherColor}30`,
                                  borderRight: `3px solid ${studentColor}`,
                                }}
                              >
                                <div className="flex items-center gap-1">
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor}`} title={actualStatus}></div>
                                  <div className="font-medium truncate text-foreground flex-1">{schedule.title}</div>
                                  {isFinished && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 flex-shrink-0">
                                      Finished
                                    </Badge>
                                  )}
                                </div>
                                {studentName && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: studentColor }} />
                                    <span className="text-muted-foreground truncate">{studentName}</span>
                                  </div>
                                )}
                                <div className="text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(parseISO(schedule.startTime as string), "h:mm a")} - {format(parseISO(schedule.endTime as string), "h:mm a")}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
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
          {selectedSchedule && (
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
                    <div className="flex gap-2 flex-wrap flex-shrink-0 justify-end">
                      <Badge variant={getStatusBadgeVariant(getActualStatus(selectedSchedule))} className="text-sm max-w-[120px] truncate">
                        {getActualStatus(selectedSchedule)}
                      </Badge>
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
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Teacher</p>
                      <p className="font-semibold">{getTeacherName(selectedSchedule.teacherId)}</p>
                    </div>
                  </div>

                  {currentSubstitution && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                        <UserRoundCog className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Substitute Teacher</p>
                        <p className="font-semibold" data-testid="text-substitute-teacher">
                          {users.find((t: any) => t.id === currentSubstitution.substituteTeacherId)?.name || 
                           `${users.find((t: any) => t.id === currentSubstitution.substituteTeacherId)?.firstName || ''} ${users.find((t: any) => t.id === currentSubstitution.substituteTeacherId)?.lastName || ''}`.trim() || 
                           'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate" title={currentSubstitution.reason}>
                          Reason: {currentSubstitution.reason}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedSchedule.studentId ? (
                    getStudentName(selectedSchedule.studentId) && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Student</p>
                          <p className="font-semibold">{getStudentName(selectedSchedule.studentId)}</p>
                        </div>
                      </div>
                    )
                  ) : (
                    (() => {
                      const enrolledStudents = getEnrolledStudentsForCourse(selectedSchedule.courseId);
                      if (enrolledStudents.length > 0) {
                        return (
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {enrolledStudents.length === 1 ? 'Student' : 'Students'}
                              </p>
                              <p className="font-semibold">
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
                      <div className={`p-2 rounded-lg ${getActualStatus(selectedSchedule) === 'completed' || getActualStatus(selectedSchedule) === 'cancelled' ? 'bg-muted' : 'bg-primary/10'}`}>
                        <LinkIcon className={`w-4 h-4 ${getActualStatus(selectedSchedule) === 'completed' || getActualStatus(selectedSchedule) === 'cancelled' ? 'text-muted-foreground' : 'text-primary'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Join Meeting</p>
                        {getActualStatus(selectedSchedule) === 'completed' || getActualStatus(selectedSchedule) === 'cancelled' ? (
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

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)} data-testid="button-close-details">
                  Close
                </Button>
                {new Date(selectedSchedule.endTime) > new Date() && 
                 selectedSchedule.status !== "cancelled" && 
                 selectedSchedule.status !== "completed" && 
                 !currentSubstitution && (
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant="destructive" 
                      onClick={handleCancelSchedule}
                      disabled={cancelMutation.isPending}
                      data-testid="button-cancel-schedule"
                    >
                      {cancelMutation.isPending ? "Cancelling..." : "Cancel Class"}
                    </Button>
                    <Button onClick={handleOpenReschedule} data-testid="button-open-reschedule">
                      Reschedule Course
                    </Button>
                    <Button variant="outline" onClick={handleOpenProposalModal} data-testid="button-propose-reschedule">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Propose Reschedule
                    </Button>
                  </div>
                )}
                {currentSubstitution && new Date(selectedSchedule.endTime) > new Date() && 
                 selectedSchedule.status !== "cancelled" && selectedSchedule.status !== "completed" && (
                  <p className="text-sm text-muted-foreground italic">
                    A substitute teacher has been assigned. Contact admin to make changes.
                  </p>
                )}
              </div>
            </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedSchedule?.title || 'Reschedule Course'}</DialogTitle>
            <DialogDescription>
              {selectedSchedule && getCourseInfo(selectedSchedule.courseId).subject 
                ? `Subject: ${getCourseInfo(selectedSchedule.courseId).subject}` 
                : 'Update the schedule below'}
            </DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <>
              {/* Current Schedule Information */}
              <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Current Schedule</p>
                </div>
                <div className="space-y-2 ml-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">
                      {format(parseISO(selectedSchedule.startTime as string), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">
                      {format(parseISO(selectedSchedule.startTime as string), 'h:mm a')} - {format(parseISO(selectedSchedule.endTime as string), 'h:mm a')}
                    </span>
                  </div>
                  {selectedSchedule.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{selectedSchedule.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Start Time</FormLabel>
                        <FormControl>
                          <Input {...field} type="datetime-local" data-testid="input-reschedule-start-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New End Time</FormLabel>
                        <FormControl>
                          <Input {...field} type="datetime-local" data-testid="input-reschedule-end-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsRescheduleDialogOpen(false)} data-testid="button-cancel-reschedule">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={rescheduleMutation.isPending} data-testid="button-submit-reschedule">
                      {rescheduleMutation.isPending ? "Rescheduling..." : "Reschedule Course"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reschedule Proposal Modal */}
      <RescheduleProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => {
          setIsProposalModalOpen(false);
          setSelectedSchedule(null);
        }}
        schedule={selectedSchedule}
        currentUserId={teacherId}
        currentUserRole="teacher"
        invalidateQueries={invalidateScheduleQueries}
      />
    </div>
  );
}
