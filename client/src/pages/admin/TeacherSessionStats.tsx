import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import type { TeacherSessionStats, User, DetailedClassRecord } from "@shared/schema";
import { GraduationCap, Calendar, Download, RefreshCw, User as UserIcon, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TeacherSessionStatsPageProps {
  userId: string;
}

export default function TeacherSessionStatsPage({ userId }: TeacherSessionStatsPageProps) {
  const [statsStartDate, setStatsStartDate] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [statsEndDate, setStatsEndDate] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");
  const [showDetailedRecords, setShowDetailedRecords] = useState(false);
  const [selectedRoleType, setSelectedRoleType] = useState<'all' | 'regular' | 'substitute'>('all');
  const detailedRecordsRef = useRef<HTMLDivElement>(null);

  const handleBadgeClick = (teacherId: string, roleType: 'all' | 'regular' | 'substitute') => {
    setSelectedTeacherId(teacherId);
    setSelectedRoleType(roleType);
    setShowDetailedRecords(true);
    setTimeout(() => {
      detailedRecordsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const { data: teachers = [] } = useQuery<User[]>({
    queryKey: ['/api/users?role=teacher'],
  });

  const { data: teacherStats = [], isLoading: statsLoading, refetch: refetchStats } = useQuery<TeacherSessionStats[]>({
    queryKey: [`/api/admin/teacher-session-stats?startDate=${statsStartDate}&endDate=${statsEndDate}`],
    enabled: !!statsStartDate && !!statsEndDate,
  });

  const teacherIdParam = selectedTeacherId !== "all" ? `&teacherId=${selectedTeacherId}` : "";
  const { data: detailedRecords = [], isLoading: recordsLoading, refetch: refetchRecords } = useQuery<DetailedClassRecord[]>({
    queryKey: [`/api/admin/detailed-class-records?startDate=${statsStartDate}&endDate=${statsEndDate}${teacherIdParam}`],
    enabled: !!statsStartDate && !!statsEndDate,
  });

  const isLoading = statsLoading || recordsLoading;

  const filteredStats = selectedTeacherId === "all" 
    ? teacherStats 
    : teacherStats.filter(stat => String(stat.teacherId) === selectedTeacherId);

  const selectedTeacher = selectedTeacherId !== "all" 
    ? teachers.find(t => String(t.id) === selectedTeacherId) 
    : null;

  const filteredDetailedRecords = selectedRoleType === 'all' 
    ? detailedRecords 
    : detailedRecords.filter(record => record.roleType === selectedRoleType);

  const roleTypeLabel = selectedRoleType === 'all' ? 'All' : selectedRoleType === 'regular' ? 'Regular' : 'Substitute';
  const { toast } = useToast();

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/sync-teacher-sessions", {
        startDate: statsStartDate,
        endDate: statsEndDate
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-session-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/detailed-class-records'] });
      refetchStats();
      refetchRecords();
      toast({
        title: "Sessions Synced",
        description: data.synced > 0 
          ? `Successfully synced ${data.synced} completed class session(s).`
          : "All sessions are already up to date.",
      });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync sessions",
        variant: "destructive",
      });
    }
  });

  const handleRefresh = () => {
    syncMutation.mutate();
  };

  const handleExportCSV = () => {
    if (detailedRecords.length === 0) return;
    
    const headers = ['Teacher Name', 'Course', 'Schedule', 'Date', 'Time', 'Role Type'];
    const rows = detailedRecords.map(record => [
      record.teacherName,
      record.courseName,
      record.scheduleTitle,
      format(new Date(record.sessionDate), 'yyyy-MM-dd'),
      record.sessionTime,
      record.roleType
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher-class-records-${statsStartDate}-to-${statsEndDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" data-testid="teacher-session-stats-page">
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
                  <GraduationCap className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white">Teacher Session Statistics</h1>
              </div>
              <p className="text-[#1F3A5F]/60 dark:text-white/60 text-sm sm:text-base font-medium">Track teacher class counts for payroll and reporting</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={syncMutation.isPending}
                className="bg-[#1F3A5F]/10 border-[#1F3A5F]/20 text-[#1F3A5F] hover:bg-[#1F3A5F]/20 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20"
                data-testid="button-refresh-stats"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                {syncMutation.isPending ? 'Syncing...' : 'Sync & Refresh'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={detailedRecords.length === 0}
                className="bg-[#1F3A5F]/10 border-[#1F3A5F]/20 text-[#1F3A5F] hover:bg-[#1F3A5F]/20 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20"
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Premium Filter Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 overflow-hidden" data-testid="teacher-session-stats-card">
        <CardHeader className="border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50 pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] shadow-md">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-800 dark:text-slate-100">Filter & Date Range</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Grid Layout for Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="stats-start-date" className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-[#1F3A5F] dark:text-[#2FBF71]" />
                Start Date
              </Label>
              <Input
                id="stats-start-date"
                type="date"
                value={statsStartDate}
                onChange={(e) => setStatsStartDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus:border-[#1F3A5F] dark:focus:border-[#2FBF71] focus:ring-[#1F3A5F]/20 dark:focus:ring-[#2FBF71]/20 transition-all"
                data-testid="input-stats-start-date"
              />
            </div>
            
            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="stats-end-date" className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-[#1F3A5F] dark:text-[#2FBF71]" />
                End Date
              </Label>
              <Input
                id="stats-end-date"
                type="date"
                value={statsEndDate}
                onChange={(e) => setStatsEndDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus:border-[#1F3A5F] dark:focus:border-[#2FBF71] focus:ring-[#1F3A5F]/20 dark:focus:ring-[#2FBF71]/20 transition-all"
                data-testid="input-stats-end-date"
              />
            </div>
            
            {/* Teacher Select */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <UserIcon className="w-3.5 h-3.5 text-[#1F3A5F] dark:text-[#2FBF71]" />
                Teacher
              </Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus:ring-[#1F3A5F]/20 dark:focus:ring-[#2FBF71]/20" data-testid="select-teacher-filter">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Quick Filters */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-[#1F3A5F] dark:text-[#2FBF71]" />
                Quick Select
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatsStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
                    setStatsEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
                  }}
                  className="flex-1 min-w-[80px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:bg-[#1F3A5F] hover:text-white hover:border-[#1F3A5F] dark:hover:bg-[#2FBF71] dark:hover:border-[#2FBF71] transition-all duration-200"
                  data-testid="button-this-month"
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const lastMonth = subMonths(new Date(), 1);
                    setStatsStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
                    setStatsEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
                  }}
                  className="flex-1 min-w-[80px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:bg-[#1F3A5F] hover:text-white hover:border-[#1F3A5F] dark:hover:bg-[#2FBF71] dark:hover:border-[#2FBF71] transition-all duration-200"
                  data-testid="button-last-month"
                >
                  Last Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const threeMonthsAgo = subMonths(new Date(), 3);
                    setStatsStartDate(format(startOfMonth(threeMonthsAgo), 'yyyy-MM-dd'));
                    setStatsEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
                  }}
                  className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:bg-[#1F3A5F] hover:text-white hover:border-[#1F3A5F] dark:hover:bg-[#2FBF71] dark:hover:border-[#2FBF71] transition-all duration-200"
                  data-testid="button-last-3-months"
                >
                  Last 3 Months
                </Button>
              </div>
            </div>
          </div>
          
          {/* Active Filter Indicator */}
          {(selectedTeacherId !== "all" || statsStartDate || statsEndDate) && (
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">Active filters:</span>
                <Badge variant="secondary" className="bg-[#1F3A5F]/10 dark:bg-[#2FBF71]/20 text-[#1F3A5F] dark:text-[#2FBF71] border-0">
                  {format(new Date(statsStartDate), 'MMM d, yyyy')} - {format(new Date(statsEndDate), 'MMM d, yyyy')}
                </Badge>
                {selectedTeacherId !== "all" && selectedTeacher && (
                  <Badge variant="secondary" className="bg-[#1F3A5F]/10 dark:bg-[#2FBF71]/20 text-[#1F3A5F] dark:text-[#2FBF71] border-0">
                    {selectedTeacher.firstName} {selectedTeacher.lastName}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Class Count Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No session data found for the selected period</p>
            </div>
          ) : (
            <>
              {selectedTeacher && (
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-lg">{selectedTeacher.firstName} {selectedTeacher.lastName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Showing detailed statistics for this teacher within the selected date range
                  </p>
                </div>
              )}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead className="text-center">Regular Classes</TableHead>
                      <TableHead className="text-center">Substitute Classes</TableHead>
                      <TableHead className="text-center">Total Classes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStats.map((stat) => (
                      <TableRow key={stat.teacherId} data-testid={`row-teacher-stats-${stat.teacherId}`}>
                        <TableCell className="font-medium">{stat.teacherName}</TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className="cursor-pointer px-4 py-1.5 text-base"
                            onClick={() => handleBadgeClick(stat.teacherId, 'regular')}
                            data-testid={`badge-regular-${stat.teacherId}`}
                          >
                            {stat.regularCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="secondary"
                            className="cursor-pointer px-4 py-1.5 text-base"
                            onClick={() => handleBadgeClick(stat.teacherId, 'substitute')}
                            data-testid={`badge-substitute-${stat.teacherId}`}
                          >
                            {stat.substituteCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="default"
                            className="cursor-pointer px-4 py-1.5 text-base"
                            onClick={() => handleBadgeClick(stat.teacherId, 'all')}
                            data-testid={`badge-total-${stat.teacherId}`}
                          >
                            {stat.totalCount}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap justify-end gap-4 text-sm text-muted-foreground pt-4 border-t mt-4">
                <span>Total Regular: <strong className="text-foreground">{filteredStats.reduce((sum, s) => sum + s.regularCount, 0)}</strong></span>
                <span>Total Substitute: <strong className="text-foreground">{filteredStats.reduce((sum, s) => sum + s.substituteCount, 0)}</strong></span>
                <span>Grand Total: <strong className="text-foreground">{filteredStats.reduce((sum, s) => sum + s.totalCount, 0)}</strong></span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showDetailedRecords && (
        <div ref={detailedRecordsRef}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {roleTypeLabel} Class Records
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setShowDetailedRecords(false)}
                  data-testid="button-close-detailed-records"
                >
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recordsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : filteredDetailedRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No {roleTypeLabel.toLowerCase()} class records found for the selected period</p>
              <p className="text-sm mt-1">Try adjusting the date range or check that sessions have been completed</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDetailedRecords.map((record) => (
                    <TableRow key={record.id} data-testid={`row-class-record-${record.id}`}>
                      <TableCell className="font-medium">{record.teacherName}</TableCell>
                      <TableCell>{record.courseName}</TableCell>
                      <TableCell>{record.scheduleTitle}</TableCell>
                      <TableCell>{format(new Date(record.sessionDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{record.sessionTime}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={record.roleType === 'regular' ? 'outline' : 'secondary'}>
                          {record.roleType === 'regular' ? 'Regular' : 'Substitute'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}
