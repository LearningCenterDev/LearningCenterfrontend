import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Search, Eye, Mail, Phone, MapPin, Calendar, User as UserIcon, MessageCircle, UserCheck, Baby } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import type { User } from "@shared/schema";
import { ViewModeToggle, type ViewMode } from "@/components/ViewModeToggle";

interface FinanceUsersProps {
  financeAdminId: string;
}

export default function FinanceUsers({ financeAdminId }: FinanceUsersProps) {
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleMessageUser = (e: React.MouseEvent, recipientId: string) => {
    e.stopPropagation();
    navigate(`/messages?user=${recipientId}`);
  };

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch parent info for selected student
  const { data: parentInfo } = useQuery<User>({
    queryKey: [`/api/users/${selectedUser?.id}/parents`],
    enabled: selectedUser?.role === "student",
  });

  // Fetch children for selected parent
  const { data: children = [] } = useQuery<User[]>({
    queryKey: [`/api/parents/${selectedUser?.id}/children`],
    enabled: selectedUser?.role === "parent",
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === "" || 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleColors = {
    student: "secondary",
    teacher: "default",
    parent: "outline",
    admin: "destructive",
    finance_admin: "default"
  } as const;

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Users Directory
          </h1>
          <p className="text-muted-foreground mt-1">Read-only view of all platform users</p>
        </div>
        <Badge variant="secondary" className="bg-[#000000] text-white text-xs px-2 py-1">
          <Eye className="w-3 h-3 mr-1" />
          View Only
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <ViewModeToggle currentMode={viewMode} onModeChange={setViewMode} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-users"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-role-filter">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="parent">Parents</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="finance_admin">Finance Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : viewMode === "table" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow 
                    key={user.id} 
                    data-testid={`user-row-${user.id}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedUser(user)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatarUrl || user.profileImageUrl || undefined} />
                          <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || `${user.firstName} ${user.lastName}`}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => handleMessageUser(e, user.id)}
                          data-testid={`button-message-${user.id}`}
                        >
                          <MessageCircle className="w-4 h-4 text-primary" />
                        </Button>
                        <Badge 
                          variant={roleColors[user.role as keyof typeof roleColors] || "default"}
                          className={user.role === 'teacher' ? 'bg-purple-600 text-white' : ''}
                        >
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.phone ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {user.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                      <p className="text-muted-foreground">No users found matching your criteria</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors" 
                  data-testid={`user-list-${user.id}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatarUrl || user.profileImageUrl || undefined} />
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{user.name || `${user.firstName} ${user.lastName}`}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(e) => handleMessageUser(e, user.id)}
                    data-testid={`button-message-list-${user.id}`}
                  >
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </Button>
                  <Badge 
                    variant={roleColors[user.role as keyof typeof roleColors] || "default"}
                    className={user.role === 'teacher' ? 'bg-purple-600 text-white' : ''}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
                  </Badge>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {user.phone}
                    </div>
                  )}
                  <Badge variant={user.isActive ? 'default' : 'destructive'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">No users found matching your criteria</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((user) => (
                <Card 
                  key={user.id} 
                  className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors" 
                  data-testid={`user-card-${user.id}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatarUrl || user.profileImageUrl || undefined} />
                        <AvatarFallback>{getInitials(user)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium truncate">{user.name || `${user.firstName} ${user.lastName}`}</h4>
                          <Badge variant={user.isActive ? 'default' : 'destructive'} className="shrink-0">
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => handleMessageUser(e, user.id)}
                            data-testid={`button-message-card-${user.id}`}
                          >
                            <MessageCircle className="w-4 h-4 text-primary" />
                          </Button>
                          <Badge 
                            variant={roleColors[user.role as keyof typeof roleColors] || "default"}
                            className={user.role === 'teacher' ? 'bg-purple-600 text-white' : ''}
                          >
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 shrink-0" />
                              {user.phone}
                            </div>
                          )}
                          {user.address && (
                            <div className="flex items-center gap-2 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{user.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredUsers.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">No users found matching your criteria</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              User Details
            </DialogTitle>
            <DialogDescription>
              View user profile information
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatarUrl || selectedUser.profileImageUrl || undefined} />
                  <AvatarFallback className="text-lg">{getInitials(selectedUser)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedUser.name || `${selectedUser.firstName} ${selectedUser.lastName}`}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant={roleColors[selectedUser.role as keyof typeof roleColors] || "default"}
                      className={selectedUser.role === 'teacher' ? 'bg-purple-600 text-white' : ''}
                    >
                      {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1).replace('_', ' ')}
                    </Badge>
                    <Badge variant={selectedUser.isActive ? 'default' : 'destructive'}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                </div>

                {selectedUser.phone && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedUser.phone}</p>
                    </div>
                  </div>
                )}

                {selectedUser.address && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">{selectedUser.address}</p>
                    </div>
                  </div>
                )}

                {selectedUser.dateOfBirth && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{formatDate(selectedUser.dateOfBirth)}</p>
                    </div>
                  </div>
                )}

                {selectedUser.createdAt && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Member Since</p>
                      <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                  </div>
                )}

                {/* Parent-Student Relationship for Students */}
                {selectedUser.role === "student" && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <UserCheck className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Parent/Guardian</p>
                      {parentInfo ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={parentInfo.avatarUrl || parentInfo.profileImageUrl || undefined} />
                            <AvatarFallback>{getInitials(parentInfo)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {parentInfo.name || `${parentInfo.firstName} ${parentInfo.lastName}`}
                            </p>
                            <p className="text-xs text-muted-foreground">{parentInfo.email}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-destructive font-medium mt-1">No parent assigned</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Children for Parents */}
                {selectedUser.role === "parent" && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Baby className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Children ({children.length})</p>
                      {children.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          {children.map((child) => (
                            <div key={child.id} className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={child.avatarUrl || child.profileImageUrl || undefined} />
                                <AvatarFallback>{getInitials(child)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">
                                  {child.name || `${child.firstName} ${child.lastName}`}
                                </p>
                                <p className="text-xs text-muted-foreground">{child.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">No children linked</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Button 
                className="w-full"
                onClick={(e) => {
                  handleMessageUser(e, selectedUser.id);
                  setSelectedUser(null);
                }}
                data-testid="button-send-message-dialog"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
