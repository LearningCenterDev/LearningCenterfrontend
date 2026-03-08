import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Home,
  BookOpen,
  FileText,
  MessageCircle,
  BarChart3,
  Settings,
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  Shield,
  User,
  Search,
  KeyRound,
  UserPlus,
  PieChart,
  LogOut,
  Loader2,
  Receipt,
  Tag,
  Building2,
  FolderOpen
} from "lucide-react";
import logoImage from "@assets/Favicon.png";

type UserRole = "student" | "parent" | "teacher" | "admin" | "finance_admin" | "partner_admin";

interface AppSidebarProps {
  userRole: UserRole;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

const menuItems = {
  student: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "My Courses", url: "/courses", icon: BookOpen },
    { title: "Assignments", url: "/assignments", icon: FileText },
    { title: "Schedule", url: "/schedule", icon: Calendar },
    { title: "Messages", url: "/messages", icon: MessageCircle },
    { title: "Progress", url: "/progress", icon: BarChart3 },
    { title: "Profile", url: "/profile", icon: User },
  ],
  parent: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Child Progress", url: "/progress", icon: BarChart3 },
    { title: "Reports", url: "/reports", icon: FileText },
    { title: "Payments", url: "/payments", icon: CreditCard },
    { title: "Messages", url: "/messages", icon: MessageCircle },
    { title: "Schedule", url: "/schedule", icon: Calendar },
    { title: "Profile", url: "/profile", icon: User },
  ],
  teacher: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "My Courses", url: "/courses", icon: BookOpen },
    { title: "Assignments", url: "/assignments", icon: FileText },
    { title: "Messages", url: "/messages", icon: MessageCircle },
    { title: "Schedule", url: "/schedule", icon: Calendar },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
    { title: "Profile", url: "/profile", icon: User },
  ],
  admin: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "User Management", url: "/users", icon: Users },
    { title: "Course Management", url: "/courses", icon: BookOpen },
    { title: "Partners", url: "/partners", icon: Building2 },
    { title: "Schedule", url: "/schedule", icon: Calendar },
    { title: "Teacher Sessions", url: "/teacher-session-stats", icon: GraduationCap },
    { title: "Messages", url: "/messages", icon: MessageCircle },
    { title: "Password Resets", url: "/password-reset-requests", icon: KeyRound },
    { title: "Profile", url: "/profile", icon: User },
  ],
  finance_admin: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Prospect Students", url: "/prospect-students", icon: UserPlus },
    { title: "Users", url: "/finance/users", icon: Users },
    { title: "Courses", url: "/finance/courses", icon: BookOpen },
    { title: "Teacher Sessions", url: "/teacher-session-stats", icon: GraduationCap },
    { title: "Financials", url: "/finances", icon: CreditCard },
    { title: "Reports", url: "/finances/reports", icon: PieChart },
    { title: "Messages", url: "/messages", icon: MessageCircle },
    { title: "Profile", url: "/profile", icon: User },
  ],
  partner_admin: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Users", url: "/users", icon: Users },
    { title: "Prospect Students", url: "/prospect-students", icon: UserPlus },
    { title: "Messages", url: "/messages", icon: MessageCircle },
    { title: "Profile", url: "/profile", icon: User },
  ]
};

export function AppSidebar({ userRole, onNavigate, onLogout, isLoggingOut }: AppSidebarProps) {
  const [location, navigate] = useLocation();
  
  const { data: newProspectsData } = useQuery<{ count: number }>({
    queryKey: ['/api/admin/prospect-students/count/new'],
    enabled: userRole === 'admin' || userRole === 'finance_admin',
    refetchInterval: 30000,
  });

  const newProspectCount = newProspectsData?.count || 0;
  
  const handleNavigation = (url: string) => {
    navigate(url);
    onNavigate?.(url);
    console.log(`Navigating to ${url}`);
  };

  return (
    <Sidebar collapsible="icon" className="[&_[data-slot=sidebar-inner]]:rounded-r-xl [&_[data-slot=sidebar-inner]]:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]">
      <SidebarHeader className="flex flex-col gap-2 p-4 pt-[24px] pb-[24px] group-data-[state=collapsed]:p-2 group-data-[state=collapsed]:pt-4">
        <div className="flex flex-col items-center gap-2">
          <div className="p-1.5 bg-white rounded-xl shadow-lg">
            <img 
              src={logoImage} 
              alt="Learning Center logo" 
              className="w-12 h-12 group-data-[state=collapsed]:w-6 group-data-[state=collapsed]:h-6 transition-all" 
              loading="eager"
              width="48"
              height="48"
            />
          </div>
          <div className="text-sm text-center font-normal text-white group-data-[state=collapsed]:hidden" data-testid="text-portal-subtitle">
            {userRole === 'finance_admin' ? 'Finance Portal' : userRole === 'partner_admin' ? 'Partner Portal' : `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Portal`}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[state=collapsed]:hidden">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="group-data-[state=collapsed]:gap-2">
              {menuItems[userRole].map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <button 
                      onClick={() => handleNavigation(item.url)}
                      className="flex items-center justify-start gap-2 w-full h-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center"
                    >
                      <item.icon className="!h-6 !w-6 shrink-0" />
                      <span className="group-data-[state=collapsed]:hidden">{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {userRole === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[state=collapsed]:hidden">Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="group-data-[state=collapsed]:gap-2">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === "/prospect-students"}
                    data-testid="nav-prospect-students"
                  >
                    <button 
                      onClick={() => handleNavigation("/prospect-students")}
                      className="flex items-center justify-between gap-2 w-full h-full group-data-[collapsible=icon]:justify-center"
                    >
                      <span className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                        <UserPlus className="!h-6 !w-6 shrink-0" />
                        <span className="group-data-[state=collapsed]:hidden">Prospect Students</span>
                      </span>
                      {newProspectCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="group-data-[state=collapsed]:hidden ml-auto"
                          data-testid="badge-new-prospects"
                        >
                          {newProspectCount}
                        </Badge>
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === "/documents"}
                    data-testid="nav-documents"
                  >
                    <button 
                      onClick={() => handleNavigation("/documents")}
                      className="flex items-center justify-start gap-2 w-full h-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center"
                    >
                      <FolderOpen className="!h-6 !w-6 shrink-0" />
                      <span className="group-data-[state=collapsed]:hidden">Documents</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === "/analytics"}
                    data-testid="nav-system-analytics"
                  >
                    <button 
                      onClick={() => handleNavigation("/analytics")}
                      className="flex items-center justify-start gap-2 w-full h-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center"
                    >
                      <BarChart3 className="!h-6 !w-6 shrink-0" />
                      <span className="group-data-[state=collapsed]:hidden">System Analytics</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === "/settings"}
                    data-testid="nav-settings"
                  >
                    <button 
                      onClick={() => handleNavigation("/settings")}
                      className="flex items-center justify-start gap-2 w-full h-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center"
                    >
                      <Settings className="!h-6 !w-6 shrink-0" />
                      <span className="group-data-[state=collapsed]:hidden">Settings</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        
        
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-3">
          {/* Sign Out button - visible on mobile only (sm and below) */}
          {onLogout && (
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                disabled={isLoggingOut}
                className="w-full gap-2 text-white/70 hover:text-white hover:bg-white/10 justify-start group-data-[state=collapsed]:justify-center"
                data-testid="button-logout-sidebar"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span className="group-data-[state=collapsed]:hidden">Sign Out</span>
              </Button>
            </div>
          )}
          <div className="flex flex-col items-center justify-center gap-1 group-data-[state=collapsed]:hidden">
            <p className="text-xs text-[#e6e8ed]/60">© 2025. All rights reserved.</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;