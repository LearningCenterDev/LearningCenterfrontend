import React from "react";
import AppSidebar from "../AppSidebar";
import ThemeToggle from "../ThemeToggle";
import { NotificationBellContainer } from "../NotificationBellContainer";
import { Button } from "../ui/button";
import { SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { LogOut, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import logoImage from "@assets/Favicon.png";

const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "5rem",
};

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, logout, isLoggingOut } = useAuth();

    if (!user) return null;

    const firstName = user.firstName || user.name?.split(' ')[0] || 'User';

    return (
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
                                    {/* Sign Out button */}
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
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
