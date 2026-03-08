import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertScheduleSchema, type Schedule, type Course, type User } from "@shared/schema";
import { z } from "zod";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Plus, Pencil, Trash2, Calendar, Clock, MapPin, User as UserIcon, Repeat, Link as LinkIcon, UserRoundCog, X, CalendarDays, Filter, Check, MessageSquare, Mail, Phone, Send, Loader2, Users, Sparkles, GraduationCap } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, getISOWeek, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getTeacherColor } from "@/lib/teacherColors";
import { getBrowserTimezone, localToUTC, utcToLocal, formatTimeInTimezone, formatDateTimeInTimezone, getUserTimezone, isSameDayInTimezone } from "@/lib/timezone";

type CommunicationRecipient = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  type: 'teacher' | 'student' | 'parent';
};

const scheduleFormSchema = insertScheduleSchema.extend({
  startTime: z.string(),
  endTime: z.string(),
  studentId: z.string().min(1, "Student is required"),
  externalLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

interface AdminScheduleProps {
  adminId: string;
}

export default function AdminSchedule({ adminId }: AdminScheduleProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedDayPopover, setExpandedDayPopover] = useState<string | null>(null);
  const [updateScope, setUpdateScope] = useState<'single' | 'all'>('single');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom'>('weekly');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1]);
  const [recurrenceEndType, setRecurrenceEndType] = useState<'never' | 'until_date' | 'after_occurrences'>('never');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');
  const [recurrenceOccurrenceCount, setRecurrenceOccurrenceCount] = useState(10);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudentTimezone, setSelectedStudentTimezone] = useState<string>("UTC");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [isSubstituteDialogOpen, setIsSubstituteDialogOpen] = useState(false);
  const [substituteTeacherId, setSubstituteTeacherId] = useState<string>("");
  const [substituteReason, setSubstituteReason] = useState<string>("");
  const [applyExternalLinkToAll, setApplyExternalLinkToAll] = useState(false);
  const [isUpcomingCollapsed, setIsUpcomingCollapsed] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("scheduleTeacherFilter");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isTeacherFilterOpen, setIsTeacherFilterOpen] = useState(false);
  const [selectedStudentFilterIds, setSelectedStudentFilterIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("scheduleStudentFilter");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isStudentFilterOpen, setIsStudentFilterOpen] = useState(false);
  const [isCommunicationOpen, setIsCommunicationOpen] = useState(false);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [communicationType, setCommunicationType] = useState<'message' | 'email' | 'sms'>('message');
  
  const handleCommunicationTypeChange = (newType: 'message' | 'email' | 'sms') => {
    setCommunicationType(newType);
    setSelectedRecipientIds([]);
  };
  const [communicationSubject, setCommunicationSubject] = useState('');
  const [communicationMessage, setCommunicationMessage] = useState('');
  const { toast } = useToast();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthGridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const monthGridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const startDate = view === 'week' ? weekStart : monthGridStart;
  const endDate = view === 'week' ? weekEnd : monthGridEnd;

  const { data: schedules = [], isLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules", { view, startDate: startDate.toISOString(), endDate: endDate.toISOString() }],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      const res = await fetch(`/api/schedules?${params}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    }
  });

  const { data: adminUser } = useQuery<User>({
    queryKey: ["/api/users", adminId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${adminId}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!adminId,
  });
  
  const adminTimezone = useMemo(() => getUserTimezone(adminUser?.timezone), [adminUser?.timezone]);

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: allTeachers = [], isLoading: teachersLoading } = useQuery<User[]>({ 
    queryKey: ["/api/users", { role: "teacher" }],
    queryFn: async () => {
      const params = new URLSearchParams({ role: "teacher" });
      const res = await fetch(`/api/users?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    }
  });
  const { data: allStudents = [] } = useQuery<User[]>({ 
    queryKey: ["/api/users", { role: "student" }],
    queryFn: async () => {
      const params = new URLSearchParams({ role: "student" });
      const res = await fetch(`/api/users?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    }
  });
  
  const [selectedCourseIdForDropdowns, setSelectedCourseIdForDropdowns] = useState<string>("");
  
  const { data: courseEnrollments = [] } = useQuery<{ id: string; studentId: string; courseId: string; approvalStatus: string }[]>({
    queryKey: ["/api/courses", selectedCourseIdForDropdowns, "enrollments"],
    queryFn: async () => {
      if (!selectedCourseIdForDropdowns) return [];
      const res = await fetch(`/api/courses/${selectedCourseIdForDropdowns}/enrollments`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!selectedCourseIdForDropdowns,
  });
  
  const { data: courseTeacherAssignments = [] } = useQuery<{ id: string; studentId: string; teacherId: string; courseId: string }[]>({
    queryKey: ["/api/student-teacher-assignments/course", selectedCourseIdForDropdowns],
    queryFn: async () => {
      if (!selectedCourseIdForDropdowns) return [];
      const res = await fetch(`/api/student-teacher-assignments/course/${selectedCourseIdForDropdowns}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!selectedCourseIdForDropdowns,
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthDays = eachDayOfInterval({ start: monthGridStart, end: monthGridEnd });

  useEffect(() => {
    localStorage.setItem("scheduleTeacherFilter", JSON.stringify(selectedTeacherIds));
  }, [selectedTeacherIds]);

  useEffect(() => {
    localStorage.setItem("scheduleStudentFilter", JSON.stringify(selectedStudentFilterIds));
  }, [selectedStudentFilterIds]);

  const filteredSchedules = useMemo(() => {
    let filtered = schedules;
    if (selectedTeacherIds.length > 0) {
      filtered = filtered.filter(schedule => 
        schedule.teacherId && selectedTeacherIds.includes(schedule.teacherId)
      );
    }
    if (selectedStudentFilterIds.length > 0) {
      filtered = filtered.filter(schedule => 
        schedule.studentId && selectedStudentFilterIds.includes(schedule.studentId)
      );
    }
    return filtered;
  }, [schedules, selectedTeacherIds, selectedStudentFilterIds]);

  const schedulesByDay = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    filteredSchedules.forEach(schedule => {
      const scheduleDate = utcToLocal(new Date(schedule.startTime as unknown as string), adminTimezone);
      const dayKey = format(scheduleDate, 'yyyy-MM-dd');
      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }
      map.get(dayKey)!.push(schedule);
    });
    return map;
  }, [filteredSchedules, adminTimezone]);

  const getSchedulesForDay = useCallback((day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    return schedulesByDay.get(dayKey) || [];
  }, [schedulesByDay]);

  const upcomingSchedules = useMemo(() => {
    return filteredSchedules
      .filter(s => new Date(s.startTime as unknown as string) > new Date())
      .sort((a, b) => new Date(a.startTime as unknown as string).getTime() - new Date(b.startTime as unknown as string).getTime())
      .slice(0, 5);
  }, [filteredSchedules]);

  const toggleTeacherFilter = (teacherId: string) => {
    setSelectedTeacherIds(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const clearTeacherFilter = () => {
    setSelectedTeacherIds([]);
  };

  const selectAllTeachers = () => {
    setSelectedTeacherIds(allTeachers.map(t => t.id));
  };

  const studentColors = [
    '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', 
    '#6366F1', '#14B8A6', '#F97316', '#84CC16', '#06B6D4',
    '#A855F7', '#EF4444', '#22C55E', '#0EA5E9', '#D946EF'
  ];

  const studentColorMap = useMemo(() => {
    const map = new Map<string, string>();
    allStudents.forEach((student, index) => {
      map.set(student.id, studentColors[index % studentColors.length] || '#6b7280');
    });
    return map;
  }, [allStudents]);

  const getStudentColor = useCallback((studentId: string): string => {
    return studentColorMap.get(studentId) || '#6b7280';
  }, [studentColorMap]);

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
    setSelectedStudentFilterIds(allStudents.map(s => s.id));
  };

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      courseId: "",
      teacherId: "",
      studentId: "",
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      location: "",
      externalLink: "",
      status: "scheduled",
      notes: "",
      createdBy: "",
    },
  });

  const selectedCourseId = form.watch('courseId');
  
  const availableStudents = useMemo(() => {
    if (!selectedCourseIdForDropdowns) return [];
    
    const enrolledStudentIds = courseEnrollments
      .filter(e => e.approvalStatus === 'approved')
      .map(e => e.studentId);
    
    let students = allStudents.filter(s => enrolledStudentIds.includes(s.id));
    
    if (selectedTeacherId) {
      const assignedStudentIds = courseTeacherAssignments
        .filter(a => a.teacherId === selectedTeacherId)
        .map(a => a.studentId);
      students = students.filter(s => assignedStudentIds.includes(s.id));
    }
    
    return students;
  }, [selectedCourseIdForDropdowns, courseEnrollments, allStudents, selectedTeacherId, courseTeacherAssignments]);
  
  const availableTeachers = useMemo(() => {
    if (!selectedCourseIdForDropdowns) return [];
    
    const selectedCourse = courses.find(c => c.id === selectedCourseIdForDropdowns);
    const teacherIds = new Set<string>();
    
    if (selectedCourse?.teacherId) {
      teacherIds.add(selectedCourse.teacherId);
    }
    
    courseTeacherAssignments.forEach(assignment => {
      if (assignment.teacherId) {
        teacherIds.add(assignment.teacherId);
      }
    });
    
    return allTeachers.filter(t => teacherIds.has(t.id));
  }, [selectedCourseIdForDropdowns, courses, courseTeacherAssignments, allTeachers]);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseIdForDropdowns(courseId);
    setSelectedStudentId("");
    setSelectedStudentTimezone("UTC");
    setSelectedTeacherId("");
    
    const selectedCourse = courses.find(c => c.id === courseId);
    
    if (selectedCourse?.teacherId) {
      form.setValue('teacherId', selectedCourse.teacherId);
      setSelectedTeacherId(selectedCourse.teacherId);
    } else {
      form.setValue('teacherId', '');
    }
    
    form.setValue('studentId', '');
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    form.setValue('studentId', studentId);
    
    const student = allStudents.find(s => s.id === studentId);
    setSelectedStudentTimezone(getUserTimezone(student?.timezone));
    
    const assignment = courseTeacherAssignments.find(a => a.studentId === studentId);
    if (assignment?.teacherId) {
      form.setValue('teacherId', assignment.teacherId);
      setSelectedTeacherId(assignment.teacherId);
    }
  };

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    form.setValue('teacherId', teacherId);
    
    form.setValue('studentId', '');
    setSelectedStudentId("");
    setSelectedStudentTimezone("UTC");
  };

  const createRecurrenceMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      if ((recurrenceFrequency === 'weekly' || recurrenceFrequency === 'biweekly') && selectedWeekdays.length === 0) {
        throw new Error("Please select at least one weekday for weekly/biweekly patterns");
      }
      
      if (recurrenceInterval < 1) {
        throw new Error("Interval must be at least 1");
      }
      
      if (recurrenceEndType === 'after_occurrences' && recurrenceOccurrenceCount < 1) {
        throw new Error("Occurrence count must be at least 1");
      }
      
      if (recurrenceEndType === 'until_date' && !recurrenceEndDate) {
        throw new Error("Please select an end date");
      }
      
      const scheduleTimezone = selectedStudentId ? selectedStudentTimezone : adminTimezone;
      const startTimeUTC = localToUTC(data.startTime, scheduleTimezone);
      const endTimeUTC = localToUTC(data.endTime, scheduleTimezone);
      
      const recurrencePayload = {
        courseId: data.courseId,
        teacherId: data.teacherId,
        title: data.title,
        description: data.description,
        startTime: startTimeUTC.toISOString(),
        endTime: endTimeUTC.toISOString(),
        location: data.location,
        notes: data.notes,
        frequency: recurrenceFrequency,
        interval: recurrenceInterval,
        weekdays: (recurrenceFrequency === 'weekly' || recurrenceFrequency === 'biweekly') 
          ? JSON.stringify(selectedWeekdays) 
          : null,
        monthDay: recurrenceFrequency === 'monthly' 
          ? startTimeUTC.getDate() 
          : null,
        endType: recurrenceEndType,
        endDate: recurrenceEndType === 'until_date' && recurrenceEndDate 
          ? localToUTC(recurrenceEndDate, scheduleTimezone).toISOString() 
          : null,
        occurrenceCount: recurrenceEndType === 'after_occurrences' 
          ? recurrenceOccurrenceCount 
          : null,
        externalLink: applyExternalLinkToAll ? data.externalLink : null,
        createdBy: adminId,
      };
      
      const recurrenceResponse = await apiRequest("POST", "/api/schedule-recurrences", recurrencePayload);
      const recurrence = await recurrenceResponse.json();
      
      await apiRequest("POST", `/api/schedule-recurrences/${recurrence.id}/generate`, {
        fromDate: startTimeUTC.toISOString(),
        maxOccurrences: 50,
      });
      
      return recurrence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsCreateDialogOpen(false);
      form.reset();
      resetRecurrenceState();
      toast({ title: "Recurring schedule created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetRecurrenceState = () => {
    setIsRecurring(false);
    setRecurrenceFrequency('weekly');
    setRecurrenceInterval(1);
    setSelectedWeekdays([1]);
    setRecurrenceEndType('never');
    setRecurrenceEndDate('');
    setRecurrenceOccurrenceCount(10);
    setApplyExternalLinkToAll(false);
  };

  const createMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const scheduleTimezone = selectedStudentId ? selectedStudentTimezone : adminTimezone;
      const startTimeUTC = localToUTC(data.startTime, scheduleTimezone);
      const endTimeUTC = localToUTC(data.endTime, scheduleTimezone);
      const payload = {
        ...data,
        startTime: startTimeUTC.toISOString(),
        endTime: endTimeUTC.toISOString(),
        createdBy: adminId,
      };
      return await apiRequest("POST", "/api/schedules", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsCreateDialogOpen(false);
      form.reset();
      resetRecurrenceState();
      toast({ title: "Schedule created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ScheduleFormData> }) => {
      const payload = {
        ...data,
        ...(data.startTime && { startTime: localToUTC(data.startTime, adminTimezone).toISOString() }),
        ...(data.endTime && { endTime: localToUTC(data.endTime, adminTimezone).toISOString() }),
      };
      return await apiRequest("PATCH", `/api/schedules/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsEditDialogOpen(false);
      setSelectedSchedule(null);
      setIsEditMode(false);
      toast({ title: "Schedule updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsEditDialogOpen(false);
      setSelectedSchedule(null);
      setIsEditMode(false);
      toast({ title: "Schedule deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAllRecurringMutation = useMutation({
    mutationFn: async (recurrenceId: string) => {
      const response = await apiRequest("DELETE", `/api/schedule-recurrences/${recurrenceId}/schedules`);
      return await response.json() as { deletedCount: number; message: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsEditDialogOpen(false);
      setSelectedSchedule(null);
      setIsEditMode(false);
      toast({ title: "All recurring schedules deleted", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateAllRecurringMutation = useMutation({
    mutationFn: async ({ recurrenceId, data }: { recurrenceId: string; data: Partial<ScheduleFormData> }) => {
      const response = await apiRequest("PATCH", `/api/schedule-recurrences/${recurrenceId}/schedules`, data);
      return await response.json() as { updatedCount: number; message: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsEditDialogOpen(false);
      setSelectedSchedule(null);
      setIsEditMode(false);
      setUpdateScope('single');
      toast({ title: "All recurring schedules updated", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: currentSubstitution } = useQuery<{
    id: string;
    scheduleId: string;
    substituteTeacherId: string;
    reason: string;
    assignedBy: string;
    isActive: boolean;
    createdAt: string;
  } | null>({
    queryKey: ["/api/schedules", selectedSchedule?.id, "substitution"],
    queryFn: async () => {
      if (!selectedSchedule?.id) return null;
      const res = await fetch(`/api/schedules/${selectedSchedule.id}/substitution`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!selectedSchedule?.id,
  });

  const createSubstitutionMutation = useMutation({
    mutationFn: async (data: { scheduleId: string; substituteTeacherId: string; reason: string; assignedBy: string }) => {
      return await apiRequest("POST", `/api/schedule-substitutions`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules", selectedSchedule?.id, "substitution"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsSubstituteDialogOpen(false);
      setSubstituteTeacherId("");
      setSubstituteReason("");
      toast({ title: "Substitute teacher assigned successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error assigning substitute", description: error.message, variant: "destructive" });
    },
  });

  const removeSubstitutionMutation = useMutation({
    mutationFn: async (substitutionId: string) => {
      return await apiRequest("DELETE", `/api/schedule-substitutions/${substitutionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules", selectedSchedule?.id, "substitution"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Substitute teacher removed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error removing substitute", description: error.message, variant: "destructive" });
    },
  });

  const { data: communicationRecipients = [], isLoading: isLoadingRecipients } = useQuery<CommunicationRecipient[]>({
    queryKey: ["/api/schedules", selectedSchedule?.id, "communication-recipients"],
    queryFn: async () => {
      if (!selectedSchedule?.id) return [];
      const res = await fetch(`/api/schedules/${selectedSchedule.id}/communication-recipients`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 403) return [];
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: !!selectedSchedule?.id && isCommunicationOpen,
  });

  const sendCommunicationMutation = useMutation({
    mutationFn: async (data: { recipientIds: string[]; communicationType: string; subject: string; message: string }) => {
      if (!selectedSchedule?.id) throw new Error("No schedule selected");
      const res = await apiRequest("POST", `/api/schedules/${selectedSchedule.id}/send-communication`, data);
      return await res.json();
    },
    onSuccess: (data: { success: boolean; partialSuccess: boolean; results: Array<{ recipientId: string; success: boolean; error?: string }> }) => {
      if (data.success) {
        toast({ title: "Communication sent successfully", description: `Sent to ${data.results.length} recipient(s)` });
        setIsCommunicationOpen(false);
        setSelectedRecipientIds([]);
        setCommunicationSubject('');
        setCommunicationMessage('');
      } else if (data.partialSuccess) {
        const successCount = data.results.filter(r => r.success).length;
        const failCount = data.results.filter(r => !r.success).length;
        toast({ 
          title: "Partially sent", 
          description: `Sent to ${successCount} recipient(s), failed for ${failCount}`,
          variant: "default"
        });
      } else {
        const errors = data.results.filter(r => !r.success).map(r => r.error).join(', ');
        toast({ title: "Failed to send", description: errors, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error sending communication", description: error.message, variant: "destructive" });
    },
  });

  const handleSendCommunication = () => {
    if (selectedRecipientIds.length === 0) {
      toast({ title: "Error", description: "Please select at least one recipient", variant: "destructive" });
      return;
    }
    if (!communicationMessage.trim()) {
      toast({ title: "Error", description: "Please enter a message", variant: "destructive" });
      return;
    }
    sendCommunicationMutation.mutate({
      recipientIds: selectedRecipientIds,
      communicationType,
      subject: communicationSubject,
      message: communicationMessage.trim(),
    });
  };

  const isScheduleUpcoming = selectedSchedule ? new Date(selectedSchedule.endTime) > new Date() : false;

  const handleAssignSubstitute = () => {
    if (!selectedSchedule || !substituteTeacherId || !substituteReason.trim()) {
      toast({ title: "Error", description: "Please select a teacher and provide a reason", variant: "destructive" });
      return;
    }
    createSubstitutionMutation.mutate({
      scheduleId: selectedSchedule.id,
      substituteTeacherId,
      reason: substituteReason.trim(),
      assignedBy: adminId,
    });
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

  const getDateLabel = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(currentDate);
    selected.setHours(0, 0, 0, 0);
    const diffDays = Math.round((selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === -1) return "Yesterday";
    if (diffDays === 1) return "Tomorrow";
    return format(currentDate, 'EEEE');
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsEditMode(false);
    setIsEditDialogOpen(true);
    if (schedule.courseId) {
      setSelectedCourseIdForDropdowns(schedule.courseId);
    }
  };

  const handleOpenEditForm = () => {
    if (!selectedSchedule || courses.length === 0) {
      toast({ title: "Error", description: "Courses not loaded yet", variant: "destructive" });
      return;
    }

    const selectedCourse = courses.find(c => c.id === selectedSchedule.courseId);
    if (!selectedCourse) {
      toast({ title: "Error", description: "Course not found", variant: "destructive" });
      return;
    }
    
    setSelectedCourseIdForDropdowns(selectedSchedule.courseId);
    
    form.reset({
      courseId: selectedSchedule.courseId,
      teacherId: selectedSchedule.teacherId,
      studentId: selectedSchedule.studentId || "",
      title: selectedSchedule.title,
      description: selectedSchedule.description || "",
      startTime: formatDateTimeInTimezone(selectedSchedule.startTime, adminTimezone, "yyyy-MM-dd'T'HH:mm"),
      endTime: formatDateTimeInTimezone(selectedSchedule.endTime, adminTimezone, "yyyy-MM-dd'T'HH:mm"),
      location: selectedSchedule.location || "",
      externalLink: selectedSchedule.externalLink || "",
      status: selectedSchedule.status,
      notes: selectedSchedule.notes || "",
      createdBy: selectedSchedule.createdBy,
    });
    setIsEditMode(true);
  };

  const onSubmit = (data: ScheduleFormData) => {
    if (selectedSchedule) {
      if (updateScope === 'all' && selectedSchedule.recurrenceId) {
        updateAllRecurringMutation.mutate({ 
          recurrenceId: selectedSchedule.recurrenceId, 
          data: {
            title: data.title,
            description: data.description,
            location: data.location,
            notes: data.notes,
            externalLink: data.externalLink,
          }
        });
      } else {
        updateMutation.mutate({ id: selectedSchedule.id, data });
      }
    } else if (isRecurring) {
      createRecurrenceMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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

  if (isLoading || coursesLoading || teachersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="bg-gradient-to-r from-[#1F3A5F]/10 via-[#1F3A5F]/5 to-[#2a4a75]/5 relative overflow-hidden border-b border-[#1F3A5F]/10">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, #1F3A5F 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
          <Skeleton className="h-8 w-48 bg-[#1F3A5F]/10 dark:bg-white/20 mb-2" />
          <Skeleton className="h-4 w-32 bg-[#1F3A5F]/5 dark:bg-white/10" />
        </div>
      </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
          <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <Card key={i} className="hidden md:block">
                <CardHeader className="pb-2">
                  <div className="flex flex-col items-center gap-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 min-h-[180px]">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" data-testid="admin-schedule-page">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#1F3A5F]/10 via-[#1F3A5F]/5 to-[#2a4a75]/5 relative overflow-hidden border-b border-[#1F3A5F]/10">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, #1F3A5F 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#2FBF71]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-[#1F3A5F]/10 backdrop-blur-sm">
                  <CalendarDays className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white" data-testid="text-schedule-title">Schedule Management</h1>
              </div>
              <p className="text-[#1F3A5F]/60 dark:text-white/60 text-sm sm:text-base font-medium" data-testid="text-schedule-subtitle">Manage course schedules and events</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (open) {
            setSelectedSchedule(null);
            setIsEditMode(false);
            form.reset();
          } else {
            setSelectedCourseIdForDropdowns("");
            setSelectedStudentTimezone("UTC");
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-schedule" className="w-full md:w-auto bg-[#27a862] hover:bg-[#27a862]/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl p-0 max-h-[90vh]">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>Create New Schedule</DialogTitle>
              <DialogDescription>Add a new class or event to the schedule</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="max-h-[60vh] overflow-y-auto px-6 space-y-4 py-4 dialog-scroll">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleCourseChange(value);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-course">
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="teacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher</FormLabel>
                        <Select
                          onValueChange={handleTeacherChange}
                          value={field.value}
                          disabled={!selectedCourseIdForDropdowns || availableTeachers.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-teacher">
                              <SelectValue placeholder={
                                !selectedCourseIdForDropdowns 
                                  ? "Select a course first" 
                                  : availableTeachers.length === 0
                                    ? "No teachers assigned"
                                    : "Select teacher"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableTeachers.map((teacher) => {
                              const selectedCourse = courses.find(c => c.id === selectedCourseIdForDropdowns);
                              const isDefault = selectedCourse?.teacherId === teacher.id;
                              return (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.name}{isDefault ? " (Default)" : ""}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select
                        onValueChange={handleStudentChange}
                        value={field.value || ""}
                        disabled={!selectedCourseIdForDropdowns || availableStudents.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-student">
                            <SelectValue placeholder={
                              !selectedCourseIdForDropdowns 
                                ? "Select a course first" 
                                : availableStudents.length === 0
                                  ? "No students enrolled in this course"
                                  : "Select student"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableStudents.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.firstName && student.lastName 
                                ? `${student.firstName} ${student.lastName}` 
                                : student.name || student.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {selectedStudentId && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Student Timezone: {selectedStudentTimezone.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Times entered below are in student's local time
                          </span>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Class title" data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Class description" data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input {...field} type="datetime-local" data-testid="input-start-time" />
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
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input {...field} type="datetime-local" data-testid="input-end-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Room number or location" data-testid="input-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="externalLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External Link</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="https://meet.google.com/... or https://zoom.us/..." type="url" data-testid="input-external-link" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Additional notes" data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-3 py-2">
                  <Switch 
                    id="recurring-toggle" 
                    checked={isRecurring} 
                    onCheckedChange={setIsRecurring}
                    data-testid="switch-recurring"
                  />
                  <label htmlFor="recurring-toggle" className="text-sm font-medium cursor-pointer">
                    Make this a recurring schedule
                  </label>
                </div>

                {isRecurring && (
                  <div className="flex items-center gap-3 py-2">
                    <Switch 
                      id="apply-link-all-toggle" 
                      checked={applyExternalLinkToAll} 
                      onCheckedChange={setApplyExternalLinkToAll}
                      disabled={!form.watch('externalLink')}
                      data-testid="switch-apply-link-all"
                    />
                    <label htmlFor="apply-link-all-toggle" className="text-sm font-medium cursor-pointer">Apply given external link to all recurring instances</label>
                  </div>
                )}

                {isRecurring && (
                  <div className="space-y-4 border rounded-md p-4 bg-accent/10" data-testid="section-recurrence-config">
                    <h3 className="text-sm font-semibold">Recurrence Pattern</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Frequency</label>
                        <Select value={recurrenceFrequency} onValueChange={(value: any) => setRecurrenceFrequency(value)}>
                          <SelectTrigger data-testid="select-frequency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Repeat every</label>
                        <Input 
                          type="number" 
                          min="1" 
                          value={recurrenceInterval} 
                          onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                          data-testid="input-interval"
                        />
                      </div>
                    </div>

                    {(recurrenceFrequency === 'weekly' || recurrenceFrequency === 'biweekly') && (
                      <div>
                        <label className="text-sm font-medium">Repeat on</label>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                            <Button
                              key={day}
                              type="button"
                              variant={selectedWeekdays.includes(index) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setSelectedWeekdays(prev => 
                                  prev.includes(index) 
                                    ? prev.filter(d => d !== index)
                                    : [...prev, index].sort()
                                );
                              }}
                              data-testid={`button-weekday-${index}`}
                            >
                              {day}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium">Ends</label>
                      <div className="mt-2 space-y-3">
                        <div className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            id="never" 
                            name="endType" 
                            checked={recurrenceEndType === 'never'}
                            onChange={() => setRecurrenceEndType('never')}
                            data-testid="radio-never"
                          />
                          <label htmlFor="never" className="text-sm cursor-pointer">Never</label>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <input 
                            type="radio" 
                            id="until_date" 
                            name="endType" 
                            checked={recurrenceEndType === 'until_date'}
                            onChange={() => setRecurrenceEndType('until_date')}
                            data-testid="radio-until-date"
                          />
                          <label htmlFor="until_date" className="text-sm cursor-pointer">On</label>
                          <Input 
                            type="date" 
                            value={recurrenceEndDate} 
                            onChange={(e) => setRecurrenceEndDate(e.target.value)}
                            disabled={recurrenceEndType !== 'until_date'}
                            className="w-full md:w-48"
                            data-testid="input-end-date"
                          />
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <input 
                            type="radio" 
                            id="after_occurrences" 
                            name="endType" 
                            checked={recurrenceEndType === 'after_occurrences'}
                            onChange={() => setRecurrenceEndType('after_occurrences')}
                            data-testid="radio-after-occurrences"
                          />
                          <label htmlFor="after_occurrences" className="text-sm cursor-pointer">After</label>
                          <Input 
                            type="number" 
                            min="1" 
                            value={recurrenceOccurrenceCount} 
                            onChange={(e) => setRecurrenceOccurrenceCount(parseInt(e.target.value) || 1)}
                            disabled={recurrenceEndType !== 'after_occurrences'}
                            className="w-20"
                            data-testid="input-occurrence-count"
                          />
                          <span className="text-sm">occurrences</span>
                        </div>
                      </div>
                    </div>

                    {form.watch('startTime') && (
                      <div className="mt-4 p-3 bg-background border rounded-md" data-testid="section-preview">
                        <h4 className="text-sm font-semibold mb-2">Preview: First 10 Occurrences</h4>
                        <div className="space-y-1 text-sm text-muted-foreground max-h-48 overflow-y-auto">
                          {(() => {
                            const startTime = new Date(form.watch('startTime'));
                            const previewDates: Date[] = [];
                            const maxPreview = 10;

                            const endDate = recurrenceEndType === 'until_date' && recurrenceEndDate 
                              ? new Date(recurrenceEndDate) 
                              : null;
                            const maxOccurrences = recurrenceEndType === 'after_occurrences' 
                              ? recurrenceOccurrenceCount 
                              : Infinity;

                            if (recurrenceFrequency === 'daily') {
                              let currentDate = new Date(startTime);
                              for (let i = 0; i < maxOccurrences && previewDates.length < maxPreview; i++) {
                                if (endDate && currentDate > endDate) break;
                                previewDates.push(new Date(currentDate));
                                currentDate = addDays(currentDate, recurrenceInterval);
                              }
                            } else if (recurrenceFrequency === 'weekly' || recurrenceFrequency === 'biweekly') {
                              if (selectedWeekdays.length === 0) {
                                return <div className="text-muted-foreground">Please select at least one weekday</div>;
                              }
                              
                              const weekInterval = recurrenceFrequency === 'biweekly' ? 2 : 1;
                              let weekOffset = 0;
                              
                              while (previewDates.length < maxPreview && weekOffset < maxOccurrences * 4) {
                                const targetWeek = addWeeks(startTime, weekOffset * recurrenceInterval * weekInterval);
                                
                                for (const weekday of selectedWeekdays.sort()) {
                                  const occurrence = new Date(targetWeek);
                                  occurrence.setDate(occurrence.getDate() - occurrence.getDay() + weekday);
                                  
                                  if (occurrence >= startTime && (!endDate || occurrence <= endDate)) {
                                    if (previewDates.length < maxPreview) {
                                      previewDates.push(new Date(occurrence));
                                    }
                                  }
                                }
                                
                                weekOffset++;
                              }
                              
                              previewDates.sort((a, b) => a.getTime() - b.getTime());
                            } else if (recurrenceFrequency === 'monthly') {
                              let currentDate = new Date(startTime);
                              for (let i = 0; i < maxOccurrences && previewDates.length < maxPreview; i++) {
                                if (endDate && currentDate > endDate) break;
                                previewDates.push(new Date(currentDate));
                                currentDate = addMonths(currentDate, recurrenceInterval);
                              }
                            }

                            return previewDates.slice(0, maxPreview).map((date, i) => (
                              <div key={i} className="py-0.5">{format(date, 'EEEE, MMMM d, yyyy')}</div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                </div>
                <DialogFooter className="gap-2 px-6 py-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-create">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || createRecurrenceMutation.isPending || !form.watch('courseId')}
                    data-testid="button-submit-schedule"
                  >
                    {(createMutation.isPending || createRecurrenceMutation.isPending) ? "Creating..." : isRecurring ? "Create Recurring" : "Create Schedule"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Upcoming Schedule - Hero Section */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Schedule
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsUpcomingCollapsed(!isUpcomingCollapsed)}
              data-testid="button-toggle-upcoming"
              className="h-8 w-8 p-0"
            >
              {isUpcomingCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {!isUpcomingCollapsed && (
          <CardContent className="space-y-2">
            {upcomingSchedules.length > 0 ? (
              upcomingSchedules.map((schedule) => {
                const course = courses.find(c => c.id === schedule.courseId);
                const teacher = allTeachers.find(t => t.id === schedule.teacherId);
                const student = allStudents.find(s => s.id === schedule.studentId);
                const startTime = new Date(schedule.startTime);
                const endTime = new Date(schedule.endTime);
                
                return (
                  <div 
                    key={schedule.id}
                    className="p-3 bg-background/70 rounded-lg hover-elevate cursor-pointer flex items-start gap-3"
                    onClick={() => handleEditSchedule(schedule)}
                    data-testid={`upcoming-schedule-${schedule.id}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                        <div className="text-xs font-medium text-primary">{format(startTime, 'MMM')}</div>
                        <div className="text-lg font-bold text-primary">{format(startTime, 'd')}</div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{schedule.title}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeInTimezone(startTime, adminTimezone)} - {formatTimeInTimezone(endTime, adminTimezone)}
                        </span>
                        {schedule.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {schedule.location}
                          </span>
                        )}
                        {teacher && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            {teacher.name}
                          </span>
                        )}
                        {student && (
                          <span className="flex items-center gap-1 text-primary">
                            <UserIcon className="w-3 h-3" />
                            {student.firstName && student.lastName 
                              ? `${student.firstName} ${student.lastName}` 
                              : student.name}
                          </span>
                        )}
                        {schedule.externalLink && new Date(schedule.endTime) > new Date() && schedule.status !== 'completed' && schedule.status !== 'cancelled' && (
                          <Button
                            variant="default"
                            size="sm"
                            asChild
                            className="h-6 px-2 text-xs font-semibold bg-gradient-to-r from-primary to-primary/80 transition-all"
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
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant={getStatusBadgeVariant(getActualStatus(schedule))}>
                        {getActualStatus(schedule)}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(startTime, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-muted-foreground bg-background/50 rounded-lg">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No upcoming classes</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Date and Timezone Row */}
      <div className="flex items-center justify-between font-semibold text-[18px]">
        <span className="text-sm text-muted-foreground font-bold">
          {view === 'day' 
            ? format(currentDate, 'EEEE, MMMM d, yyyy')
            : view === 'week'
            ? `Week ${getISOWeek(weekStart)} • ${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
            : format(currentDate, 'MMMM yyyy')
          }
        </span>
        <span className="text-xs text-muted-foreground">
          {adminTimezone.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Navigation Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Tabs value={view} onValueChange={(v) => setView(v as 'day' | 'week' | 'month')}>
            <TabsList data-testid="tabs-view-toggle">
              <TabsTrigger value="day" data-testid="tab-day" className="px-3">
                <Clock className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Day</span>
              </TabsTrigger>
              <TabsTrigger value="week" data-testid="tab-week" className="px-3">
                <span className="hidden sm:inline">Week</span>
                <span className="sm:hidden">Wk</span>
              </TabsTrigger>
              <TabsTrigger value="month" data-testid="tab-month" className="px-3">
                <span className="hidden sm:inline">Month</span>
                <span className="sm:hidden">Mo</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={goToPrevious} data-testid="button-prev">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-today">
              {getDateLabel()}
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext} data-testid="button-next">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Teacher Filter */}
          <Popover open={isTeacherFilterOpen} onOpenChange={setIsTeacherFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Teachers</span>
                {selectedTeacherIds.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                    {selectedTeacherIds.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search teachers..." />
                <CommandList>
                  <CommandEmpty>No teachers found.</CommandEmpty>
                  <CommandGroup>
                    <div className="flex items-center justify-between px-2 py-1.5 border-b">
                      <Button variant="ghost" size="sm" onClick={selectAllTeachers} className="h-7 text-xs">
                        Select All
                      </Button>
                      <Button variant="ghost" size="sm" onClick={clearTeacherFilter} className="h-7 text-xs">
                        Clear
                      </Button>
                    </div>
                    {allTeachers.map((teacher) => {
                      const color = getTeacherColor(teacher.id, teacher.calendarColor);
                      const isSelected = selectedTeacherIds.includes(teacher.id);
                      return (
                        <CommandItem
                          key={teacher.id}
                          value={teacher.name || teacher.email || teacher.id}
                          onSelect={() => toggleTeacherFilter(teacher.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="truncate">
                              {teacher.firstName && teacher.lastName 
                                ? `${teacher.firstName} ${teacher.lastName}` 
                                : teacher.name || teacher.email}
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

          {/* Student Filter */}
          <Popover open={isStudentFilterOpen} onOpenChange={setIsStudentFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
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
                    {allStudents.map((student) => {
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
        </div>
        
        {/* Date Header */}
        <div className="flex items-center justify-center md:justify-end gap-2">
          {/* Selected teacher badges */}
          {selectedTeacherIds.length > 0 && selectedTeacherIds.length <= 3 && (
            <div className="hidden md:flex items-center gap-1">
              {selectedTeacherIds.map(id => {
                const teacher = allTeachers.find(t => t.id === id);
                if (!teacher) return null;
                const color = getTeacherColor(teacher.id, teacher.calendarColor);
                return (
                  <Badge 
                    key={id} 
                    variant="outline" 
                    className="gap-1 text-xs"
                    style={{ borderColor: color, color: color }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {teacher.firstName || teacher.name?.split(' ')[0] || 'Teacher'}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:opacity-70" 
                      onClick={(e) => { e.stopPropagation(); toggleTeacherFilter(id); }}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
          {/* Selected student badges */}
          {selectedStudentFilterIds.length > 0 && selectedStudentFilterIds.length <= 3 && (
            <div className="hidden md:flex items-center gap-1">
              {selectedStudentFilterIds.map(id => {
                const student = allStudents.find(s => s.id === id);
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
        </div>
      </div>

      {/* Day View - Hourly Time Grid */}
      {view === 'day' && (() => {
        const daySchedules = getSchedulesForDay(currentDate)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const hourHeight = 60;
        
        const getSchedulePosition = (schedule: Schedule) => {
          const utcStart = new Date(schedule.startTime);
          const utcEnd = new Date(schedule.endTime);
          const localStart = utcToLocal(utcStart, adminTimezone);
          const localEnd = utcToLocal(utcEnd, adminTimezone);
          const startHour = localStart.getHours() + localStart.getMinutes() / 60;
          const endHour = localEnd.getHours() + localEnd.getMinutes() / 60;
          const top = startHour * hourHeight;
          const height = Math.max((endHour - startHour) * hourHeight, 30);
          return { top, height };
        };

        // Calculate overlap columns for schedules
        const getScheduleColumns = (schedules: Schedule[]) => {
          const columns: Map<string, { column: number; totalColumns: number }> = new Map();
          const activeSchedules: { id: string; end: number }[] = [];
          
          schedules.forEach(schedule => {
            const start = new Date(schedule.startTime).getTime();
            const end = new Date(schedule.endTime).getTime();
            
            // Remove schedules that have ended
            const stillActive = activeSchedules.filter(s => s.end > start);
            
            // Find first available column
            const usedColumns = new Set(stillActive.map(s => columns.get(s.id)?.column || 0));
            let column = 0;
            while (usedColumns.has(column)) column++;
            
            stillActive.push({ id: schedule.id, end });
            const totalColumns = Math.max(column + 1, ...stillActive.map(s => (columns.get(s.id)?.column || 0) + 1));
            
            // Update all active schedules with new total
            stillActive.forEach(s => {
              const existing = columns.get(s.id);
              if (existing) {
                columns.set(s.id, { ...existing, totalColumns });
              }
            });
            
            columns.set(schedule.id, { column, totalColumns });
            activeSchedules.length = 0;
            activeSchedules.push(...stillActive);
          });
          
          return columns;
        };

        const scheduleColumns = getScheduleColumns(daySchedules);
        
        return (
          <Card className="overflow-hidden">
            <CardContent className="p-0 max-h-[70vh] overflow-y-auto">
              <div className="flex">
                <div className="w-16 md:w-20 flex-shrink-0 border-r bg-muted/30 sticky left-0">
                  {hours.map((hour) => (
                    <div 
                      key={hour} 
                      className="border-b flex items-start justify-end pr-2 pt-1 text-xs md:text-sm text-muted-foreground"
                      style={{ height: hourHeight }}
                    >
                      {format(new Date().setHours(hour, 0), 'h a')}
                    </div>
                  ))}
                </div>
                
                <div className="flex-1 relative">
                  {hours.map((hour) => (
                    <div 
                      key={hour} 
                      className="border-b border-dashed"
                      style={{ height: hourHeight }}
                    />
                  ))}
                  
                  {daySchedules.map((schedule) => {
                    const teacher = allTeachers.find(t => t.id === schedule.teacherId);
                    const course = courses.find(c => c.id === schedule.courseId);
                    const student = allStudents.find(s => s.id === schedule.studentId);
                    const teacherColor = teacher ? getTeacherColor(teacher.id, teacher.calendarColor) : '#6b7280';
                    const studentColor = schedule.studentId ? getStudentColor(schedule.studentId) : '#6b7280';
                    const { top, height } = getSchedulePosition(schedule);
                    const startTime = new Date(schedule.startTime);
                    const endTime = new Date(schedule.endTime);
                    
                    const columnInfo = scheduleColumns.get(schedule.id) || { column: 0, totalColumns: 1 };
                    const columnWidth = 100 / columnInfo.totalColumns;
                    const leftPercent = columnInfo.column * columnWidth;
                    
                    return (
                      <div
                        key={schedule.id}
                        className="absolute rounded-md cursor-pointer transition-all hover:shadow-lg hover:z-10 overflow-hidden"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `calc(${leftPercent}% + 4px)`,
                          width: `calc(${columnWidth}% - 8px)`,
                          backgroundColor: `${teacherColor}30`,
                          borderRight: `6px solid ${studentColor}`,
                        }}
                        onClick={() => handleEditSchedule(schedule)}
                        data-testid={`day-schedule-${schedule.id}`}
                      >
                        <div className="p-1.5 md:p-2 h-full overflow-hidden">
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs md:text-sm truncate" style={{ color: teacherColor }}>
                                {schedule.title}
                              </p>
                              {height >= 50 && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {formatTimeInTimezone(startTime, adminTimezone)} - {formatTimeInTimezone(endTime, adminTimezone)}
                                </p>
                              )}
                              {height >= 70 && teacher && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {teacher.name}
                                </p>
                              )}
                              {height >= 90 && course && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {course.title}
                                </p>
                              )}
                              {height >= 110 && student && (
                                <p className="text-xs text-muted-foreground truncate">
                                  Student: {student.firstName || student.name}
                                </p>
                              )}
                            </div>
                            <Badge 
                              variant={getStatusBadgeVariant(getActualStatus(schedule))} 
                              className="text-[10px] px-1 py-0 h-4 flex-shrink-0"
                            >
                              {getActualStatus(schedule)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {daySchedules.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Calendar className="mx-auto h-10 w-10 mb-2 opacity-50" />
                        <p className="text-sm">No classes scheduled</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Week Grid */}
      {view === 'week' && (
        <>
          {/* Desktop Week View */}
          <div className="hidden md:grid gap-3 md:grid-cols-7">
            {weekDays.map((day, index) => {
              const daySchedules = getSchedulesForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <Card 
                  key={index} 
                  className={`${isToday ? 'ring-2 ring-primary border-primary/40' : ''}`}
                  data-testid={`day-${format(day, 'yyyy-MM-dd')}`}
                >
                  <CardHeader className="pb-2 px-3">
                    <CardTitle className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          {format(day, 'EEE')}
                        </span>
                        <span className={`text-lg font-bold mt-1 ${isToday ? 'text-primary' : ''}`}>
                          {format(day, 'd')}
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 min-h-[180px] overflow-hidden px-2">
                    {daySchedules.length === 0 ? (
                      <div className="text-center text-muted-foreground text-xs py-6">
                        No classes
                      </div>
                    ) : (
                      daySchedules
                        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                        .map((schedule) => {
                          const teacher = allTeachers.find(t => t.id === schedule.teacherId);
                          const teacherColor = teacher ? getTeacherColor(teacher.id, teacher.calendarColor) : '#6b7280';
                          const studentColor = schedule.studentId ? getStudentColor(schedule.studentId) : '#6b7280';
                          return (
                            <div 
                              key={schedule.id}
                              className="p-2 rounded-lg cursor-pointer transition-all hover-elevate overflow-hidden"
                              onClick={() => handleEditSchedule(schedule)}
                              data-testid={`schedule-${schedule.id}`}
                              style={{ 
                                backgroundColor: `${teacherColor}25`,
                                borderRight: `5px solid ${studentColor}`
                              }}
                            >
                              <div className="flex items-start justify-between mb-1 gap-1 min-w-0">
                                <div className="font-semibold text-xs line-clamp-2 flex-1 min-w-0">
                                  {schedule.title}
                                </div>
                                {new Date(schedule.endTime) <= new Date() && (
                                  <Badge variant="secondary" className="text-[10px] flex-shrink-0 whitespace-nowrap px-1">
                                    Done
                                  </Badge>
                                )}
                              </div>
                              {teacher && (
                                <div className="text-[10px] text-muted-foreground mt-1 truncate flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: teacherColor }} />
                                  {teacher.name}
                                </div>
                              )}
                              <div className="text-[10px] text-muted-foreground mt-1">
                                {formatTimeInTimezone(schedule.startTime, adminTimezone, 'HH:mm')} - {formatTimeInTimezone(schedule.endTime, adminTimezone, 'HH:mm')}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Mobile Week View - Scrollable List */}
          <div className="md:hidden space-y-3">
            {weekDays.map((day, index) => {
              const daySchedules = getSchedulesForDay(day);
              const isToday = isSameDay(day, new Date());
              
              if (daySchedules.length === 0 && !isToday) return null;
              
              return (
                <Card 
                  key={index}
                  className={`${isToday ? 'ring-2 ring-primary border-primary/40' : ''}`}
                  data-testid={`mobile-day-${format(day, 'yyyy-MM-dd')}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className={isToday ? 'text-primary' : ''}>
                        {format(day, 'EEEE, MMM d')}
                      </span>
                      {isToday && (
                        <Badge variant="default" className="text-xs">Today</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {daySchedules.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-4">
                        No classes scheduled
                      </div>
                    ) : (
                      daySchedules
                        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                        .map((schedule) => {
                          const teacher = allTeachers.find(t => t.id === schedule.teacherId);
                          const teacherColor = teacher ? getTeacherColor(teacher.id, teacher.calendarColor) : '#6b7280';
                          const studentColor = schedule.studentId ? getStudentColor(schedule.studentId) : '#6b7280';
                          return (
                            <div 
                              key={schedule.id}
                              className="p-3 rounded-lg cursor-pointer transition-all hover-elevate"
                              onClick={() => handleEditSchedule(schedule)}
                              data-testid={`schedule-${schedule.id}`}
                              style={{ 
                                backgroundColor: `${teacherColor}25`,
                                borderRight: `6px solid ${studentColor}`
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm line-clamp-1">{schedule.title}</div>
                                  {teacher && (
                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: teacherColor }} />
                                      {teacher.name}
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTimeInTimezone(schedule.startTime, adminTimezone)} - {formatTimeInTimezone(schedule.endTime, adminTimezone)}
                                  </div>
                                </div>
                                <Badge variant={getStatusBadgeVariant(getActualStatus(schedule))} className="flex-shrink-0">
                                  {getActualStatus(schedule)}
                                </Badge>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Month Grid */}
      {view === 'month' && (
        <>
          {/* Desktop Month View */}
          <div className="hidden md:block">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
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
                    data-testid={`day-cell-${format(day, "yyyy-MM-dd")}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {daySchedules.slice(0, 3).map(schedule => {
                        const teacher = allTeachers.find(t => t.id === schedule.teacherId);
                        const teacherColor = teacher ? getTeacherColor(teacher.id, teacher.calendarColor) : '#6b7280';
                        const studentColor = schedule.studentId ? getStudentColor(schedule.studentId) : '#6b7280';
                        return (
                          <div
                            key={schedule.id}
                            className="text-xs p-1 rounded hover-elevate cursor-pointer group"
                            onClick={() => handleEditSchedule(schedule)}
                            data-testid={`schedule-${schedule.id}`}
                            style={{ 
                              backgroundColor: `${teacherColor}25`,
                              borderRight: `5px solid ${studentColor}`
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <div className="font-medium truncate text-foreground flex-1">{schedule.title}</div>
                              {new Date(schedule.endTime) <= new Date() && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                  Done
                                </Badge>
                              )}
                            </div>
                            {teacher && (
                              <div className="text-muted-foreground truncate flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: teacherColor }} />
                                {teacher.name}
                              </div>
                            )}
                            <div className="text-muted-foreground truncate">
                              {formatTimeInTimezone(schedule.startTime, adminTimezone)}
                            </div>
                          </div>
                        );
                      })}
                      {daySchedules.length > 3 && (
                        <Popover 
                          open={expandedDayPopover === format(day, 'yyyy-MM-dd')} 
                          onOpenChange={(open) => setExpandedDayPopover(open ? format(day, 'yyyy-MM-dd') : null)}
                        >
                          <PopoverTrigger asChild>
                            <button 
                              className="text-xs text-primary font-medium text-center w-full hover:underline cursor-pointer"
                              data-testid={`more-schedules-${format(day, 'yyyy-MM-dd')}`}
                            >
                              +{daySchedules.length - 3} more
                            </button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-80 p-0 max-h-[400px] overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 ease-out" 
                            align="start"
                            side="bottom"
                          >
                            <div className="bg-primary/5 px-3 py-2 border-b">
                              <div className="font-semibold text-sm">{format(day, 'EEEE, MMMM d')}</div>
                              <div className="text-xs text-muted-foreground mb-2">{daySchedules.length} schedules</div>
                              {(() => {
                                const uniqueTeachers = new Map<string, { name: string; color: string }>();
                                const uniqueStudents = new Map<string, { name: string; color: string }>();
                                daySchedules.forEach(schedule => {
                                  const teacher = allTeachers.find(t => t.id === schedule.teacherId);
                                  if (teacher && !uniqueTeachers.has(teacher.id)) {
                                    uniqueTeachers.set(teacher.id, { 
                                      name: teacher.name || 'Unknown', 
                                      color: getTeacherColor(teacher.id, teacher.calendarColor) 
                                    });
                                  }
                                  if (schedule.studentId) {
                                    const student = allStudents.find(s => s.id === schedule.studentId);
                                    if (student && !uniqueStudents.has(student.id)) {
                                      uniqueStudents.set(student.id, { 
                                        name: student.firstName || student.name || 'Unknown', 
                                        color: getStudentColor(schedule.studentId) 
                                      });
                                    }
                                  }
                                });
                                return (
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                                    {Array.from(uniqueTeachers.values()).map((t, i) => (
                                      <span key={`t-${i}`} className="flex items-center gap-1 text-muted-foreground">
                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }}></span>
                                        {t.name}
                                      </span>
                                    ))}
                                    {Array.from(uniqueStudents.values()).map((s, i) => (
                                      <span key={`s-${i}`} className="flex items-center gap-1 text-muted-foreground">
                                        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }}></span>
                                        {s.name}
                                      </span>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="max-h-[320px] overflow-y-auto p-2 space-y-1.5 popover-scroll">
                              {daySchedules.map(schedule => {
                                const teacher = allTeachers.find(t => t.id === schedule.teacherId);
                                const student = allStudents.find(s => s.id === schedule.studentId);
                                const teacherColor = teacher ? getTeacherColor(teacher.id, teacher.calendarColor) : '#6b7280';
                                const studentColor = schedule.studentId ? getStudentColor(schedule.studentId) : '#6b7280';
                                const isPast = new Date(schedule.endTime) <= new Date();
                                return (
                                  <div
                                    key={schedule.id}
                                    className="text-xs p-2 rounded hover-elevate cursor-pointer"
                                    onClick={() => {
                                      setExpandedDayPopover(null);
                                      handleEditSchedule(schedule);
                                    }}
                                    style={{ 
                                      backgroundColor: `${teacherColor}30`,
                                      borderRight: `4px solid ${studentColor}`
                                    }}
                                  >
                                    <div className="flex items-center gap-1">
                                      <div className="font-medium truncate text-foreground flex-1">{schedule.title}</div>
                                      {isPast && (
                                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                          Done
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                      {teacher && (
                                        <div className="flex items-center gap-1 min-w-0">
                                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: teacherColor }} />
                                          <span className="text-muted-foreground truncate">{teacher.name}</span>
                                        </div>
                                      )}
                                      {student && (
                                        <div className="flex items-center gap-1 min-w-0">
                                          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: studentColor }} />
                                          <span className="text-muted-foreground truncate">{student.firstName || student.name}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-muted-foreground mt-1 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTimeInTimezone(schedule.startTime, adminTimezone)} - {formatTimeInTimezone(schedule.endTime, adminTimezone)}
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
          </div>

          {/* Mobile Month View - List format for days with events */}
          <div className="md:hidden space-y-3">
            {monthDays
              .filter(day => isSameMonth(day, currentDate) && (getSchedulesForDay(day).length > 0 || isSameDay(day, new Date())))
              .map((day, index) => {
                const daySchedules = getSchedulesForDay(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <Card 
                    key={index}
                    className={`${isToday ? 'ring-2 ring-primary border-primary/40' : ''}`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className={isToday ? 'text-primary' : ''}>
                          {format(day, 'EEEE, MMM d')}
                        </span>
                        {isToday && (
                          <Badge variant="default" className="text-xs">Today</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {daySchedules.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-4">
                          No classes scheduled
                        </div>
                      ) : (
                        daySchedules
                          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                          .map((schedule) => {
                            const teacher = allTeachers.find(t => t.id === schedule.teacherId);
                            const teacherColor = teacher ? getTeacherColor(teacher.id, teacher.calendarColor) : '#6b7280';
                            const studentColor = schedule.studentId ? getStudentColor(schedule.studentId) : '#6b7280';
                            return (
                              <div 
                                key={schedule.id}
                                className="p-3 rounded-lg cursor-pointer transition-all hover-elevate"
                                onClick={() => handleEditSchedule(schedule)}
                                data-testid={`schedule-${schedule.id}`}
                                style={{ 
                                  backgroundColor: `${teacherColor}25`,
                                  borderRight: `6px solid ${studentColor}`
                                }}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm line-clamp-1">{schedule.title}</div>
                                    {teacher && (
                                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: teacherColor }} />
                                        {teacher.name}
                                      </div>
                                    )}
                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTimeInTimezone(schedule.startTime, adminTimezone)} - {formatTimeInTimezone(schedule.endTime, adminTimezone)}
                                    </div>
                                  </div>
                                  <Badge variant={getStatusBadgeVariant(getActualStatus(schedule))} className="flex-shrink-0">
                                    {getActualStatus(schedule)}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            {monthDays.filter(day => isSameMonth(day, currentDate) && getSchedulesForDay(day).length > 0).length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No schedules this month</h3>
                  <p className="text-sm text-muted-foreground">
                    No classes scheduled for {format(currentDate, 'MMMM yyyy')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Edit/View Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setIsEditMode(false);
          setUpdateScope('single');
          setSelectedCourseIdForDropdowns("");
          setIsCommunicationOpen(false);
          setSelectedRecipientIds([]);
          setCommunicationSubject('');
          setCommunicationMessage('');
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl p-0 max-h-[90vh] flex flex-col overflow-hidden">
          {selectedSchedule && (
            <>
              {!isEditMode ? (
                <div className="flex flex-col h-full max-h-[90vh]">
                  <DialogHeader className="px-6 pt-6 flex-shrink-0">
                    <DialogTitle>Schedule Details</DialogTitle>
                    <DialogDescription>
                      {courses.find(c => c.id === selectedSchedule.courseId)?.description || 'Course details'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Communication Bar - Top position with dropdown */}
                  {isScheduleUpcoming && (
                    <div className="px-6 pt-4">
                      <div className="relative">
                        {/* Compact trigger bar */}
                        <button
                          onClick={() => setIsCommunicationOpen(!isCommunicationOpen)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all ${
                            isCommunicationOpen 
                              ? 'bg-primary/10 border-primary/30 shadow-sm' 
                              : 'bg-gradient-to-r from-primary/5 to-transparent border-primary/10 hover:border-primary/20 hover:bg-primary/10'
                          }`}
                          data-testid="button-toggle-communication"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                              isCommunicationOpen ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                            }`}>
                              <Send className={`w-3.5 h-3.5 ${isCommunicationOpen ? '' : 'text-primary'}`} />
                            </div>
                            <span className="font-medium text-sm">Send to Participants</span>
                            {selectedRecipientIds.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {selectedRecipientIds.length} selected
                              </Badge>
                            )}
                          </div>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
                            isCommunicationOpen ? 'rotate-180' : ''
                          }`} />
                        </button>

                        {/* Dropdown panel */}
                        {isCommunicationOpen && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border bg-card shadow-lg overflow-hidden">
                            {/* Channel tabs */}
                            <div className="flex items-center gap-1 p-2 bg-muted/30 border-b">
                              <button
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                  communicationType === 'message' 
                                    ? 'bg-primary text-primary-foreground shadow-sm' 
                                    : 'text-muted-foreground hover:text-foreground hover:bg-background'
                                }`}
                                onClick={() => handleCommunicationTypeChange('message')}
                                data-testid="button-type-message"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Message
                              </button>
                              <button
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                  communicationType === 'email' 
                                    ? 'bg-primary text-primary-foreground shadow-sm' 
                                    : 'text-muted-foreground hover:text-foreground hover:bg-background'
                                }`}
                                onClick={() => handleCommunicationTypeChange('email')}
                                data-testid="button-type-email"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                Email
                              </button>
                              <button
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                  communicationType === 'sms' 
                                    ? 'bg-primary text-primary-foreground shadow-sm' 
                                    : 'text-muted-foreground hover:text-foreground hover:bg-background'
                                }`}
                                onClick={() => handleCommunicationTypeChange('sms')}
                                data-testid="button-type-sms"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                SMS
                              </button>
                            </div>

                            {/* Recipients */}
                            <div className="p-3 border-b">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground">Recipients</span>
                                {communicationRecipients.length > 0 && (
                                  <button 
                                    className="text-xs text-primary hover:underline"
                                    onClick={() => {
                                      const validRecipients = communicationRecipients.filter(r => 
                                        (communicationType === 'message') ||
                                        (communicationType === 'email' && !!r.email) ||
                                        (communicationType === 'sms' && !!r.phone)
                                      );
                                      if (selectedRecipientIds.length === validRecipients.length) {
                                        setSelectedRecipientIds([]);
                                      } else {
                                        setSelectedRecipientIds(validRecipients.map(r => r.id));
                                      }
                                    }}
                                  >
                                    {selectedRecipientIds.length === communicationRecipients.filter(r => 
                                      (communicationType === 'message') ||
                                      (communicationType === 'email' && !!r.email) ||
                                      (communicationType === 'sms' && !!r.phone)
                                    ).length ? 'Clear all' : 'Select all'}
                                  </button>
                                )}
                              </div>
                              {isLoadingRecipients ? (
                                <div className="flex items-center gap-2 py-2">
                                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">Loading...</span>
                                </div>
                              ) : communicationRecipients.length === 0 ? (
                                <div className="py-2 text-sm text-muted-foreground">No participants</div>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                  {communicationRecipients.map((recipient) => {
                                    const isSelected = selectedRecipientIds.includes(recipient.id);
                                    const canReceive = 
                                      (communicationType === 'message') ||
                                      (communicationType === 'email' && !!recipient.email) ||
                                      (communicationType === 'sms' && !!recipient.phone);
                                    
                                    const typeColors: Record<string, string> = {
                                      teacher: 'bg-blue-500',
                                      student: 'bg-emerald-500',
                                      parent: 'bg-amber-500'
                                    };
                                    
                                    return (
                                      <button
                                        key={recipient.id}
                                        disabled={!canReceive}
                                        onClick={() => {
                                          if (!canReceive) return;
                                          setSelectedRecipientIds(prev => 
                                            isSelected 
                                              ? prev.filter(id => id !== recipient.id)
                                              : [...prev, recipient.id]
                                          );
                                        }}
                                        className={`
                                          inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all border
                                          ${!canReceive 
                                            ? 'opacity-40 cursor-not-allowed bg-muted border-transparent' 
                                            : isSelected 
                                              ? 'bg-primary text-primary-foreground border-primary' 
                                              : 'bg-background border-border hover:border-primary/50'
                                          }
                                        `}
                                        title={!canReceive 
                                          ? `No ${communicationType === 'email' ? 'email' : 'phone'}` 
                                          : undefined
                                        }
                                        data-testid={`recipient-${recipient.id}`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${typeColors[recipient.type] || 'bg-gray-500'}`} />
                                        {recipient.name}
                                        {isSelected && canReceive && <X className="w-3 h-3" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Message composition */}
                            <div className="p-3 space-y-2">
                              {communicationType === 'email' && (
                                <Input
                                  placeholder="Subject (optional)"
                                  value={communicationSubject}
                                  onChange={(e) => setCommunicationSubject(e.target.value)}
                                  className="h-8 text-sm"
                                  data-testid="input-subject"
                                />
                              )}
                              <div className="flex gap-2">
                                <Textarea
                                  placeholder={`Type ${communicationType === 'sms' ? 'SMS' : 'message'}...`}
                                  value={communicationMessage}
                                  onChange={(e) => setCommunicationMessage(e.target.value)}
                                  rows={2}
                                  className="flex-1 text-sm resize-none min-h-[50px]"
                                  data-testid="input-message"
                                />
                                <Button
                                  onClick={handleSendCommunication}
                                  disabled={sendCommunicationMutation.isPending || selectedRecipientIds.length === 0 || !communicationMessage.trim()}
                                  className="self-end"
                                  size="sm"
                                  data-testid="button-send-communication"
                                >
                                  {sendCommunicationMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto px-6 py-4 dialog-scroll min-h-0">
                  <div className="space-y-4 md:space-y-6">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold flex-1 min-w-0">{selectedSchedule.title}</h3>
                        <div className="flex gap-2 flex-wrap flex-shrink-0 justify-end">
                          {new Date(selectedSchedule.endTime) <= new Date() && (
                            <Badge variant="secondary" className="text-sm">
                              Finished
                            </Badge>
                          )}
                          <Badge variant={getStatusBadgeVariant(selectedSchedule.status)} className="text-sm">
                            {selectedSchedule.status}
                          </Badge>
                        </div>
                      </div>
                      {selectedSchedule.description && (
                        <p className="text-sm text-muted-foreground">{selectedSchedule.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Calendar className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Date</p>
                            <p className="font-semibold text-sm md:text-base">
                              {formatDateTimeInTimezone(selectedSchedule.startTime, adminTimezone, 'EEEE, MMMM d, yyyy')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Clock className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Time</p>
                            <p className="font-semibold text-sm md:text-base">
                              {formatTimeInTimezone(selectedSchedule.startTime, adminTimezone)} - {formatTimeInTimezone(selectedSchedule.endTime, adminTimezone)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <UserIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Teacher</p>
                            <p className="font-semibold text-sm md:text-base">
                              {allTeachers.find(t => t.id === selectedSchedule.teacherId)?.name || 'Unknown'}
                              {currentSubstitution && (
                                <span className="text-muted-foreground font-normal ml-1">(Regular)</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {selectedSchedule.studentId && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Student</p>
                              <p className="font-semibold text-sm md:text-base">
                                {allStudents.find(s => s.id === selectedSchedule.studentId)?.name || 
                                 (() => {
                                   const student = allStudents.find(s => s.id === selectedSchedule.studentId);
                                   return student?.firstName && student?.lastName 
                                     ? `${student.firstName} ${student.lastName}` 
                                     : 'Unknown';
                                 })()}
                              </p>
                            </div>
                          </div>
                        )}

                        {currentSubstitution ? (
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                              <UserRoundCog className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Substitute Teacher</p>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm md:text-base text-amber-600 dark:text-amber-400">
                                  {allTeachers.find(t => t.id === currentSubstitution.substituteTeacherId)?.name || 'Unknown'}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Remove substitute teacher assignment?")) {
                                      removeSubstitutionMutation.mutate(currentSubstitution.id);
                                    }
                                  }}
                                  disabled={removeSubstitutionMutation.isPending}
                                  className="h-6 w-6 p-0"
                                  data-testid="button-remove-substitute"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{currentSubstitution.reason}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <UserRoundCog className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Substitute</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsSubstituteDialogOpen(true)}
                                disabled={new Date(selectedSchedule.endTime) <= new Date() || selectedSchedule.status === 'completed' || selectedSchedule.status === 'cancelled'}
                                className="mt-1"
                                data-testid="button-assign-substitute"
                              >
                                <UserRoundCog className="w-4 h-4 mr-2" />
                                Assign Substitute
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedSchedule.location && (
                      <div className="flex items-center gap-3 pt-2 border-t">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="font-semibold text-sm md:text-base">{selectedSchedule.location}</p>
                        </div>
                      </div>
                    )}

                    {selectedSchedule.externalLink && (
                      <div className="flex items-center gap-3 pt-2 border-t">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <LinkIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">External Link</p>
                          {new Date(selectedSchedule.endTime) <= new Date() || selectedSchedule.status === 'completed' || selectedSchedule.status === 'cancelled' ? (
                            <p className="text-sm text-muted-foreground">Session ended</p>
                          ) : (
                            <a 
                              href={selectedSchedule.externalLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm md:text-base font-medium"
                            >
                              Join Class
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedSchedule.recurrenceId && (
                      <div className="flex items-center gap-3 pt-2 border-t">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Repeat className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Recurring Schedule</p>
                          <p className="font-semibold text-sm">This is part of a recurring series</p>
                        </div>
                      </div>
                    )}

                    {selectedSchedule.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm">{selectedSchedule.notes}</p>
                      </div>
                    )}

                  </div>
                  </div>
                  <DialogFooter className="gap-2 px-6 py-4 border-t flex-wrap flex-shrink-0">
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this schedule?")) {
                          deleteMutation.mutate(selectedSchedule.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      data-testid="button-delete-schedule"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                    {selectedSchedule.recurrenceId && (
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          if (confirm("Are you sure you want to delete ALL recurring schedules in this series? This will remove all past and future occurrences and cannot be undone.")) {
                            deleteAllRecurringMutation.mutate(selectedSchedule.recurrenceId!);
                          }
                        }}
                        disabled={deleteAllRecurringMutation.isPending || new Date(selectedSchedule.endTime) <= new Date() || selectedSchedule.status === 'completed' || selectedSchedule.status === 'cancelled'}
                        data-testid="button-delete-all-recurring"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All Recurring
                      </Button>
                    )}
                    <div className="flex-1" />
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-close-details">
                      Close
                    </Button>
                    <Button 
                      onClick={handleOpenEditForm} 
                      disabled={new Date(selectedSchedule.endTime) <= new Date() || selectedSchedule.status === 'completed' || selectedSchedule.status === 'cancelled'}
                      data-testid="button-open-edit"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Update
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="flex flex-col h-full max-h-[90vh] overflow-hidden">
                  <DialogHeader className="px-6 pt-6 flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                      Edit Schedule
                      {selectedSchedule.recurrenceId && (
                        <Badge variant="outline" className="text-xs font-normal flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          Recurring
                        </Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription>Update schedule details</DialogDescription>
                  </DialogHeader>
                  
                  {/* Update Scope Selector for recurring schedules */}
                  {selectedSchedule.recurrenceId && (
                    <div className="px-6 pt-4">
                      <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/5 to-transparent p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CalendarDays className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">Update Scope</h4>
                            <p className="text-xs text-muted-foreground">Choose what to update</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Update scope selection">
                          <button
                            type="button"
                            role="radio"
                            aria-checked={updateScope === 'single'}
                            onClick={() => setUpdateScope('single')}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                              updateScope === 'single'
                                ? 'border-primary bg-primary/10 shadow-sm'
                                : 'border-border bg-background hover:border-primary/30 hover:bg-muted/50'
                            }`}
                            data-testid="button-update-single"
                          >
                            <Calendar className={`w-5 h-5 mb-1.5 ${updateScope === 'single' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={`text-sm font-medium ${updateScope === 'single' ? 'text-primary' : ''}`}>This Event Only</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">Update just this schedule</span>
                          </button>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={updateScope === 'all'}
                            onClick={() => setUpdateScope('all')}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                              updateScope === 'all'
                                ? 'border-primary bg-primary/10 shadow-sm'
                                : 'border-border bg-background hover:border-primary/30 hover:bg-muted/50'
                            }`}
                            data-testid="button-update-all"
                            aria-describedby={updateScope === 'all' ? 'scope-all-warning' : undefined}
                          >
                            <CalendarDays className={`w-5 h-5 mb-1.5 ${updateScope === 'all' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={`text-sm font-medium ${updateScope === 'all' ? 'text-primary' : ''}`}>All Events</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">Update entire series</span>
                          </button>
                        </div>
                        {updateScope === 'all' && (
                          <div id="scope-all-warning" className="mt-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2">
                            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>Only title, description, location, notes, and external link will be updated for all events in this series.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-6 space-y-4 py-4 dialog-scroll min-h-0">
                    <div className="mb-2">
                      <Badge variant={getStatusBadgeVariant(selectedSchedule.status)} data-testid="badge-status">
                        {selectedSchedule.status}
                      </Badge>
                    </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="courseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleCourseChange(value);
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-edit-course">
                                <SelectValue placeholder="Select course" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="teacherId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teacher</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={!selectedCourseIdForDropdowns || availableTeachers.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-edit-teacher">
                                <SelectValue placeholder={
                                  teachersLoading 
                                    ? "Loading teachers..."
                                    : !selectedCourseIdForDropdowns
                                      ? "Select a course first"
                                      : availableTeachers.length === 0
                                        ? "No teachers assigned"
                                        : "Select teacher"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableTeachers.map((teacher) => {
                                const selectedCourse = courses.find(c => c.id === selectedCourseIdForDropdowns);
                                const isDefault = selectedCourse?.teacherId === teacher.id;
                                return (
                                  <SelectItem key={teacher.id} value={teacher.id}>
                                    {teacher.name}{isDefault ? " (Default)" : ""}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          disabled={!selectedCourseIdForDropdowns || availableStudents.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-student">
                              <SelectValue placeholder={
                                !selectedCourseIdForDropdowns 
                                  ? "Select a course first" 
                                  : availableStudents.length === 0
                                    ? "No students enrolled in this course"
                                    : "Select student"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableStudents.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.firstName && student.lastName 
                                  ? `${student.firstName} ${student.lastName}` 
                                  : student.name || student.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Class title" data-testid="input-edit-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} placeholder="Class description" data-testid="input-edit-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input {...field} type="datetime-local" data-testid="input-edit-start-time" />
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
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input {...field} type="datetime-local" data-testid="input-edit-end-time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Room number or location" data-testid="input-edit-location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="externalLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>External Link</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="https://meet.google.com/... or https://zoom.us/..." type="url" data-testid="input-edit-external-link" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="rescheduled">Rescheduled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} placeholder="Additional notes" data-testid="input-edit-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>

                  <DialogFooter className="gap-2 px-6 py-4 border-t flex-shrink-0">
                    <div className="flex-1" />
                    <Button type="button" variant="outline" onClick={() => setIsEditMode(false)} data-testid="button-back-to-view">
                      Back
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending || updateAllRecurringMutation.isPending || !form.watch('courseId')} data-testid="button-save-schedule">
                      {(updateMutation.isPending || updateAllRecurringMutation.isPending) 
                        ? "Saving..." 
                        : updateScope === 'all' && selectedSchedule?.recurrenceId
                          ? "Update All Events"
                          : "Save Changes"
                      }
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Substitute Teacher Assignment Dialog */}
      <Dialog open={isSubstituteDialogOpen} onOpenChange={(open) => {
        setIsSubstituteDialogOpen(open);
        if (!open) {
          setSubstituteTeacherId("");
          setSubstituteReason("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRoundCog className="w-5 h-5" />
              Assign Substitute Teacher
            </DialogTitle>
            <DialogDescription>
              Assign a substitute teacher for this class session. The substitute will conduct this class instead of the regular teacher.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Substitute Teacher</label>
              <Select value={substituteTeacherId} onValueChange={setSubstituteTeacherId}>
                <SelectTrigger data-testid="select-substitute-teacher">
                  <SelectValue placeholder="Choose a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {allTeachers
                    .filter(t => t.id !== selectedSchedule?.teacherId)
                    .map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Substitution</label>
              <Textarea
                placeholder="e.g., Regular teacher is on leave, medical emergency..."
                value={substituteReason}
                onChange={(e) => setSubstituteReason(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-substitute-reason"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setIsSubstituteDialogOpen(false);
              setSubstituteTeacherId("");
              setSubstituteReason("");
            }} data-testid="button-cancel-substitute">
              Cancel
            </Button>
            <Button
              onClick={handleAssignSubstitute}
              disabled={!substituteTeacherId || !substituteReason.trim() || createSubstitutionMutation.isPending}
              data-testid="button-confirm-substitute"
            >
              {createSubstitutionMutation.isPending ? "Assigning..." : "Assign Substitute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
