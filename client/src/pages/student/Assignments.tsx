import { useState, useEffect, useRef, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Grid3x3, 
  List,
  ClipboardList,
  ArrowRight,
  BookOpen,
  User,
  CalendarClock,
  TableProperties,
  LayoutGrid,
  ListTodo,
  Star,
  AlertTriangle,
  Sparkles,
  Trophy
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StudentAssignmentDetailModal } from "@/components/StudentAssignmentDetailModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Assignment, Notification, Submission, Grade, Course, User as UserType } from "@shared/schema";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";

interface AssignmentsProps {
  studentId: string;
}

function getAssignmentBadge(
  assignment: Assignment,
  submission?: Submission | null,
  grade?: Grade | null
): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (grade) {
    return { label: "Graded", variant: "default" };
  }
  
  if (submission) {
    return { label: "Submitted", variant: "outline" };
  }
  
  const now = new Date();
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  
  if (dueDate && dueDate < now) {
    return { label: "Overdue", variant: "destructive" };
  }
  
  return { label: "Active", variant: "secondary" };
}

export default function Assignments({ studentId }: AssignmentsProps) {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
  const [viewMode, setViewMode] = useState<"table" | "list" | "grid">("table");
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/students", studentId, "assignments"],
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/students", studentId, "submissions"],
    enabled: !!studentId,
  });

  const { data: grades = [], isLoading: gradesLoading } = useQuery<Grade[]>({
    queryKey: ["/api/grades/student", studentId],
    enabled: !!studentId,
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const isLoading = assignmentsLoading || submissionsLoading || gradesLoading || coursesLoading || usersLoading;

  const coursesByIdMap = useMemo(() => {
    const map: Record<string, Course> = {};
    courses.forEach(course => {
      map[course.id] = course;
    });
    return map;
  }, [courses]);

  const teachersByIdMap = useMemo(() => {
    const map: Record<string, UserType> = {};
    allUsers.forEach(user => {
      if (user.role === 'teacher') {
        map[user.id] = user;
      }
    });
    return map;
  }, [allUsers]);

  const submissionsByAssignmentId = useMemo(() => {
    const map: Record<string, Submission> = {};
    submissions.forEach(sub => {
      map[sub.assignmentId] = sub;
    });
    return map;
  }, [submissions]);

  const gradesBySubmissionId = useMemo(() => {
    const map: Record<string, Grade> = {};
    grades.forEach(grade => {
      if (grade.submissionId) {
        map[grade.submissionId] = grade;
      }
    });
    return map;
  }, [grades]);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", studentId],
    enabled: !!studentId,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const newAssignmentNotifications = notifications.filter(n => 
      !previousNotificationIdsRef.current.has(n.id) && 
      n.type === 'assignment_posted'
    );

    if (newAssignmentNotifications.length > 0 && previousNotificationIdsRef.current.size > 0) {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/students", studentId, "assignments"] 
      });
    }

    notifications.forEach(n => {
      previousNotificationIdsRef.current.add(n.id);
    });
  }, [notifications, studentId]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'homework': return 'default';
      case 'quiz': return 'secondary';
      case 'exam': return 'destructive';
      case 'project': return 'outline';
      default: return 'default';
    }
  };

  const getDaysUntilDue = (dueDate: Date | null): string => {
    if (!dueDate) return 'No due date';
    
    const now = new Date();
    const due = new Date(dueDate);
    const timeDiff = due.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return 'Overdue';
    if (daysDiff === 0) return 'Due today';
    if (daysDiff === 1) return 'Due tomorrow';
    return `${daysDiff} days`;
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
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const upcomingAssignments = assignments.filter(a => {
    if (!a.title || a.title.trim() === '') return false;
    
    const submission = submissionsByAssignmentId[a.id];
    const grade = submission ? gradesBySubmissionId[submission.id] : null;
    if (grade) return false;
    
    if (!a.dueDate) return true;
    return new Date(a.dueDate) >= new Date();
  });

  const overdueAssignments = assignments.filter(a => {
    if (!a.title || a.title.trim() === '') return false;
    if (!a.dueDate) return false;
    
    const submission = submissionsByAssignmentId[a.id];
    const grade = submission ? gradesBySubmissionId[submission.id] : null;
    
    if (grade) return false;
    if (submission) return false;
    
    return new Date(a.dueDate) < new Date();
  });

  const TableRow = ({ assignment }: { assignment: Assignment }) => {
    const submission = submissionsByAssignmentId[assignment.id];
    const grade = submission ? gradesBySubmissionId[submission.id] : null;
    const statusBadge = getAssignmentBadge(assignment, submission, grade);
    const course = coursesByIdMap[assignment.courseId];
    
    return (
      <tr 
        key={assignment.id}
        className="hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={() => setSelectedAssignmentId(assignment.id)}
        data-testid={`assignment-${assignment.id}`}
      >
        <td className="px-4 py-4">
          <div className="font-medium text-sm">{course?.title || 'Unknown Course'}</div>
        </td>
        <td className="px-4 py-4">
          <div className="space-y-1">
            <div className="font-semibold text-sm">{assignment.title}</div>
            <div className="flex items-center gap-2">
              <Badge variant={getTypeColor(assignment.type)} className="text-xs">
                {assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}
              </Badge>
              <span className="text-xs text-muted-foreground">Max: {assignment.maxScore || 100}</span>
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock className="w-4 h-4" />
            {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM d, yyyy') : 'No date'}
          </div>
        </td>
        <td className="px-4 py-4">
          <Badge 
            className={`text-xs ${
              statusBadge.variant === 'default' ? 'bg-[#2FBF71]/10 text-[#2FBF71] border-[#2FBF71]/20' :
              statusBadge.variant === 'destructive' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200' :
              statusBadge.variant === 'outline' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200' :
              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200'
            }`}
          >
            {statusBadge.label}
          </Badge>
        </td>
        <td className="px-4 py-4 text-right">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-[#1F3A5F] hover:text-[#1F3A5F] hover:bg-[#1F3A5F]/10"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAssignmentId(assignment.id);
            }}
            data-testid={`button-view-${assignment.id}`}
          >
            View <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </td>
      </tr>
    );
  };

  const ListItem = ({ assignment }: { assignment: Assignment }) => {
    const submission = submissionsByAssignmentId[assignment.id];
    const grade = submission ? gradesBySubmissionId[submission.id] : null;
    const statusBadge = getAssignmentBadge(assignment, submission, grade);
    const course = coursesByIdMap[assignment.courseId];
    const teacher = course?.teacherId ? teachersByIdMap[course.teacherId] : null;
    const teacherName = teacher ? (teacher.name || `${teacher.firstName} ${teacher.lastName}`) : 'Unassigned';
    const daysUntil = getDaysUntilDue(assignment.dueDate);
    const isUrgent = daysUntil === 'Due today' || daysUntil === 'Due tomorrow';
    
    return (
      <Card
        key={assignment.id}
        className={`p-4 hover:shadow-md cursor-pointer transition-all ${isUrgent ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
        onClick={() => setSelectedAssignmentId(assignment.id)}
        data-testid={`assignment-${assignment.id}`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              statusBadge.variant === 'destructive' ? 'bg-red-100 dark:bg-red-900/30' :
              statusBadge.variant === 'default' ? 'bg-[#2FBF71]/10' :
              'bg-[#1F3A5F]/10'
            }`}>
              <ClipboardList className={`w-5 h-5 ${
                statusBadge.variant === 'destructive' ? 'text-red-600 dark:text-red-400' :
                statusBadge.variant === 'default' ? 'text-[#2FBF71]' :
                'text-[#1F3A5F]'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{assignment.title}</h3>
              <p className="text-xs text-muted-foreground">{course?.title || 'Unknown Course'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={getTypeColor(assignment.type)} className="text-xs">
              {assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}
            </Badge>
            <Badge 
              className={`text-xs ${
                statusBadge.variant === 'default' ? 'bg-[#2FBF71]/10 text-[#2FBF71] border-[#2FBF71]/20' :
                statusBadge.variant === 'destructive' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200' :
                statusBadge.variant === 'outline' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200' :
                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200'
              }`}
            >
              {statusBadge.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {teacherName}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM d, yyyy') : 'No date'}
          </span>
          {submission?.submittedAt && (
            <span className="flex items-center gap-1 text-[#2FBF71]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Submitted {format(new Date(submission.submittedAt), 'MMM d')}
            </span>
          )}
          {isUrgent && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {daysUntil}
            </span>
          )}
        </div>
      </Card>
    );
  };

  const GridCard = ({ assignment }: { assignment: Assignment }) => {
    const submission = submissionsByAssignmentId[assignment.id];
    const grade = submission ? gradesBySubmissionId[submission.id] : null;
    const statusBadge = getAssignmentBadge(assignment, submission, grade);
    const course = coursesByIdMap[assignment.courseId];
    const teacher = course?.teacherId ? teachersByIdMap[course.teacherId] : null;
    const teacherName = teacher ? (teacher.name || `${teacher.firstName} ${teacher.lastName}`) : 'Unassigned';
    
    return (
      <Card
        key={assignment.id}
        className="p-4 hover:shadow-lg cursor-pointer transition-all group"
        onClick={() => setSelectedAssignmentId(assignment.id)}
        data-testid={`assignment-${assignment.id}`}
      >
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            statusBadge.variant === 'destructive' ? 'bg-red-100 dark:bg-red-900/30' :
            statusBadge.variant === 'default' ? 'bg-[#2FBF71]/10' :
            'bg-[#1F3A5F]/10'
          }`}>
            <ClipboardList className={`w-5 h-5 ${
              statusBadge.variant === 'destructive' ? 'text-red-600 dark:text-red-400' :
              statusBadge.variant === 'default' ? 'text-[#2FBF71]' :
              'text-[#1F3A5F]'
            }`} />
          </div>
          <Badge 
            className={`text-xs ${
              statusBadge.variant === 'default' ? 'bg-[#2FBF71]/10 text-[#2FBF71] border-[#2FBF71]/20' :
              statusBadge.variant === 'destructive' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200' :
              statusBadge.variant === 'outline' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200' :
              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200'
            }`}
          >
            {statusBadge.label}
          </Badge>
        </div>
        
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1">{course?.title || 'Unknown Course'}</p>
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-[#1F3A5F] transition-colors">{assignment.title}</h3>
        </div>
        
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Due
            </span>
            <span className="font-medium">{assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM d') : 'No date'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              Max Score
            </span>
            <span className="font-medium">{assignment.maxScore || 100}</span>
          </div>
          {submission?.submittedAt && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Submitted
              </span>
              <span className="font-medium text-[#2FBF71]">{format(new Date(submission.submittedAt), 'MMM d')}</span>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto" data-testid="assignments-page">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] flex items-center justify-center shadow-lg">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
            <p className="text-muted-foreground">Track your assignments and deadlines</p>
          </div>
        </div>
        <Badge className="bg-[#1F3A5F]/10 text-[#1F3A5F] dark:bg-[#1F3A5F]/20 dark:text-blue-300 border-[#1F3A5F]/20 text-sm px-4 py-2 w-fit">
          <FileText className="w-4 h-4 mr-2" />
          {assignments.length} Total Assignments
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "upcoming" | "history")} className="space-y-6" data-testid="assignments-tabs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList className="inline-flex h-12 items-center justify-start rounded-xl bg-gradient-to-r from-[#1F3A5F]/10 to-[#1F3A5F]/5 p-1.5 gap-1 border border-[#1F3A5F]/20">
            <TabsTrigger 
              value="upcoming" 
              className="data-[state=active]:bg-[#1F3A5F] data-[state=active]:text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all" 
              data-testid="tab-upcoming"
            >
              <Clock className="w-4 h-4" />
              Upcoming
              {upcomingAssignments.length > 0 && (
                <Badge className="bg-white/20 text-current border-0 text-xs ml-1">{upcomingAssignments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-[#1F3A5F] data-[state=active]:text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all" 
              data-testid="tab-history"
            >
              <FileText className="w-4 h-4" />
              History
              {assignments.length > 0 && (
                <Badge className="bg-current/10 text-current border-0 text-xs ml-1">{assignments.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1.5 border">
            <Button 
              variant={viewMode === 'table' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 rounded-lg ${viewMode === 'table' ? 'bg-[#1F3A5F] hover:bg-[#2a4a75]' : ''}`}
              data-testid="view-table"
            >
              <TableProperties className="w-4 h-4" />
              Table
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 rounded-lg ${viewMode === 'list' ? 'bg-[#1F3A5F] hover:bg-[#2a4a75]' : ''}`}
              data-testid="view-list"
            >
              <ListTodo className="w-4 h-4" />
              List
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#1F3A5F] hover:bg-[#2a4a75]' : ''}`}
              data-testid="view-grid"
            >
              <LayoutGrid className="w-4 h-4" />
              Grid
            </Button>
          </div>
        </div>

        <TabsContent value="upcoming" className="space-y-6">
          {/* Overdue Assignments - Alert Section */}
          {overdueAssignments.length > 0 && (
            <Card className="border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-transparent dark:from-red-950/30 dark:to-transparent overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-red-700 dark:text-red-400">Overdue Assignments</h2>
                    <p className="text-sm text-red-600/70 dark:text-red-400/70">Need immediate attention</p>
                  </div>
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 border-red-200 text-sm px-3 py-1">
                    {overdueAssignments.length} Overdue
                  </Badge>
                </div>
                
                {viewMode === 'table' ? (
                  <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-red-50 dark:bg-red-950/50">
                        <tr>
                          <th className="text-left text-xs font-semibold text-red-700 dark:text-red-400 px-4 py-3">Course</th>
                          <th className="text-left text-xs font-semibold text-red-700 dark:text-red-400 px-4 py-3">Assignment</th>
                          <th className="text-left text-xs font-semibold text-red-700 dark:text-red-400 px-4 py-3">Due Date</th>
                          <th className="text-left text-xs font-semibold text-red-700 dark:text-red-400 px-4 py-3">Status</th>
                          <th className="text-right text-xs font-semibold text-red-700 dark:text-red-400 px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100 dark:divide-red-900">
                        {overdueAssignments.map((assignment) => <TableRow key={assignment.id} assignment={assignment} />)}
                      </tbody>
                    </table>
                  </div>
                ) : viewMode === 'list' ? (
                  <div className="space-y-3">
                    {overdueAssignments.map((assignment) => <ListItem key={assignment.id} assignment={assignment} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {overdueAssignments.map((assignment) => <GridCard key={assignment.id} assignment={assignment} />)}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Upcoming Assignments */}
          <Card className="shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2FBF71]/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#2FBF71]" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Upcoming Assignments</h2>
                </div>
                {upcomingAssignments.length > 0 && (
                  <Badge className="bg-[#2FBF71]/10 text-[#2FBF71] border-[#2FBF71]/20">{upcomingAssignments.length}</Badge>
                )}
              </div>
              
              {upcomingAssignments.length === 0 ? (
                <div className="border-2 border-dashed rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#2FBF71]/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-[#2FBF71]" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">All caught up!</h3>
                  <p className="text-muted-foreground">No upcoming assignments</p>
                </div>
              ) : viewMode === 'table' ? (
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Course</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Assignment</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Due Date</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {upcomingAssignments.map((assignment) => <TableRow key={assignment.id} assignment={assignment} />)}
                    </tbody>
                  </table>
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-3">
                  {upcomingAssignments.map((assignment) => <ListItem key={assignment.id} assignment={assignment} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingAssignments.map((assignment) => <GridCard key={assignment.id} assignment={assignment} />)}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4" data-testid="tab-content-history">
          <Card className="shadow-md">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#1F3A5F]/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Assignment History</h2>
              </div>
              
              {assignments.length === 0 ? (
                <div className="border-2 border-dashed rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="font-semibold mb-1">No assignments yet</p>
                  <p className="text-sm text-muted-foreground">Your assignment history will appear here</p>
                </div>
              ) : viewMode === 'table' ? (
                <div className="border rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Course</th>
                        <th className="text-left px-4 py-3 font-semibold">Teacher</th>
                        <th className="text-left px-4 py-3 font-semibold">Assignment</th>
                        <th className="text-left px-4 py-3 font-semibold">Due Date</th>
                        <th className="text-left px-4 py-3 font-semibold">Submitted</th>
                        <th className="text-left px-4 py-3 font-semibold">Score</th>
                        <th className="text-left px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {assignments.map((assignment) => {
                        const submission = submissionsByAssignmentId[assignment.id];
                        const grade = submission ? gradesBySubmissionId[submission.id] : null;
                        const statusBadge = getAssignmentBadge(assignment, submission, grade);
                        const course = coursesByIdMap[assignment.courseId];
                        const teacher = course?.teacherId ? teachersByIdMap[course.teacherId] : null;
                        const teacherName = teacher ? (teacher.name || `${teacher.firstName} ${teacher.lastName}`) : 'Unassigned';
                        
                        return (
                          <tr 
                            key={assignment.id}
                            className="hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => setSelectedAssignmentId(assignment.id)}
                            data-testid={`history-assignment-${assignment.id}`}
                          >
                            <td className="px-4 py-3 font-medium text-sm">{course?.title || 'Unknown Course'}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{teacherName}</td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{assignment.title}</p>
                                <p className="text-xs text-muted-foreground">Max: {assignment.maxScore || 100}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM d, yyyy') : '—'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {submission?.submittedAt ? format(new Date(submission.submittedAt), 'MMM d, yyyy') : '—'}
                            </td>
                            <td className="px-4 py-3">
                              {grade ? (
                                <span className="font-semibold text-[#2FBF71]">{grade.score}/{assignment.maxScore || 100}</span>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                className={`text-xs ${
                                  statusBadge.variant === 'default' ? 'bg-[#2FBF71]/10 text-[#2FBF71] border-[#2FBF71]/20' :
                                  statusBadge.variant === 'destructive' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200' :
                                  statusBadge.variant === 'outline' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200' :
                                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200'
                                }`}
                              >
                                {statusBadge.label}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-3">
                  {assignments.map((assignment) => <ListItem key={assignment.id} assignment={assignment} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignments.map((assignment) => <GridCard key={assignment.id} assignment={assignment} />)}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedAssignmentId && (
        <StudentAssignmentDetailModal
          isOpen={!!selectedAssignmentId}
          onClose={() => setSelectedAssignmentId(null)}
          assignmentId={selectedAssignmentId}
          studentId={studentId}
        />
      )}
    </div>
  );
}
