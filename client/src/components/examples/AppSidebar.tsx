import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from '../AppSidebar';

export default function AppSidebarExample() {
  // todo: remove mock functionality
  const handleNavigate = (path: string) => {
    console.log(`Navigation to ${path} clicked`);
  };

  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar 
          userRole="teacher" 
          userName="Dr. Sarah Wilson" 
          onNavigate={handleNavigate}
        />
      </div>
    </SidebarProvider>
  );
}