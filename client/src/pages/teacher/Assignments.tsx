import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  FileText, 
  Calendar, 
  Users, 
  CheckCircle,
  Clock,
  History,
  CalendarClock,
  Filter
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AssignmentWithStats } from "@shared/schema";
import { format, startOfDay, addDays } from "date-fns";
import { useState, useEffect, useMemo } from "react";
import { TeacherGradingModal } from "@/components/TeacherGradingModal";
import { AssignmentDetailsModal } from "@/components/AssignmentDetailsModal";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { useToast } from "@/hooks/use-toast";

interface AssignmentWithCourse extends AssignmentWithStats {
  course?: { id: string; title: string } | null;
  assignedStudentIds?: string[];
  submittedStudentIds?: string[];
}

interface TeacherAssignmentsProps {
  teacherId: string;
}

type ViewMode = "grid" | "list" | "table";

interface AssignedStudent {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export default function TeacherAssignments({ teacherId }: TeacherAssignmentsProps) {
  const { toast } = useToast();
  const [gradingAssignmentId, setGradingAssignmentId] = useState<string | null>(null);
  const [gradingAssignment, setGradingAssignment] = useState<AssignmentWithStats | null>(null);
  const [detailsAssignment, setDetailsAssignment] = useState<AssignmentWithStats | null>(null);
  const [isDetailsReadOnly, setIsDetailsReadOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
  const [dueDatePopoverOpen, setDueDatePopoverOpen] = useState<string | null>(null);
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('teacherAssignmentsViewMode') as ViewMode) || 'list';
    }
    return 'list';
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('teacherAssignmentsViewMode', viewMode);
    }
  }, [viewMode]);
  
  const { data: assignments = [], isLoading } = useQuery<AssignmentWithCourse[]>({
    queryKey: ["/api/v1/assignments?teacher_id=" + teacherId],
  });

  // Fetch all students assigned to this teacher across all courses
  const { data: assignedStudents = [] } = useQuery<AssignedStudent[]>({
    queryKey: ["/api/v1/users?role=student&teacher_id=" + teacherId],
    enabled: !!teacherId,
  });

  const updateDueDateMutation = useMutation({
    mutationFn: async ({ assignmentId, dueDate }: { assignmentId: string; dueDate: Date }) => {
      const response = await apiRequest("PATCH", `/api/v1/assignments/${assignmentId}`, {
        dueDate: dueDate.toISOString(),
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/assignments?teacher_id=" + teacherId] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/courses"] });
      setDueDatePopoverOpen(null);
      toast({
        title: "Due date updated",
        description: `Due date changed to ${format(variables.dueDate, 'MMM d, yyyy')}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update due date",
        variant: "destructive",
      });
    },
  });

  const handleDueDateChange = (assignmentId: string, date: Date | undefined) => {
    if (!date) return;
    
    const tomorrow = startOfDay(addDays(new Date(), 1));
    if (date < tomorrow) {
      toast({
        title: "Invalid date",
        description: "Due date must be in the future",
        variant: "destructive",
      });
      return;
    }
    
    updateDueDateMutation.mutate({ assignmentId, dueDate: date });
  };

  const totalUngradedSubmissions = useMemo(() => {
    return assignments.reduce((count, assignment) => 
      count + (assignment.stats?.ungradedCount ?? 0), 0
    );
  }, [assignments]);

  const getTypeColor = (type?: string | null) => {
    if (!type) return 'default';
    switch (type) {
      case 'homework': return 'default';
      case 'quiz': return 'secondary';
      case 'exam': return 'destructive';
      case 'project': return 'outline';
      default: return 'default';
    }
  };

  const getTypeLabel = (type?: string | null) => {
    if (!type) return 'Assignment';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getStatusColor = (isPublished: boolean | null, dueDate: Date | null) => {
    if (!isPublished) return { variant: 'secondary', text: 'Draft' };
    if (!dueDate) return { variant: 'default', text: 'Published' };
    
    const now = new Date();
    const due = new Date(dueDate);
    
    if (due < now) return { variant: 'destructive', text: 'Closed' };
    return { variant: 'default', text: 'Active' };
  };

  const publishedAssignments = assignments.filter(a => a.isPublished === true);

  // Filter assignments based on selected student's submissions
  const filteredAssignments = useMemo(() => {
    if (selectedStudentFilter === "all") {
      return publishedAssignments;
    }
    // When a student is selected, only show assignments where that student has submitted
    return publishedAssignments.filter(assignment => {
      return assignment.submittedStudentIds?.includes(selectedStudentFilter) ?? false;
    });
  }, [publishedAssignments, selectedStudentFilter]);
  
  const upcomingAssignments = useMemo(() => {
    return [...filteredAssignments]
      .filter(assignment => {
        const hasUngraded = (assignment.stats?.ungradedCount ?? 0) > 0;
        const now = new Date();
        const due = assignment.dueDate ? new Date(assignment.dueDate) : null;
        const isActive = !due || due >= now;
        return hasUngraded || isActive;
      })
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [filteredAssignments]);

  const historyAssignments = useMemo(() => {
    const now = new Date();
    return [...filteredAssignments]
      .filter(assignment => {
        // Only show closed/past assignments in history (due date has passed)
        const due = assignment.dueDate ? new Date(assignment.dueDate) : null;
        return due && due < now;
      })
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [filteredAssignments]);

  const getStudentDisplayName = (student: AssignedStudent) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.email || 'Unknown Student';
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Assignments</h1>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const openAssignmentDetails = (assignment: AssignmentWithStats, readOnly: boolean) => {
    setDetailsAssignment(assignment);
    setIsDetailsReadOnly(readOnly);
  };

  const renderAssignmentTable = (assignmentList: AssignmentWithCourse[], showCourse: boolean = false, readOnly: boolean = false) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {showCourse && <TableHead>Course</TableHead>}
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Submissions</TableHead>
            <TableHead>Max Score</TableHead>
            {!readOnly && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignmentList.map((assignment) => {
            const status = getStatusColor(assignment.isPublished, assignment.dueDate);
            const stats = assignment.stats;
            
            return (
              <TableRow
                key={assignment.id}
                className="cursor-pointer hover-elevate"
                onClick={() => openAssignmentDetails(assignment, readOnly)}
                data-testid={`row-assignment-${assignment.id}`}
              >
                {showCourse && (
                  <TableCell className="text-sm text-muted-foreground">
                    {assignment.course?.title || 'Unknown Course'}
                  </TableCell>
                )}
                <TableCell className="font-medium" data-testid={`cell-title-${assignment.id}`}>
                  <div className="max-w-xs">
                    <div className="font-semibold">{assignment.title}</div>
                    {assignment.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {assignment.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell data-testid={`cell-type-${assignment.id}`}>
                  <Badge variant={getTypeColor(assignment.type)} className="text-xs">
                    {getTypeLabel(assignment.type)}
                  </Badge>
                </TableCell>
                <TableCell data-testid={`cell-status-${assignment.id}`}>
                  <Badge variant={status.variant as any} className="text-xs">
                    {status.text}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm" data-testid={`cell-due-date-${assignment.id}`}>
                  {assignment.dueDate 
                    ? format(new Date(assignment.dueDate), 'MMM d, yyyy')
                    : 'No due date'
                  }
                </TableCell>
                <TableCell data-testid={`cell-submissions-${assignment.id}`}>
                  <div className="text-sm">
                    <div>{stats.totalSubmissions} total</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.gradedCount || 0} graded
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm" data-testid={`cell-max-score-${assignment.id}`}>
                  {assignment.maxScore || 100} pts
                </TableCell>
                {!readOnly && (
                  <TableCell className="text-right" data-testid={`cell-actions-${assignment.id}`}>
                    <div className="flex justify-end gap-1">
                      <Popover 
                        open={dueDatePopoverOpen === `table-${assignment.id}`} 
                        onOpenChange={(open) => setDueDatePopoverOpen(open ? `table-${assignment.id}` : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`button-update-due-date-table-${assignment.id}`}
                            title="Update due date"
                          >
                            <CalendarClock className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end" onClick={(e) => e.stopPropagation()}>
                          <div className="p-3 border-b">
                            <p className="text-sm font-medium">Update Due Date</p>
                            <p className="text-xs text-muted-foreground">Select a future date</p>
                          </div>
                          <CalendarComponent
                            mode="single"
                            selected={assignment.dueDate ? new Date(assignment.dueDate) : undefined}
                            onSelect={(date) => handleDueDateChange(assignment.id, date)}
                            disabled={(date) => date < startOfDay(addDays(new Date(), 1))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGradingAssignmentId(assignment.id);
                          setGradingAssignment(assignment);
                        }}
                        disabled={stats.ungradedCount === 0 && stats.totalSubmissions > 0}
                        data-testid={`button-grade-${assignment.id}`}
                      >
                        {stats.ungradedCount === 0 && stats.totalSubmissions > 0 ? 'All Graded' : 'Grade'}
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const renderAssignmentCards = (assignmentList: AssignmentWithCourse[], showCourse: boolean = false, readOnly: boolean = false) => (
    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
      {assignmentList.map((assignment) => {
        const status = getStatusColor(assignment.isPublished, assignment.dueDate);
        const stats = assignment.stats;
        
        if (viewMode === 'grid') {
          return (
            <Card 
              key={assignment.id} 
              className="cursor-pointer transition-all group hover:border-primary/40 flex flex-col"
              onClick={() => openAssignmentDetails(assignment, readOnly)}
              data-testid={`assignment-${assignment.id}`}
            >
              <CardHeader className="pb-3">
                {showCourse && (
                  <p className="text-xs text-muted-foreground font-medium mb-1">{assignment.course?.title || 'Unknown Course'}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant={getTypeColor(assignment.type)} className="text-xs">
                    {getTypeLabel(assignment.type)}
                  </Badge>
                  <Badge variant={status.variant as any} className="text-xs">
                    {status.text}
                  </Badge>
                </div>
                <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {assignment.title}
                </h3>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                {assignment.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {assignment.description}
                  </p>
                )}
                <div className="text-xs text-muted-foreground space-y-1 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Due: {assignment.dueDate 
                        ? format(new Date(assignment.dueDate), 'MMM d, yyyy')
                        : 'No due date'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{stats.totalSubmissions} {stats.totalSubmissions === 1 ? 'submission' : 'submissions'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>{stats.gradedCount || 0} graded</span>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    Max Score: {assignment.maxScore || 100} points
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-2 mt-2">
                      <Popover 
                        open={dueDatePopoverOpen === `grid-${assignment.id}`} 
                        onOpenChange={(open) => setDueDatePopoverOpen(open ? `grid-${assignment.id}` : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`button-update-due-date-grid-${assignment.id}`}
                            title="Update due date"
                          >
                            <CalendarClock className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
                          <div className="p-3 border-b">
                            <p className="text-sm font-medium">Update Due Date</p>
                            <p className="text-xs text-muted-foreground">Select a future date</p>
                          </div>
                          <CalendarComponent
                            mode="single"
                            selected={assignment.dueDate ? new Date(assignment.dueDate) : undefined}
                            onSelect={(date) => handleDueDateChange(assignment.id, date)}
                            disabled={(date) => date < startOfDay(addDays(new Date(), 1))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGradingAssignmentId(assignment.id);
                          setGradingAssignment(assignment);
                        }}
                        disabled={stats.ungradedCount === 0 && stats.totalSubmissions > 0}
                        data-testid={`button-grade-${assignment.id}`}
                      >
                        {stats.ungradedCount === 0 && stats.totalSubmissions > 0 ? 'All Graded' : 'Grade'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        }
        
        return (
          <Card 
            key={assignment.id} 
            className="cursor-pointer transition-all group hover:border-primary/40"
            onClick={() => openAssignmentDetails(assignment, readOnly)}
            data-testid={`assignment-${assignment.id}`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {showCourse && (
                    <p className="text-xs text-muted-foreground font-medium mb-1">{assignment.course?.title || 'Unknown Course'}</p>
                  )}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{assignment.title}</h3>
                    <Badge variant={getTypeColor(assignment.type)} className="text-xs">
                      {getTypeLabel(assignment.type)}
                    </Badge>
                    <Badge variant={status.variant as any} className="text-xs">
                      {status.text}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Due: {assignment.dueDate 
                          ? format(new Date(assignment.dueDate), 'MMM d, yyyy')
                          : 'No due date'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{stats.totalSubmissions} {stats.totalSubmissions === 1 ? 'submission' : 'submissions'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>{stats.gradedCount || 0} graded</span>
                    </div>
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-2">
                    <Popover 
                      open={dueDatePopoverOpen === assignment.id} 
                      onOpenChange={(open) => setDueDatePopoverOpen(open ? assignment.id : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`button-update-due-date-${assignment.id}`}
                          title="Update due date"
                        >
                          <CalendarClock className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end" onClick={(e) => e.stopPropagation()}>
                        <div className="p-3 border-b">
                          <p className="text-sm font-medium">Update Due Date</p>
                          <p className="text-xs text-muted-foreground">Select a future date</p>
                        </div>
                        <CalendarComponent
                          mode="single"
                          selected={assignment.dueDate ? new Date(assignment.dueDate) : undefined}
                          onSelect={(date) => handleDueDateChange(assignment.id, date)}
                          disabled={(date) => date < startOfDay(addDays(new Date(), 1))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGradingAssignmentId(assignment.id);
                        setGradingAssignment(assignment);
                      }}
                      disabled={stats.ungradedCount === 0 && stats.totalSubmissions > 0}
                      data-testid={`button-grade-${assignment.id}`}
                    >
                      {stats.ungradedCount === 0 && stats.totalSubmissions > 0 ? 'All Graded' : 'Grade'}
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {assignment.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {assignment.description}
                </p>
              )}
              <div className="pt-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Max Score: {assignment.maxScore || 100} points
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto" data-testid="teacher-assignments-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Assignments</h1>
          <p className="text-muted-foreground">
            Create and manage student assignments
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Published</span>
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary" data-testid="stat-total">
              {publishedAssignments.length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-secondary/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Active</span>
              <div className="p-2 rounded-lg bg-secondary/10">
                <CheckCircle className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-secondary" data-testid="stat-active">
              {publishedAssignments.filter(a => {
                const now = new Date();
                const due = a.dueDate ? new Date(a.dueDate) : null;
                return !due || due >= now;
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Need Grading</span>
              <div className="p-2 rounded-lg bg-secondary/10">
                <Clock className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-secondary" data-testid="stat-need-grading">
              {totalUngradedSubmissions}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "upcoming" | "history")} className="space-y-4" data-testid="assignments-tabs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20">
            <TabsTrigger 
              value="upcoming" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2" 
              data-testid="tab-upcoming"
            >
              <Clock className="w-4 h-4" />
              Upcoming
              {upcomingAssignments.length > 0 && (
                <Badge variant="outline" className="text-xs ml-1">{upcomingAssignments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2" 
              data-testid="tab-history"
            >
              <History className="w-4 h-4" />
              History
              {historyAssignments.length > 0 && (
                <Badge variant="outline" className="text-xs ml-1">{historyAssignments.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3 flex-wrap">
            {activeTab === "history" && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select
                  value={selectedStudentFilter}
                  onValueChange={setSelectedStudentFilter}
                >
                  <SelectTrigger className="w-[200px]" data-testid="select-student-filter">
                    <SelectValue placeholder="Filter by student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {assignedStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {getStudentDisplayName(student)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <ViewModeToggle 
              currentMode={viewMode}
              onModeChange={(mode) => setViewMode(mode as ViewMode)}
              availableModes={["table", "grid", "list"]}
            />
          </div>
        </div>

        <TabsContent value="upcoming" className="space-y-4" data-testid="tab-content-upcoming">
          {upcomingAssignments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-20 text-center">
                <div className="max-w-md mx-auto">
                  <div className="p-4 rounded-full bg-primary/10 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">All caught up!</h3>
                  <p className="text-muted-foreground">
                    No active assignments requiring attention.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'table' ? (
            renderAssignmentTable(upcomingAssignments, true)
          ) : (
            renderAssignmentCards(upcomingAssignments, true)
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4" data-testid="tab-content-history">
          {historyAssignments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-20 text-center">
                <div className="max-w-md mx-auto">
                  <div className="p-4 rounded-full bg-primary/10 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">No assignment history</h3>
                  <p className="text-muted-foreground">
                    Your published assignments will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'table' ? (
            renderAssignmentTable(historyAssignments, true, true)
          ) : (
            renderAssignmentCards(historyAssignments, true, true)
          )}
        </TabsContent>
      </Tabs>

      <AssignmentDetailsModal
        isOpen={!!detailsAssignment}
        onClose={() => {
          setDetailsAssignment(null);
          setIsDetailsReadOnly(false);
        }}
        assignment={detailsAssignment}
        courseId={detailsAssignment?.courseId || ''}
        teacherId={teacherId}
        readOnly={isDetailsReadOnly}
        selectedStudentFilter={selectedStudentFilter}
      />

      <TeacherGradingModal
        assignment={gradingAssignment}
        assignmentId={gradingAssignmentId}
        isOpen={!!gradingAssignmentId}
        onClose={() => {
          setGradingAssignmentId(null);
          setGradingAssignment(null);
        }}
        teacherId={teacherId}
      />
    </div>
  );
}
