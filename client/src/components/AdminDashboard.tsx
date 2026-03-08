import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock as ClockComponent } from "./Clock";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { User, Course } from "@shared/schema";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Plus, 
  Search, 
  Shield,
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  Send,
  KeyRound,
  ChevronRight,
  LayoutDashboard
} from "lucide-react";

interface AdminDashboardProps {
  adminId: string;
  adminName: string;
}

interface AdminStats {
  totalUsers: number;
  activeCourses: number;
  totalEnrollments: number;
  averageGrade: number;
  usersByRole: Record<string, number>;
  totalCourses: number;
  activeUsers: number;
}

interface AdminUser extends User {
  joinDate: string;
  status: string;
}

interface AdminCourse extends Course {
  studentCount: number;
  instructorName: string;
  status: string;
}

interface RecentActivity {
  recentSubmissions: number;
  recentGrades: number;
  recentEnrollments: number;
  pendingReviews: number;
}

export function AdminDashboard({ adminId, adminName }: AdminDashboardProps) {
  const [, navigate] = useLocation();

  // Fetch admin statistics
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    staleTime: 60 * 1000, // 1 minute cache
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Fetch all users for user management
  const usersQuery = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    staleTime: 60 * 1000, // 1 minute cache
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Fetch all courses for course management
  const coursesQuery = useQuery<AdminCourse[]>({
    queryKey: ["/api/admin/courses"],
    staleTime: 60 * 1000, // 1 minute cache
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const users = usersQuery.data || [];
  const usersLoading = usersQuery.isLoading;
  const courses = coursesQuery.data || [];
  const coursesLoading = coursesQuery.isLoading;

  // Fetch recent activity
  const { data: activity, isLoading: activityLoading } = useQuery<RecentActivity>({
    queryKey: ["/api/admin/recent-activity"],
    staleTime: 60 * 1000, // 1 minute cache
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch messages for admin
  const { data: messagesData, isLoading: messagesLoading } = useQuery<{ sent: any[]; received: any[] }>({
    queryKey: ["/api/users", adminId, "messages"],
    staleTime: 30 * 1000, // 30 seconds - messages may need fresher data
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const receivedMessages = messagesData?.received || [];
  const unreadMessagesCount = receivedMessages.filter(msg => !msg.isRead).length;

  // Fetch password reset requests
  const { data: passwordResetRequests = [], isLoading: passwordResetLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/password-reset-requests"],
    staleTime: 60 * 1000, // 1 minute cache
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const pendingResetRequests = passwordResetRequests.filter(req => req.status === 'pending').length;

  const isLoading = statsLoading || usersLoading || coursesLoading || activityLoading;

  // Get recent users (last 5)
  const recentUsers = users.slice(-5);
  
  // Event handlers
  const handleManageUser = (userId: string) => navigate(`/users/${userId}`);
  const handleManageCourse = (courseId: string) => navigate(`/courses/${courseId}`);
  const handleSearch = (value: string) => {
    // TODO: Implement search functionality
    console.log(`Search: ${value}`);
  };

  // Get recent courses (last 5)
  const recentCourses = courses.slice(-5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" data-testid="admin-dashboard">
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
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#1F3A5F]/10 rounded-xl flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white">Admin Dashboard</h1>
              </div>
              <p className="text-[#1F3A5F]/60 dark:text-white/60 text-sm sm:text-base font-medium">Manage your eLearning platform</p>
            </div>
            <ClockComponent />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Search users, courses, or transactions..."
            className="pl-12 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-base"
            onChange={(e) => handleSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-8 w-14 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-[#1F3A5F]/5 to-transparent hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs sm:text-sm font-medium text-slate-500">Total Users</span>
                    <div className="p-2 rounded-lg bg-[#1F3A5F]/10">
                      <Users className="w-4 h-4 text-[#1F3A5F]" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#1F3A5F]" data-testid="stat-total-users">
                    {stats?.totalUsers || 0}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">All platform users</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-[#2FBF71]/5 to-transparent hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs sm:text-sm font-medium text-slate-500">Active Courses</span>
                    <div className="p-2 rounded-lg bg-[#2FBF71]/10">
                      <BookOpen className="w-4 h-4 text-[#2FBF71]" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#2FBF71]" data-testid="stat-active-courses">
                    {stats?.activeCourses || 0}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Currently running</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500/5 to-transparent hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs sm:text-sm font-medium text-slate-500">Avg Grade</span>
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-500" data-testid="stat-average-grade">
                    {stats?.averageGrade || 0}%
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Overall performance</p>
                </CardContent>
              </Card>

              <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow ${activity?.pendingReviews && activity.pendingReviews > 0 ? 'bg-gradient-to-br from-amber-500/5 to-transparent' : 'bg-gradient-to-br from-slate-100/50 to-transparent'}`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs sm:text-sm font-medium text-slate-500">Pending</span>
                    <div className={`p-2 rounded-lg ${activity?.pendingReviews && activity.pendingReviews > 0 ? 'bg-amber-500/10' : 'bg-slate-200/50'}`}>
                      <AlertTriangle className={`w-4 h-4 ${activity?.pendingReviews && activity.pendingReviews > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                    </div>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-bold ${activity?.pendingReviews && activity.pendingReviews > 0 ? 'text-amber-500' : 'text-slate-400'}`} data-testid="stat-pending-reviews">
                    {activity?.pendingReviews || 0}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Needs attention</p>
                </CardContent>
              </Card>

              <Card 
                className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-all col-span-2 lg:col-span-1 ${unreadMessagesCount > 0 ? 'bg-gradient-to-br from-red-500/5 to-transparent ring-1 ring-red-200' : 'bg-gradient-to-br from-[#1F3A5F]/5 to-transparent'}`}
                onClick={() => navigate('/messages')}
                data-testid="message-card"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs sm:text-sm font-medium text-slate-500">Messages</span>
                    <div className={`p-2 rounded-lg ${unreadMessagesCount > 0 ? 'bg-red-500/10' : 'bg-[#1F3A5F]/10'}`}>
                      <MessageCircle className={`w-4 h-4 ${unreadMessagesCount > 0 ? 'text-red-500' : 'text-[#1F3A5F]'}`} />
                    </div>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-bold ${unreadMessagesCount > 0 ? 'text-red-500' : 'text-[#1F3A5F]'}`} data-testid="stat-messages">
                    {messagesLoading ? '...' : unreadMessagesCount > 0 ? unreadMessagesCount : <Send className="w-6 h-6" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {unreadMessagesCount > 0 ? `${unreadMessagesCount} unread` : 'No new messages'}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Password Reset Requests Alert */}
        {pendingResetRequests > 0 && (
          <Card 
            className="border-0 shadow-sm bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-900/20 dark:to-amber-900/20 cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate('/password-reset-requests')}
            data-testid="password-reset-alert"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-red-500/10">
                    <KeyRound className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-white">Password Reset Requests</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {pendingResetRequests} {pendingResetRequests === 1 ? 'user' : 'users'} waiting for approval
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <Badge className="bg-red-500 text-white px-3 py-1">
                    {pendingResetRequests} Pending
                  </Badge>
                  <Button size="sm" className="bg-[#1F3A5F] hover:bg-[#2a4a75]" data-testid="button-review-resets">
                    Review
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Management */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="flex items-center gap-3 text-base sm:text-lg">
                <div className="p-2 rounded-lg bg-[#1F3A5F]/10">
                  <Users className="w-4 h-4 text-[#1F3A5F]" />
                </div>
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))
              ) : recentUsers.length > 0 ? (
                recentUsers.map((user) => {
                  const roleColors = {
                    student: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                    teacher: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", 
                    parent: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
                    admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                    finance_admin: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  } as const;

                  const statusColors = {
                    active: "bg-[#2FBF71]/10 text-[#2FBF71] border-[#2FBF71]/20",
                    pending: "bg-amber-100 text-amber-700 border-amber-200",
                    inactive: "bg-slate-100 text-slate-500 border-slate-200"
                  } as const;

                  return (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                      onClick={() => handleManageUser(user.id)}
                      data-testid={`user-${user.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#1F3A5F] flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-sm sm:text-base truncate">{user.name}</h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[user.role as keyof typeof roleColors] || roleColors.student}`}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-400 hidden sm:inline">Joined {user.joinDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[user.status as keyof typeof statusColors] || statusColors.active}`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors hidden sm:block" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No users found</p>
                </div>
              )}
              
              {recentUsers.length > 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-[#1F3A5F] hover:bg-[#1F3A5F]/5 mt-2" 
                  onClick={() => navigate('/users')}
                  data-testid="button-view-all-users"
                >
                  View All Users
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Course Management */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="flex items-center gap-3 text-base sm:text-lg">
                <div className="p-2 rounded-lg bg-[#2FBF71]/10">
                  <BookOpen className="w-4 h-4 text-[#2FBF71]" />
                </div>
                Course Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))
              ) : recentCourses.length > 0 ? (
                recentCourses.map((course) => {
                  const statusColors = {
                    active: "bg-[#2FBF71]/10 text-[#2FBF71] border-[#2FBF71]/20",
                    draft: "bg-slate-100 text-slate-600 border-slate-200",
                    archived: "bg-amber-100 text-amber-700 border-amber-200"
                  } as const;

                  return (
                    <div 
                      key={course.id} 
                      className="flex items-center justify-between p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                      onClick={() => handleManageCourse(course.id)}
                      data-testid={`course-${course.id}`}
                    >
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm sm:text-base truncate">{course.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="truncate">{course.instructorName}</span>
                          <span className="flex-shrink-0">{course.studentCount} students</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[course.status as keyof typeof statusColors] || statusColors.active}`}>
                          {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors hidden sm:block" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No courses found</p>
                </div>
              )}
              
              {recentCourses.length > 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-[#2FBF71] hover:bg-[#2FBF71]/5 mt-2" 
                  onClick={() => navigate('/courses')}
                  data-testid="button-view-all-courses"
                >
                  View All Courses
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="flex items-center gap-3 text-base sm:text-lg">
              <div className="p-2 rounded-lg bg-[#1F3A5F]/10">
                <Shield className="w-4 h-4 text-[#1F3A5F]" />
              </div>
              System Status & Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 sm:p-5 bg-gradient-to-br from-[#2FBF71]/5 to-transparent rounded-xl border border-[#2FBF71]/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-[#2FBF71]/10">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#2FBF71]" />
                  </div>
                  <p className="font-semibold text-sm sm:text-base">Server Status</p>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">All systems operational</p>
              </div>
              
              <div className="p-4 sm:p-5 bg-gradient-to-br from-[#1F3A5F]/5 to-transparent rounded-xl border border-[#1F3A5F]/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-[#1F3A5F]/10">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#1F3A5F]" />
                  </div>
                  <p className="font-semibold text-sm sm:text-base">Active Sessions</p>
                </div>
                <p className="text-xs sm:text-sm text-slate-500" data-testid="stat-active-sessions">342 users online</p>
              </div>
              
              <div className={`p-4 sm:p-5 rounded-xl border ${activity?.pendingReviews && activity.pendingReviews > 0 ? 'bg-gradient-to-br from-amber-500/5 to-transparent border-amber-200' : 'bg-gradient-to-br from-slate-100/50 to-transparent border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${activity?.pendingReviews && activity.pendingReviews > 0 ? 'bg-amber-500/10' : 'bg-slate-200/50'}`}>
                    <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 ${activity?.pendingReviews && activity.pendingReviews > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                  </div>
                  <p className="font-semibold text-sm sm:text-base">System Alerts</p>
                </div>
                <p className="text-xs sm:text-sm text-slate-500" data-testid="stat-pending-approvals">
                  {activity?.pendingReviews || 0} course approvals needed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;
