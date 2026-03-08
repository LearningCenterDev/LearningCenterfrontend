import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Shield, Mail, Bell, Database, Users, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface SettingsProps {
  adminId: string;
}

interface SystemSettings {
  general: {
    schoolName: string;
    schoolEmail: string;
    timezone: string;
    academicYear: string;
    enableRegistration: boolean;
    enableNotifications: boolean;
  };
  security: {
    requireTwoFactor: boolean;
    passwordMinLength: number;
    sessionTimeout: number;
    enableAuditLog: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    gradeNotifications: boolean;
    attendanceAlerts: boolean;
  };
  integration: {
    enableGoogleAuth: boolean;
    enableStripePayments: boolean;
    enableEmailService: boolean;
    enableSMSService: boolean;
  };
}

export default function Settings({ adminId }: SettingsProps) {
  const [activeSection, setActiveSection] = useState("general");

  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/admin/settings"],
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
          <div className="h-8 w-32 bg-[#1F3A5F]/10 dark:bg-white/20 rounded mb-2 animate-pulse" />
          <div className="h-4 w-56 bg-[#1F3A5F]/5 dark:bg-white/10 rounded animate-pulse" />
        </div>
      </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="md:col-span-3">
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-4 bg-muted rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    general = {
      schoolName: "",
      schoolEmail: "",
      timezone: "",
      academicYear: "",
      enableRegistration: false,
      enableNotifications: false
    },
    security = {
      requireTwoFactor: false,
      passwordMinLength: 8,
      sessionTimeout: 30,
      enableAuditLog: false
    },
    notifications = {
      emailNotifications: false,
      smsNotifications: false,
      pushNotifications: false,
      gradeNotifications: false,
      attendanceAlerts: false
    },
    integration = {
      enableGoogleAuth: false,
      enableStripePayments: false,
      enableEmailService: false,
      enableSMSService: false
    }
  } = settings || {};

  const sections = [
    { id: "general", title: "General", icon: SettingsIcon },
    { id: "security", title: "Security", icon: Shield },
    { id: "notifications", title: "Notifications", icon: Bell },
    { id: "integrations", title: "Integrations", icon: Database },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">School Name</label>
          <Input defaultValue={general.schoolName} placeholder="Enter school name" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">School Email</label>
          <Input defaultValue={general.schoolEmail} placeholder="school@example.com" type="email" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Timezone</label>
          <Input defaultValue={general.timezone} placeholder="UTC-5" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Academic Year</label>
          <Input defaultValue={general.academicYear} placeholder="2024-2025" />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Enable Registration</h4>
            <p className="text-xs text-muted-foreground">Allow new users to register</p>
          </div>
          <Switch defaultChecked={general.enableRegistration} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Enable Notifications</h4>
            <p className="text-xs text-muted-foreground">Send system notifications</p>
          </div>
          <Switch defaultChecked={general.enableNotifications} />
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Require Two-Factor Authentication</h4>
          <p className="text-xs text-muted-foreground">Enforce 2FA for all users</p>
        </div>
        <Switch defaultChecked={security.requireTwoFactor} />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Minimum Password Length</label>
        <Input type="number" defaultValue={security.passwordMinLength} min="6" max="50" />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Session Timeout (minutes)</label>
        <Input type="number" defaultValue={security.sessionTimeout} min="5" max="480" />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Enable Audit Logging</h4>
          <p className="text-xs text-muted-foreground">Log all system activities</p>
        </div>
        <Switch defaultChecked={security.enableAuditLog} />
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Email Notifications</h4>
          <p className="text-xs text-muted-foreground">Send notifications via email</p>
        </div>
        <Switch defaultChecked={notifications.emailNotifications} />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">SMS Notifications</h4>
          <p className="text-xs text-muted-foreground">Send notifications via SMS</p>
        </div>
        <Switch defaultChecked={notifications.smsNotifications} />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Push Notifications</h4>
          <p className="text-xs text-muted-foreground">Send browser push notifications</p>
        </div>
        <Switch defaultChecked={notifications.pushNotifications} />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Grade Notifications</h4>
          <p className="text-xs text-muted-foreground">Notify parents of new grades</p>
        </div>
        <Switch defaultChecked={notifications.gradeNotifications} />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Attendance Alerts</h4>
          <p className="text-xs text-muted-foreground">Alert parents of absences</p>
        </div>
        <Switch defaultChecked={notifications.attendanceAlerts} />
      </div>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Google Authentication</h4>
          <p className="text-xs text-muted-foreground">Allow login with Google accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch defaultChecked={integration.enableGoogleAuth} />
          <Badge variant={integration.enableGoogleAuth ? 'default' : 'destructive'} className="text-xs">
            {integration.enableGoogleAuth ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Stripe Payments</h4>
          <p className="text-xs text-muted-foreground">Process payments through Stripe</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch defaultChecked={integration.enableStripePayments} />
          <Badge variant={integration.enableStripePayments ? 'default' : 'destructive'} className="text-xs">
            {integration.enableStripePayments ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Email Service</h4>
          <p className="text-xs text-muted-foreground">Send emails through external service</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch defaultChecked={integration.enableEmailService} />
          <Badge variant={integration.enableEmailService ? 'default' : 'destructive'} className="text-xs">
            {integration.enableEmailService ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">SMS Service</h4>
          <p className="text-xs text-muted-foreground">Send SMS through external service</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch defaultChecked={integration.enableSMSService} />
          <Badge variant={integration.enableSMSService ? 'default' : 'destructive'} className="text-xs">
            {integration.enableSMSService ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "general": return renderGeneralSettings();
      case "security": return renderSecuritySettings();
      case "notifications": return renderNotificationSettings();
      case "integrations": return renderIntegrationSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" data-testid="settings-page">
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
                  <SettingsIcon className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white">Settings</h1>
              </div>
              <p className="text-[#1F3A5F]/60 dark:text-white/60 text-sm sm:text-base font-medium">Manage system configuration and preferences</p>
            </div>
            <Button className="self-start sm:self-auto bg-[#27a862] border-[#27a862] text-white hover:bg-[#27a862]/90 dark:bg-[#27a862] dark:border-[#27a862] dark:text-white dark:hover:bg-[#27a862]/90" data-testid="button-save-settings">
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      <div className="grid gap-6 md:grid-cols-4">
        {/* Settings Navigation */}
        <div className="space-y-2">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Button
                key={section.id}
                variant={activeSection === section.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveSection(section.id)}
                data-testid={`nav-${section.id}`}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {section.title}
              </Button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const activeSection_data = sections.find(s => s.id === activeSection);
                  const IconComponent = activeSection_data?.icon || SettingsIcon;
                  return <IconComponent className="w-5 h-5 text-primary" />;
                })()}
                {sections.find(s => s.id === activeSection)?.title || "Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {renderContent()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 border rounded-lg transition-colors hover:bg-accent/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm font-medium">Database</span>
              </div>
              <Badge variant="default" className="text-xs">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg transition-colors hover:bg-accent/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm font-medium">Email Service</span>
              </div>
              <Badge variant="default" className="text-xs">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg transition-colors hover:bg-accent/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">SMS Service</span>
              </div>
              <Badge variant="secondary" className="text-xs">Limited</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}