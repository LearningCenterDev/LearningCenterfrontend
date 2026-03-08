import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Users, BookOpen, TrendingUp, Activity, Database, Server, GraduationCap, Calendar, Sparkles, UserPlus, Zap, Target, CheckCircle2, Award, Clock, AlertTriangle, HardDrive, FileDown, LineChart, FileBarChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import type { TeacherSessionStats } from "@shared/schema";

interface SystemAnalyticsProps {
  adminId: string;
}

interface SystemData {
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    userGrowthRate: number;
  };
  courseMetrics: {
    totalCourses: number;
    activeCourses: number;
    enrollmentRate: number;
    courseCompletionRate: number;
  };
  performanceMetrics: {
    averageGPA: number;
    attendanceRate: number;
    assignmentCompletionRate: number;
    passRate: number;
  };
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    diskUsage: number;
  };
}

export default function SystemAnalytics({ adminId }: SystemAnalyticsProps) {
  const [statsStartDate, setStatsStartDate] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [statsEndDate, setStatsEndDate] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: systemData, isLoading } = useQuery<SystemData>({
    queryKey: ["/api/admin/analytics"],
    refetchInterval: 10000, // Auto-refetch every 10 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when connection is restored
  });

  const { data: teacherStats = [], isLoading: statsLoading } = useQuery<TeacherSessionStats[]>({
    queryKey: [`/api/admin/teacher-session-stats?startDate=${statsStartDate}&endDate=${statsEndDate}`],
    enabled: !!statsStartDate && !!statsEndDate,
  });

  if (isLoading) {
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
          <div className="h-8 w-48 bg-[#1F3A5F]/10 dark:bg-white/20 rounded mb-2 animate-pulse" />
          <div className="h-4 w-64 bg-[#1F3A5F]/5 dark:bg-white/10 rounded animate-pulse" />
        </div>
      </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const {
    userMetrics = {
      totalUsers: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
      userGrowthRate: 0
    },
    courseMetrics = {
      totalCourses: 0,
      activeCourses: 0,
      enrollmentRate: 0,
      courseCompletionRate: 0
    },
    performanceMetrics = {
      averageGPA: 0,
      attendanceRate: 0,
      assignmentCompletionRate: 0,
      passRate: 0
    },
    systemHealth = {
      uptime: 0,
      responseTime: 0,
      errorRate: 0,
      diskUsage: 0
    }
  } = systemData || {};

  const getHealthColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'default';
    if (value >= thresholds.warning) return 'secondary';
    return 'destructive';
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return 'bg-green-500';
    if (value >= 70) return 'bg-blue-500';
    if (value >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" data-testid="system-analytics-page">
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
                  <BarChart3 className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white">System Analytics</h1>
              </div>
              <p className="text-[#1F3A5F]/60 dark:text-white/60 text-sm sm:text-base font-medium">Monitor platform performance and metrics</p>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto bg-[#1F3A5F]/10 text-[#1F3A5F] dark:bg-white/10 dark:text-white border-[#1F3A5F]/20 dark:border-white/20" data-testid="analytics-dashboard">
              Real-time Dashboard
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

      {/* User Metrics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1F3A5F]/10 dark:bg-[#1F3A5F]/30 flex items-center justify-center">
            <Users className="w-4 h-4 text-[#1F3A5F] dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold">User Metrics</h2>
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Users</span>
              <div className="w-9 h-9 rounded-lg bg-[#1F3A5F]/10 dark:bg-[#1F3A5F]/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#1F3A5F] dark:text-blue-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#1F3A5F] dark:text-blue-400" data-testid="total-users">
              {userMetrics.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All registered accounts</p>
          </div>

          <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Active Users</span>
              <div className="w-9 h-9 rounded-lg bg-[#2FBF71]/10 dark:bg-[#2FBF71]/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#2FBF71]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#2FBF71]" data-testid="active-users">
              {userMetrics.activeUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active in last 30 days</p>
          </div>

          <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">New Users</span>
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="new-users">
              {userMetrics.newUsersThisMonth.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Joined this month</p>
          </div>

          <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Growth Rate</span>
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400" data-testid="growth-rate">
              {userMetrics.userGrowthRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Monthly growth</p>
          </div>
        </div>
      </div>

      {/* Course Metrics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2FBF71]/10 dark:bg-[#2FBF71]/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-[#2FBF71]" />
          </div>
          <h2 className="text-lg font-semibold">Course Metrics</h2>
        </div>
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#1F3A5F]/10 dark:bg-[#1F3A5F]/30 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#1F3A5F] dark:text-blue-400" />
              </div>
              <h3 className="font-semibold">Course Statistics</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Total Courses</span>
                <span className="text-xl font-bold text-[#1F3A5F] dark:text-blue-400">{courseMetrics.totalCourses}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Active Courses</span>
                <span className="text-xl font-bold text-[#2FBF71]">{courseMetrics.activeCourses}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Enrollment Rate</span>
                  <span className="text-sm font-semibold">{courseMetrics.enrollmentRate.toFixed(1)}%</span>
                </div>
                <Progress value={courseMetrics.enrollmentRate} className="h-2" />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#2FBF71]/10 dark:bg-[#2FBF71]/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-[#2FBF71]" />
              </div>
              <h3 className="font-semibold">Completion Metrics</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Course Completion</span>
                  </div>
                  <span className="text-sm font-semibold">{courseMetrics.courseCompletionRate.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={courseMetrics.courseCompletionRate} 
                  className={`h-2 ${getProgressColor(courseMetrics.courseCompletionRate)}`}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileBarChart className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Assignment Completion</span>
                  </div>
                  <span className="text-sm font-semibold">{performanceMetrics.assignmentCompletionRate.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={performanceMetrics.assignmentCompletionRate} 
                  className={`h-2 ${getProgressColor(performanceMetrics.assignmentCompletionRate)}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Performance Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold">Academic Performance</h2>
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm text-center">
            <div className="w-10 h-10 rounded-lg bg-[#1F3A5F]/10 dark:bg-[#1F3A5F]/30 flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-5 h-5 text-[#1F3A5F] dark:text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#1F3A5F] dark:text-blue-400">{performanceMetrics.averageGPA.toFixed(2)}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Average GPA</div>
          </div>
          <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm text-center">
            <div className="w-10 h-10 rounded-lg bg-[#2FBF71]/10 dark:bg-[#2FBF71]/20 flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5 text-[#2FBF71]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#2FBF71]">{performanceMetrics.attendanceRate.toFixed(1)}%</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Attendance Rate</div>
          </div>
          <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm text-center">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{performanceMetrics.assignmentCompletionRate.toFixed(1)}%</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Assignment Completion</div>
          </div>
          <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm text-center">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">{performanceMetrics.passRate.toFixed(1)}%</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Pass Rate</div>
          </div>
        </div>
      </div>

      {/* System Health Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center">
            <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h2 className="text-lg font-semibold">System Health</h2>
        </div>
        <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm">
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#2FBF71]/10 dark:bg-[#2FBF71]/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#2FBF71]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                  <p className="text-lg font-bold text-[#2FBF71]">{systemHealth.uptime.toFixed(1)}%</p>
                </div>
              </div>
              <Progress value={systemHealth.uptime} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1F3A5F]/10 dark:bg-[#1F3A5F]/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#1F3A5F] dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Response Time</p>
                  <p className="text-lg font-bold text-[#1F3A5F] dark:text-blue-400">{systemHealth.responseTime.toFixed(0)}ms</p>
                </div>
              </div>
              <Progress 
                value={Math.max(0, 100 - (systemHealth.responseTime / 10))} 
                className="h-2" 
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${systemHealth.errorRate < 1 ? 'bg-[#2FBF71]/10 dark:bg-[#2FBF71]/20' : 'bg-red-500/10 dark:bg-red-500/20'}`}>
                  <AlertTriangle className={`w-4 h-4 ${systemHealth.errorRate < 1 ? 'text-[#2FBF71]' : 'text-red-500'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Error Rate</p>
                  <p className={`text-lg font-bold ${systemHealth.errorRate < 1 ? 'text-[#2FBF71]' : 'text-red-500'}`}>{systemHealth.errorRate.toFixed(2)}%</p>
                </div>
              </div>
              <Progress value={Math.max(0, 100 - systemHealth.errorRate * 10)} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${systemHealth.diskUsage > 90 ? 'bg-red-500/10' : systemHealth.diskUsage > 70 ? 'bg-amber-500/10' : 'bg-[#2FBF71]/10'}`}>
                  <HardDrive className={`w-4 h-4 ${systemHealth.diskUsage > 90 ? 'text-red-500' : systemHealth.diskUsage > 70 ? 'text-amber-500' : 'text-[#2FBF71]'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Disk Usage</p>
                  <p className={`text-lg font-bold ${systemHealth.diskUsage > 90 ? 'text-red-500' : systemHealth.diskUsage > 70 ? 'text-amber-500' : 'text-[#2FBF71]'}`}>{systemHealth.diskUsage.toFixed(1)}%</p>
                </div>
              </div>
              <Progress 
                value={systemHealth.diskUsage} 
                className="h-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Session Stats Section */}
      <div className="space-y-4" data-testid="teacher-session-stats-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1F3A5F]/10 dark:bg-[#1F3A5F]/30 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-[#1F3A5F] dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold">Teacher Session Statistics</h2>
        </div>
        <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-end gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stats-start-date" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                Start Date
              </Label>
              <Input
                id="stats-start-date"
                type="date"
                value={statsStartDate}
                onChange={(e) => setStatsStartDate(e.target.value)}
                className="w-[150px] h-9"
                data-testid="input-stats-start-date"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stats-end-date" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                End Date
              </Label>
              <Input
                id="stats-end-date"
                type="date"
                value={statsEndDate}
                onChange={(e) => setStatsEndDate(e.target.value)}
                className="w-[150px] h-9"
                data-testid="input-stats-end-date"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatsStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
                  setStatsEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
                }}
                data-testid="button-this-month"
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const lastMonth = new Date();
                  lastMonth.setMonth(lastMonth.getMonth() - 1);
                  setStatsStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
                  setStatsEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
                }}
                data-testid="button-last-month"
              >
                Last Month
              </Button>
            </div>
          </div>

          {statsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : teacherStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No session data found for the selected period</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700/50">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableHead className="font-semibold">Teacher</TableHead>
                    <TableHead className="text-center font-semibold">Regular</TableHead>
                    <TableHead className="text-center font-semibold">Substitute</TableHead>
                    <TableHead className="text-center font-semibold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherStats.map((stat) => (
                    <TableRow key={stat.teacherId} data-testid={`row-teacher-stats-${stat.teacherId}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <TableCell className="font-medium">{stat.teacherName}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">{stat.regularCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{stat.substituteCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-[#1F3A5F] text-white">{stat.totalCount}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {teacherStats.length > 0 && (
            <div className="flex flex-wrap justify-end gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <span>Regular: <strong className="text-foreground">{teacherStats.reduce((sum, s) => sum + s.regularCount, 0)}</strong></span>
              <span>Substitute: <strong className="text-foreground">{teacherStats.reduce((sum, s) => sum + s.substituteCount, 0)}</strong></span>
              <span>Total: <strong className="text-[#1F3A5F] dark:text-blue-400">{teacherStats.reduce((sum, s) => sum + s.totalCount, 0)}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Tools Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold">Analytics Tools</h2>
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <button className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#1F3A5F]/10 dark:bg-[#1F3A5F]/30 flex items-center justify-center group-hover:bg-[#1F3A5F]/20 transition-colors">
                <FileDown className="w-5 h-5 text-[#1F3A5F] dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold">Data Export</p>
                <p className="text-xs text-muted-foreground">Export analytics data</p>
              </div>
            </div>
          </button>
          <button className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#2FBF71]/10 dark:bg-[#2FBF71]/20 flex items-center justify-center group-hover:bg-[#2FBF71]/20 transition-colors">
                <LineChart className="w-5 h-5 text-[#2FBF71]" />
              </div>
              <div>
                <p className="font-semibold">Trend Analysis</p>
                <p className="text-xs text-muted-foreground">Historical trends</p>
              </div>
            </div>
          </button>
          <button className="p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-xl border-0 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <FileBarChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold">Custom Reports</p>
                <p className="text-xs text-muted-foreground">Build custom analytics</p>
              </div>
            </div>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}