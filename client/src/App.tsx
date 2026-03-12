import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { PasswordResetDialog } from "@/components/PasswordResetDialog";
import { useWebSocket } from "@/hooks/useWebSocket";

// Layout & Routes
import DashboardLayout from "@/components/layout/DashboardLayout";
import AppRoutes from "@/routes/AppRoutes";
import ScrollToTop from "@/components/ScrollToTop";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";

// Public Pages
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
import ActivationPage from "@/pages/ActivationPage";
import logoImage from "@assets/Favicon.png";

function AuthenticatedApp() {
  const { user, isLoading, isAuthenticated, logout, isLoggingOut } = useAuth();
  const [location, navigate] = useLocation();
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Initialize WebSocket connection
  useWebSocket(user || null);

  // Check if user requires password reset
  useEffect(() => {
    if (user && (user as any).requiresPasswordReset) {
      setShowPasswordReset(true);
    }
  }, [user]);

  // Handle Redirects
  useEffect(() => {
    const publicPaths = ["/", "/login", "/activate", "/about", "/courses", "/course/", "/contact", "/careers", "/privacy", "/terms", "/thank-you", "/resources", "/experts"];
    const isPublicPath = publicPaths.some(path =>
      path === location || location.startsWith(path === "/" ? "/@" : path)
    );

    if (!isLoading && !isAuthenticated && !isLoggingOut && !isPublicPath) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, isLoggingOut, location, navigate]);

  if (location.startsWith('/activate/')) {
    return (
      <Switch>
        <Route path="/activate/:token" component={ActivationPage} />
      </Switch>
    );
  }

  if (isLoading || isLoggingOut) {
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
          <Route path="/experts/:teacherId" component={({ params }) => <ExpertDetail teacherId={params.teacherId} />} />
          <Route path="/experts" component={Experts} />
          <Route path="/" component={Landing} />
          <Route component={() => <Redirect to="/login" />} />
        </Switch>
      </>
    );
  }

  return (
    <>
      <ScrollToTop />
      <DashboardLayout>
        <AppRoutes />
      </DashboardLayout>

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
