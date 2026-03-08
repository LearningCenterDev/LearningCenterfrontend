import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { PasswordResetDialog } from "@/components/PasswordResetDialog";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import About from "@/pages/About";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Contact from "@/pages/Contact";
import Resources from "@/pages/Resources";
import Careers from "@/pages/Careers";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import ThankYou from "@/pages/ThankYou";
import Experts from "@/pages/Experts";
import ExpertDetail from "@/pages/ExpertDetail";
import logoImage from "@assets/Favicon.png";

// Components
import AppSidebar from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { NotificationBellContainer } from "@/components/NotificationBellContainer";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, Sparkles } from "lucide-react";
import ScrollToTop from "@/components/ScrollToTop";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";
import StudentDashboard from "@/components/StudentDashboard";
import TeacherDashboard from "@/components/TeacherDashboard";
import ParentDashboard from "@/components/ParentDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import NotFound from "@/pages/not-found";
import { CourseDetails } from "@/components/CourseDetails";
import type { User as SchemaUser } from "@shared/schema";

// Student Pages
import StudentMyCourses from "@/pages/student/MyCourses";
import StudentBrowseCourses from "@/pages/student/BrowseCourses";
import StudentAssignments from "@/pages/student/Assignments";
import StudentSchedule from "@/pages/student/Schedule";
import StudentMessages from "@/pages/student/Messages";
import StudentProgress from "@/pages/student/Progress";

// Teacher Pages
import TeacherMyCourses from "@/pages/teacher/MyCourses";
import TeacherCoursePage from "@/pages/teacher/TeacherCoursePage";
import TeacherAssignments from "@/pages/teacher/Assignments";
import TeacherStudents from "@/pages/teacher/Students";
import StudentDetailPage from "@/pages/teacher/StudentDetailPage";
import TeacherMessages from "@/pages/teacher/Messages";
import TeacherSchedule from "@/pages/teacher/Schedule";
import TeacherAnalytics from "@/pages/teacher/Analytics";

// Parent Pages
import ParentChildProgress from "@/pages/parent/ChildProgress";
import ParentMessages from "@/pages/parent/Messages";
import ParentReports from "@/pages/parent/Reports";
import ParentSchedule from "@/pages/parent/Schedule";
import ParentPayments from "@/pages/parent/Payments";

// Admin Pages
import AdminUserManagement from "@/pages/admin/UserManagement";
import AdminUserDetailPage from "@/pages/admin/UserDetailPage";
import AdminCourseManagement from "@/pages/admin/CourseManagement";
import AdminCoursePage from "@/pages/admin/AdminCoursePage";
import AdminFinancialReports from "@/pages/admin/FinancialReports";
import AdminSystemAnalytics from "@/pages/admin/SystemAnalytics";
import AdminSettings from "@/pages/admin/Settings";
import DocumentManagement from "@/pages/admin/DocumentManagement";
import AdminMessages from "@/pages/admin/Messages";
import AdminSchedule from "@/pages/admin/Schedule";
import AdminFeeAssignments from "@/pages/admin/FeeAssignments";
import AdminInvoices from "@/pages/admin/Invoices";
import AdminPayments from "@/pages/admin/Payments";
import AdminPasswordResetRequests from "@/pages/admin/PasswordResetRequests";
import AdminProspectStudents from "@/pages/admin/ProspectStudents";
import TeacherSessionStats from "@/pages/admin/TeacherSessionStats";
import PartnerManagement from "@/pages/admin/PartnerManagement";
import PartnerDetails from "@/pages/admin/PartnerDetails";

// Finance Admin Pages
import FinanceAdminDashboard from "@/components/FinanceAdminDashboard";
import FinanceUsers from "@/pages/finance/Users";
import FinanceCourses from "@/pages/finance/Courses";
import FinanceMessages from "@/pages/finance/Messages";
import FinancePayments from "@/pages/finance/Payments";
import FinanceReports from "@/pages/finance/Reports";

// Partner Admin Pages
import PartnerAdminDashboard from "@/components/PartnerAdminDashboard";
import PartnerAdminUsers from "@/pages/partner_admin/Users";
import PartnerAdminProspectStudents from "@/pages/partner_admin/ProspectStudents";

// Common Pages
import Profile from "@/pages/Profile";
import ActivationPage from "@/pages/ActivationPage";

type UserRole = "student" | "parent" | "teacher" | "admin" | "finance_admin" | "partner_admin";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  avatarUrl: string | null;
  profileImageUrl: string | null;
}

function CourseDetailWithBackButton({ courseId, currentUser }: { courseId: string; currentUser: SchemaUser }) {
  const [, navigate] = useLocation();
  return <CourseDetails courseId={courseId} currentUser={currentUser} onNavigateBack={() => navigate("/courses")} />;
}

function Router() {
  const { user } = useAuth();

  // If no user, show a loading state or return null (parent handles auth redirect)
  if (!user) {
    return null;
  }

  const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';

  return (
    <Switch>
      {/* Dashboard Routes */}
      <Route path="/" component={() => {
        switch (user.role) {
          case "student":
            return <StudentDashboard studentId={user.id} studentName={displayName} />;
          case "teacher":
            return <TeacherDashboard teacherId={user.id} teacherName={displayName} />;
          case "parent":
            return <ParentDashboard parentId={user.id} parentName={displayName} />;
          case "admin":
            return <AdminDashboard adminId={user.id} adminName={displayName} />;
          case "finance_admin":
            return <FinanceAdminDashboard financeAdminId={user.id} financeAdminName={displayName} />;
          case "partner_admin":
            return <PartnerAdminDashboard partnerAdminId={user.id} partnerAdminName={displayName} />;
          default:
            return <NotFound />;
        }
      }} />
      <Route path="/dashboard" component={() => {
        switch (user.role) {
          case "student":
            return <StudentDashboard studentId={user.id} studentName={displayName} />;
          case "teacher":
            return <TeacherDashboard teacherId={user.id} teacherName={displayName} />;
          case "parent":
            return <ParentDashboard parentId={user.id} parentName={displayName} />;
          case "admin":
            return <AdminDashboard adminId={user.id} adminName={displayName} />;
          case "finance_admin":
            return <FinanceAdminDashboard financeAdminId={user.id} financeAdminName={displayName} />;
          case "partner_admin":
            return <PartnerAdminDashboard partnerAdminId={user.id} partnerAdminName={displayName} />;
          default:
            return <NotFound />;
        }
      }} />

      {/* Courses Routes */}
      <Route path="/courses" component={() => {
        switch (user.role) {
          case "student":
            return <StudentMyCourses studentId={user.id} />;
          case "teacher":
            return <TeacherMyCourses teacherId={user.id} />;
          case "admin":
            return <AdminCourseManagement adminId={user.id} />;
          default:
            return <NotFound />;
        }
      }} />

      {/* Course Detail Routes */}
      <Route path="/courses/:courseId" component={({ params }: { params: { courseId: string }}) => {
        if (user.role === "teacher") {
          return <TeacherCoursePage courseId={params.courseId} teacherId={user.id} />;
        }
        if (user.role === "admin") {
          return <AdminCoursePage courseId={params.courseId} adminId={user.id} />;
        }
        return <CourseDetailWithBackButton courseId={params.courseId} currentUser={user} />;
      }} />

      {/* Browse Courses Routes */}
      <Route path="/browse-courses" component={() => {
        switch (user.role) {
          case "student":
            return <StudentBrowseCourses studentId={user.id} />;
          case "teacher":
            return <StudentBrowseCourses studentId={user.id} />;
          case "parent":
            return <StudentBrowseCourses studentId={user.id} />;
          case "admin":
            return <StudentBrowseCourses studentId={user.id} />;
          default:
            return <NotFound />;
        }
      }} />

      {/* Assignments Routes */}
      <Route path="/assignments" component={() => {
        switch (user.role) {
          case "student":
            return <StudentAssignments studentId={user.id} />;
          case "teacher":
            return <TeacherAssignments teacherId={user.id} />;
          default:
            return <NotFound />;
        }
      }} />

      {/* Schedule Routes */}
      <Route path="/schedule" component={() => {
        switch (user.role) {
          case "student":
            return <StudentSchedule studentId={user.id} />;
          case "teacher":
            return <TeacherSchedule teacherId={user.id} />;
          case "parent":
            return <ParentSchedule parentId={user.id} />;
          case "admin":
            return <AdminSchedule adminId={user.id} />;
          default:
            return <NotFound />;
        }
      }} />

      {/* Messages Routes */}
      <Route path="/messages" component={() => {
        switch (user.role) {
          case "student":
            return <StudentMessages studentId={user.id} />;
          case "teacher":
            return <TeacherMessages teacherId={user.id} />;
          case "parent":
            return <ParentMessages parentId={user.id} />;
          case "admin":
            return <AdminMessages adminId={user.id} />;
          case "finance_admin":
            return <FinanceMessages financeAdminId={user.id} />;
          case "partner_admin":
            return <AdminMessages adminId={user.id} />;
          default:
            return <NotFound />;
        }
      }} />

      {/* Progress Routes */}
      <Route path="/progress" component={() => {
        switch (user.role) {
          case "student":
            return <StudentProgress studentId={user.id} />;
          case "parent":
            return <ParentChildProgress parentId={user.id} />;
          default:
            return <NotFound />;
        }
      }} />

      {/* Analytics Routes */}
      <Route path="/analytics" component={() => {
        switch (user.role) {
          case "teacher":
            return <TeacherAnalytics teacherId={user.id} />;
          case "admin":
            return <AdminSystemAnalytics adminId={user.id} />;
          default:
            return <NotFound />;
        }
      }} />

      {/* Student Detail Route (for teachers) */}
      <Route path="/students/:studentId" component={({ params }: { params: { studentId: string }}) => {
        if (user.role === "teacher") {
          return <StudentDetailPage />;
        }
        return <NotFound />;
      }} />

      {/* Teacher-specific Routes */}
      <Route path="/students" component={() => {
        if (user.role === "teacher") {
          return <TeacherStudents teacherId={user.id} />;
        }
        return <NotFound />;
      }} />

      {/* Parent-specific Routes */}
      <Route path="/reports" component={() => {
        if (user.role === "parent") {
          return <ParentReports parentId={user.id} />;
        }
        return <NotFound />;
      }} />

      <Route path="/payments" component={() => {
        if (user.role === "parent") {
          return <ParentPayments parentId={user.id} />;
        }
        return <NotFound />;
      }} />

      {/* Admin-specific Routes */}
      <Route path="/users/:userId" component={({ params }: { params: { userId: string }}) => {
        if (user.role === "admin") {
          return <AdminUserDetailPage />;
        }
        return <NotFound />;
      }} />

      <Route path="/users" component={() => {
        if (user.role === "admin") {
          return <AdminUserManagement adminId={user.id} />;
        }
        if (user.role === "partner_admin") {
          return <PartnerAdminUsers />;
        }
        return <NotFound />;
      }} />

      <Route path="/partners/:partnerId" component={({ params }: { params: { partnerId: string }}) => {
        if (user.role === "admin") {
          return <PartnerDetails partnerId={params.partnerId} />;
        }
        return <NotFound />;
      }} />

      <Route path="/partners" component={() => {
        if (user.role === "admin") {
          return <PartnerManagement />;
        }
        return <NotFound />;
      }} />

      <Route path="/finances" component={() => {
        if (user.role === "admin" || user.role === "finance_admin") {
          return <AdminFinancialReports adminId={user.id} />;
        }
        return <NotFound />;
      }} />

      
      <Route path="/fee-assignments" component={() => {
        if (user.role === "admin" || user.role === "finance_admin") {
          return <AdminFeeAssignments />;
        }
        return <NotFound />;
      }} />

      <Route path="/invoices" component={() => {
        if (user.role === "admin" || user.role === "finance_admin") {
          return <AdminInvoices />;
        }
        return <NotFound />;
      }} />

      <Route path="/admin-payments" component={() => {
        if (user.role === "admin" || user.role === "finance_admin") {
          return <AdminPayments />;
        }
        return <NotFound />;
      }} />

      <Route path="/finance-payments" component={() => {
        if (user.role === "finance_admin") {
          return <FinancePayments financeAdminId={user.id} />;
        }
        return <NotFound />;
      }} />

      <Route path="/password-reset-requests" component={() => {
        if (user.role === "admin") {
          return <AdminPasswordResetRequests />;
        }
        return <NotFound />;
      }} />

      <Route path="/prospect-students" component={() => {
        if (user.role === "admin" || user.role === "finance_admin") {
          return <AdminProspectStudents adminId={user.id} />;
        }
        if (user.role === "partner_admin") {
          return <PartnerAdminProspectStudents />;
        }
        return <NotFound />;
      }} />

      <Route path="/teacher-session-stats" component={() => {
        if (user.role === "admin" || user.role === "finance_admin") {
          return <TeacherSessionStats userId={user.id} />;
        }
        return <NotFound />;
      }} />

      {/* Finance Admin-specific Routes */}
      <Route path="/finance/users" component={() => {
        if (user.role === "finance_admin") {
          return <FinanceUsers financeAdminId={user.id} />;
        }
        return <NotFound />;
      }} />

      <Route path="/finance/courses" component={() => {
        if (user.role === "finance_admin") {
          return <FinanceCourses financeAdminId={user.id} />;
        }
        return <NotFound />;
      }} />

      <Route path="/finances/reports" component={() => {
        if (user.role === "finance_admin") {
          return <FinanceReports />;
        }
        return <NotFound />;
      }} />

      <Route path="/documents" component={() => {
        if (user.role === "admin") {
          return <DocumentManagement adminId={user.id} />;
        }
        return <NotFound />;
      }} />

      <Route path="/settings" component={() => {
        if (user.role === "admin") {
          return <AdminSettings adminId={user.id} />;
        }
        return <NotFound />;
      }} />

      {/* Profile Route - Available to all users */}
      <Route path="/profile" component={() => <Profile />} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, isLoading, isAuthenticated, logout, isLoggingOut } = useAuth();
  const [location, navigate] = useLocation();
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Check if user requires password reset after successful authentication
  useEffect(() => {
    if (user && (user as any).requiresPasswordReset) {
      setShowPasswordReset(true);
    }
  }, [user]);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    if (!user) return;

    // Construct WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}&role=${user.role}`;

    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      (window as any).__ws = ws;
    };

    ws.onerror = () => {
      console.error('WebSocket error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      (window as any).__ws = null;
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (!((window as any).__ws)) {
          const newWs = new WebSocket(wsUrl);
          newWs.onopen = () => {
            console.log('WebSocket reconnected');
            (window as any).__ws = newWs;
          };
        }
      }, 3000);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user]);

  // Redirect to home after logout
  useEffect(() => {
    // Don't redirect if we're on a public page or on dashboard (which handles its own auth)
    const publicPaths = ["/", "/login", "/activate", "/about", "/courses", "/course/", "/contact", "/careers", "/privacy", "/terms", "/thank-you", "/resources", "/dashboard", "/experts"];
    const isPublicPath = publicPaths.some(path => 
      path === location || location.startsWith(path === "/" ? "/@" : path)
    );
    
    // Only redirect if not authenticated, not loading, not logging out, and not on a public/dashboard path
    // Skip redirect during logout since the logout function handles its own navigation
    if (!isLoading && !isAuthenticated && !isLoggingOut && !isPublicPath) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, isLoggingOut, location, navigate]);

  // Allow activation page without authentication
  if (location.startsWith('/activate/')) {
    return (
      <Switch>
        <Route path="/activate/:token" component={ActivationPage} />
      </Switch>
    );
  }

  // Show loading state for protected routes while auth is being checked
  // Also show loading during logout to prevent redirect races
  if (isLoading || isLoggingOut) {
    // Show a high-end, branded full-screen loader
    return (
      <div className="fixed inset-0 bg-[#f8fafb] dark:bg-[#0f1d34] flex items-center justify-center z-[100] transition-opacity duration-500">
        <div className="text-center relative">
          {/* Logo / Brand Element in Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-pulse"></div>
          
          {/* Spinning Portal Effect */}
          <div className="relative mb-8 flex justify-center">
            <div className="relative p-2 bg-white rounded-full shadow-lg">
              <img src={logoImage} alt="Loading..." className="w-16 h-16 relative z-10" />
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-spin"></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-[#1F3A5F] dark:text-white font-bold text-lg tracking-tight">
              {isLoggingOut ? "Safely signing out..." : "Preparing your classroom..."}
            </h3>
            <div className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <ScrollToTop />
        <FloatingThemeToggle />
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/about" component={About} />
      <Route path="/courses" component={Courses} />
      <Route path="/course/:id" component={CourseDetail} />
      <Route path="/contact" component={Contact} />
      <Route path="/resources" component={Resources} />
      <Route path="/careers" component={Careers} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/thank-you" component={ThankYou} />
      <Route path="/experts/:teacherId" component={({ params }: { params: { teacherId: string } }) => <ExpertDetail teacherId={params.teacherId} />} />
      <Route path="/experts" component={Experts} />
      <Route path="/dashboard" component={() => <Redirect to="/login" />} />
      <Route path="/" component={Landing} />
      <Route component={() => <Redirect to="/login" />} />
    </Switch>
      </>
    );
  }

  const firstName = user.firstName || user.name?.split(' ')[0] || 'User';

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "5rem",
  };

  return (
    <>
      <ScrollToTop />
      <SidebarProvider defaultOpen={true} style={sidebarStyle as React.CSSProperties}>
        <div className="flex h-screen w-full bg-background" data-testid="app-container">
          <AppSidebar 
            userRole={user.role}
            onLogout={logout}
            isLoggingOut={isLoggingOut}
          />
          
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header */}
            <header className="border-b bg-background shadow-lg z-10 relative">
              <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  {/* Sidebar Toggle and Welcome Text */}
                  <div className="flex items-center gap-3">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <div className="text-sm sm:text-base font-medium">
                      Welcome, <span className="text-[#1F3A5F] dark:text-[#2FBF71]">{firstName}</span>
                    </div>
                  </div>
                  
                  {/* Right Section */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <NotificationBellContainer />
                    <ThemeToggle />
                    {/* Sign Out button - hidden on mobile (shown in sidebar instead) */}
                    {logout && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={logout}
                        disabled={isLoggingOut}
                        className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground"
                        data-testid="button-logout"
                      >
                        {isLoggingOut ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                        <span>Sign Out</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto bg-background">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>

      {/* Password Reset Dialog for First-Time Parent Login */}
      <PasswordResetDialog 
        open={showPasswordReset} 
        onSuccess={() => {
          setShowPasswordReset(false);
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        }} 
      />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthenticatedApp />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
