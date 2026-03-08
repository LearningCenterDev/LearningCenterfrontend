import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock as ClockComponent } from "./Clock";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Users,
  UserPlus,
  MessageCircle,
  Building2,
  ArrowUpRight,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";

interface PartnerAdminDashboardProps {
  partnerAdminId: string;
  partnerAdminName: string;
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
}

interface ProspectStudent {
  id: string;
  studentName: string;
  status: string;
  state?: string;
  country?: string;
  createdAt?: string;
}

export default function PartnerAdminDashboard({ partnerAdminId, partnerAdminName }: PartnerAdminDashboardProps) {
  const [, navigate] = useLocation();

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    refetchInterval: 30000,
  });

  const { data: prospectStudents = [], isLoading: prospectsLoading } = useQuery<ProspectStudent[]>({
    queryKey: ["/api/admin/prospect-students"],
    refetchInterval: 30000,
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery<{ sent: any[]; received: any[] }>({
    queryKey: ["/api/users", partnerAdminId, "messages"],
    refetchInterval: 15000,
  });

  const receivedMessages = messagesData?.received || [];
  const unreadMessagesCount = receivedMessages.filter(msg => !msg.isRead).length;

  const isLoading = usersLoading || prospectsLoading || messagesLoading;

  const activeUsers = users.filter(u => u.isActive !== false);
  const studentCount = users.filter(u => u.role === 'student').length;
  const parentCount = users.filter(u => u.role === 'parent').length;

  const newProspects = prospectStudents.filter(p => p.status === 'new');
  const pendingProspects = prospectStudents.filter(p => p.status === 'pending' || p.status === 'contacted');
  const convertedProspects = prospectStudents.filter(p => p.status === 'converted');

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  const recentProspects = [...prospectStudents]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500">New</Badge>;
      case 'contacted':
        return <Badge className="bg-yellow-500">Contacted</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'converted':
        return <Badge className="bg-green-500">Converted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            Welcome, {partnerAdminName}
          </h1>
          <p className="text-muted-foreground mt-1">Partner Administration Dashboard</p>
        </div>
        <ClockComponent />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20 hover-elevate cursor-pointer" onClick={() => navigate('/users')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{activeUsers.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {studentCount} students, {parentCount} parents
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20 hover-elevate cursor-pointer" onClick={() => navigate('/prospect-students')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Prospects</p>
                <p className="text-2xl font-bold">{newProspects.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingProspects.length} in progress
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <UserPlus className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20 hover-elevate cursor-pointer" onClick={() => navigate('/prospect-students')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{convertedProspects.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total converted
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <CheckCircle className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20 hover-elevate cursor-pointer" onClick={() => navigate('/messages')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unread Messages</p>
                <p className="text-2xl font-bold">{unreadMessagesCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {receivedMessages.length} total received
                </p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <MessageCircle className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recent Users
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
              View All
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate">
                    <div>
                      <p className="font-medium">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="capitalize">{user.role}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Recent Prospects
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/prospect-students')}>
              View All
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentProspects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No prospects found</p>
            ) : (
              <div className="space-y-3">
                {recentProspects.map(prospect => (
                  <div key={prospect.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate">
                    <div>
                      <p className="font-medium">{prospect.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {[prospect.state, prospect.country].filter(Boolean).join(", ") || "No location"} • {formatDate(prospect.createdAt)}
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(prospect.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
