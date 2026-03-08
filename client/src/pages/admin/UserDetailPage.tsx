import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Mail,
  Shield,
  BookOpen,
  FileText,
  Users,
  Calendar,
  CheckCircle,
  User,
  Edit,
  AlertTriangle,
  UserPlus,
  Trash2,
  Clock,
  Settings,
  File,
  Upload,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  GraduationCap,
  Award,
} from "lucide-react";
import { formatTimezoneDisplay } from "@shared/timezone-utils";
import { format } from "date-fns";
import StudentHistoryCard from "@/components/StudentHistoryCard";

type ActivityLog = {
  id: string;
  userId: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
};

function ActivityLogSection({ userId }: { userId: string }) {
  const { data: activityLogs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/users', userId, 'activity-logs'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/activity-logs`);
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      return response.json();
    },
    enabled: !!userId,
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'logout': return <Clock className="w-4 h-4 text-orange-500" />;
      default: return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading activity logs...
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (action) {
      case 'login': return 'default';
      case 'logout': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activityLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No activity recorded yet
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="py-1.5 px-2 text-xs">Action</TableHead>
                  <TableHead className="py-1.5 px-2 text-xs">Description</TableHead>
                  <TableHead className="py-1.5 px-2 text-xs">Date & Time</TableHead>
                  <TableHead className="py-1.5 px-2 text-xs">IP Address</TableHead>
                  <TableHead className="py-1.5 px-2 text-xs">Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLogs.map((log) => (
                  <TableRow key={log.id} className="h-9" data-testid={`activity-log-${log.id}`}>
                    <TableCell className="py-1.5 px-2">
                      <div className="flex items-center gap-1.5">
                        {getActionIcon(log.action)}
                        <Badge variant={getActionBadgeVariant(log.action)} className="capitalize text-xs px-1.5 py-0">
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-1.5 px-2 text-sm">{log.description}</TableCell>
                    <TableCell className="py-1.5 px-2 text-xs text-muted-foreground whitespace-nowrap">
                      {log.createdAt ? format(new Date(log.createdAt), "MMM d, yyyy h:mm a") : '-'}
                    </TableCell>
                    <TableCell className="py-1.5 px-2 text-xs text-muted-foreground font-mono">
                      {log.ipAddress || '-'}
                    </TableCell>
                    <TableCell className="py-1.5 px-2 text-xs text-muted-foreground">
                      {log.userAgent ? (
                        log.userAgent.includes('Chrome') ? 'Chrome' :
                        log.userAgent.includes('Firefox') ? 'Firefox' :
                        log.userAgent.includes('Safari') ? 'Safari' :
                        log.userAgent.includes('Edge') ? 'Edge' :
                        'Other'
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type UserDocument = {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  url: string;
  type?: string | null;
  size?: number | null;
  isVisible: boolean;
  uploadedBy: string;
  createdAt?: string;
  updatedAt?: string;
};

function DocumentsSection({ userId, isAdmin }: { userId: string; isAdmin?: boolean }) {
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', description: '', isVisible: true });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: documents = [], isLoading } = useQuery<UserDocument[]>({
    queryKey: ['/api/users', userId, 'documents'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/documents`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
    enabled: !!userId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; url: string; type?: string; size?: number; isVisible?: boolean }) => {
      const response = await apiRequest('POST', `/api/users/${userId}/documents`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'documents'] });
      toast({ title: 'Document uploaded successfully' });
      setUploadDialogOpen(false);
      setUploadForm({ name: '', description: '', isVisible: true });
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to upload document', description: error.message, variant: 'destructive' });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ documentId, isVisible }: { documentId: string; isVisible: boolean }) => {
      const response = await apiRequest('PATCH', `/api/users/${userId}/documents/${documentId}/visibility`, { isVisible });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'documents'] });
      toast({ title: 'Document visibility updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update visibility', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiRequest('DELETE', `/api/users/${userId}/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'documents'] });
      toast({ title: 'Document deleted successfully' });
      setDeleteConfirmId(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete document', description: error.message, variant: 'destructive' });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    // Pre-fill name with original filename if empty
    if (!uploadForm.name) {
      setUploadForm(prev => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  const handleSubmitUpload = async () => {
    if (!selectedFile) {
      toast({ title: 'Please select a file', variant: 'destructive' });
      return;
    }
    if (!uploadForm.name.trim()) {
      toast({ title: 'Please enter a document name', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }
      
      const { url } = await uploadResponse.json();
      
      await uploadMutation.mutateAsync({
        name: uploadForm.name.trim(),
        description: uploadForm.description.trim() || undefined,
        url,
        type: selectedFile.type,
        size: selectedFile.size,
        isVisible: uploadForm.isVisible,
      });
    } catch (error) {
      toast({ title: 'Failed to upload file', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type?: string | null) => {
    if (!type) return <File className="w-5 h-5" />;
    if (type.startsWith('image/')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (type.includes('sheet') || type.includes('excel')) return <FileText className="w-5 h-5 text-green-600" />;
    return <File className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="w-5 h-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <File className="w-5 h-5" />
            Documents ({documents.length})
          </CardTitle>
          {isAdmin && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setUploadDialogOpen(true)} data-testid="button-upload-document">
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents uploaded yet
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="py-1.5 px-3 text-xs">Name</TableHead>
                    <TableHead className="py-1.5 px-3 text-xs">Description</TableHead>
                    <TableHead className="py-1.5 px-3 text-xs">Size</TableHead>
                    <TableHead className="py-1.5 px-3 text-xs">Uploaded</TableHead>
                    {isAdmin && <TableHead className="py-1.5 px-3 text-xs text-center">Visible</TableHead>}
                    <TableHead className="py-1.5 px-3 text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} className="h-10" data-testid={`document-row-${doc.id}`}>
                      <TableCell className="py-1.5 px-3">
                        <div className="flex items-center gap-2">
                          {getFileIcon(doc.type)}
                          <span className="font-medium text-sm">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 px-3 text-sm text-muted-foreground max-w-[200px] truncate" title={doc.description || ''}>
                        {doc.description || '-'}
                      </TableCell>
                      <TableCell className="py-1.5 px-3 text-sm text-muted-foreground">
                        {formatFileSize(doc.size)}
                      </TableCell>
                      <TableCell className="py-1.5 px-3 text-sm text-muted-foreground">
                        {doc.createdAt ? format(new Date(doc.createdAt), "MMM d, yyyy") : '-'}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="py-1.5 px-3 text-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleVisibilityMutation.mutate({ documentId: doc.id, isVisible: !doc.isVisible })}
                            title={doc.isVisible ? "Click to hide from user" : "Click to make visible to user"}
                            disabled={toggleVisibilityMutation.isPending}
                            data-testid={`button-toggle-visibility-${doc.id}`}
                          >
                            {doc.isVisible ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                      <TableCell className="py-1.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => window.open(`/api/users/${userId}/documents/${doc.id}/download`, '_blank')}
                            title="Open document"
                            data-testid={`button-view-document-${doc.id}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            asChild
                            title="Download document"
                            data-testid={`button-download-document-${doc.id}`}
                          >
                            <a href={`/api/users/${userId}/documents/${doc.id}/download`} download={doc.name}>
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                          {isAdmin && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteConfirmId(doc.id)}
                              title="Delete document"
                              data-testid={`button-delete-document-${doc.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        setUploadDialogOpen(open);
        if (!open) {
          setUploadForm({ name: '', description: '', isVisible: true });
          setSelectedFile(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for this user. Supported formats: PDF, images, documents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select File *</Label>
              <Input
                type="file"
                onChange={handleFileSelect}
                disabled={uploading || uploadMutation.isPending}
                data-testid="input-file-upload"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-name">Document Name *</Label>
              <Input
                id="doc-name"
                placeholder="Enter document name"
                value={uploadForm.name}
                onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                disabled={uploading || uploadMutation.isPending}
                data-testid="input-document-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-description">Description (optional)</Label>
              <Input
                id="doc-description"
                placeholder="Enter a brief description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                disabled={uploading || uploadMutation.isPending}
                data-testid="input-document-description"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="doc-visible"
                checked={uploadForm.isVisible}
                onChange={(e) => setUploadForm(prev => ({ ...prev, isVisible: e.target.checked }))}
                disabled={uploading || uploadMutation.isPending}
                className="w-4 h-4 rounded border-gray-300"
                data-testid="checkbox-document-visible"
              />
              <Label htmlFor="doc-visible" className="text-sm font-normal cursor-pointer">
                Make visible to user
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitUpload}
              disabled={uploading || uploadMutation.isPending || !selectedFile || !uploadForm.name.trim()}
              data-testid="button-submit-document"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-document"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type UserType = {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  timezone?: string;
  subject?: string;
  education?: string;
  certifications?: string;
  avatarUrl?: string;
  profileImageUrl?: string;
  coverPhotoUrl?: string;
  isActive?: boolean;
  parentId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt?: string;
};

type Course = {
  id: string;
  title: string;
  description?: string;
  subject: string;
  grade: string;
  isActive: boolean;
  teacherId: string;
};

type Submission = {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string;
  submittedAt?: string;
  grade?: number;
};

type Assignment = {
  id: string;
  title: string;
  courseId: string;
  dueDate?: string;
  maxScore?: number;
};

type ParentChild = {
  id: string;
  parentId: string;
  childId: string;
  createdAt?: string;
};

type StudentTeacherAssignment = {
  id: string;
  studentId: string;
  courseId: string;
  teacherId?: string;
  assignedAt?: string;
};

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    phone: "",
    address: "",
    subject: "",
    dateOfBirth: "",
  });

  // Password reset form state
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
    requirePasswordChange: true,
  });

  // Fetch all users and find the specific one
  const { data: allUsers = [], isLoading: userLoading, error } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const user = allUsers.find(u => u.id === userId);

  // If loading finished and no user found, navigate back
  if (!userLoading && !user && !error) {
    setTimeout(() => navigate("/users"), 100);
  }

  // Fetch enrollments
  const { data: allEnrollments = [] } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments"],
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Fetch courses
  const { data: allCourses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Fetch submissions
  const { data: allSubmissions = [] } = useQuery<Submission[]>({
    queryKey: ["/api/submissions"],
  });

  // Fetch assignments
  const { data: allAssignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  // Fetch student-teacher assignments (for teacher course stats)
  const { data: studentTeacherAssignments = [] } = useQuery<StudentTeacherAssignment[]>({
    queryKey: ["/api/student-teacher-assignments"],
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: user?.role === "teacher",
  });

  // Fetch parent information if user is a student
  const { data: parentInfo } = useQuery<UserType>({
    queryKey: [`/api/users/${userId}/parents`],
    enabled: user?.role === "student",
  });

  // Fetch children if user is a parent (fetch immediately to avoid delay)
  const { data: children = [], isLoading: childrenLoading } = useQuery<UserType[]>({
    queryKey: [`/api/parents/${userId}/children`],
    enabled: !!userId,
    staleTime: 0,
  });

  // Fetch all students for adding children (admin-only, for parent users - fetch immediately)
  const { data: allStudents = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users", "role", "student"],
    queryFn: async () => {
      const response = await fetch("/api/users?role=student");
      if (!response.ok) throw new Error("Failed to fetch students");
      return response.json();
    },
    enabled: !!userId,
    staleTime: 0,
  });

  // Fetch parent-child relationships for deletion (fetch immediately)
  const { data: parentChildRelations = [] } = useQuery<ParentChild[]>({
    queryKey: ["/api/parent-children", "parent", userId],
    queryFn: async () => {
      const response = await fetch(`/api/parent-children?parentId=${userId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!userId,
    staleTime: 0,
  });

  // Filter out already linked children
  const existingChildIds = new Set(parentChildRelations.map(pc => pc.childId));
  const availableStudents = allStudents.filter(s => !existingChildIds.has(s.id));

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: async (updates: Partial<UserType>) => {
      const response = await apiRequest("PUT", `/api/users/${userId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const toggleSuspendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", `/api/users/${userId}`, {
        isActive: !user?.isActive,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: `User ${user?.isActive ? 'suspended' : 'activated'} successfully`,
      });
      setSuspendDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update account status",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      // Validate passwords match
      if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Validate password length
      if (resetPasswordForm.newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const response = await apiRequest("POST", `/api/users/${userId}/reset-password`, {
        newPassword: resetPasswordForm.newPassword,
        requirePasswordChange: resetPasswordForm.requirePasswordChange,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Successfully",
        description: resetPasswordForm.requirePasswordChange 
          ? "The user will be required to change their password on next login."
          : "The user can now log in with the new password.",
      });
      setResetPasswordDialogOpen(false);
      // Reset form
      setResetPasswordForm({
        newPassword: "",
        confirmPassword: "",
        requirePasswordChange: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Reset Password",
        description: error.message || "An error occurred while resetting the password",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      // DELETE returns 204 with no body, so we don't parse JSON
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      navigate("/users");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Add child mutation (admin-only)
  const addChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      const response = await fetch("/api/parent-children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: userId, childId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add child");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parents/${userId}/children`] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent-children", "parent", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", "role", "student"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Child added successfully",
        description: "The student has been linked to this parent account.",
      });
      setAddChildDialogOpen(false);
      setSelectedStudentId("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add child",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove child mutation (admin-only)
  const removeChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      const relation = parentChildRelations.find(r => r.childId === childId);
      if (!relation) throw new Error("Relationship not found");
      
      const response = await fetch(`/api/parent-children/${relation.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove child");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parents/${userId}/children`] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent-children", "parent", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", "role", "student"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Child removed",
        description: "The student has been unlinked from this parent account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove child",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler to send message - navigates to messages with pre-selected recipient
  const handleSendMessage = () => {
    if (user) {
      navigate(`/messages?user=${user.id}`);
    }
  };

  // Handler to open edit dialog with current user data
  const handleEditClick = () => {
    if (user) {
      setEditForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role || "",
        phone: (user as any).phone || "",
        address: (user as any).address || "",
        subject: (user as any).subject || "",
        dateOfBirth: (user as any).dateOfBirth || "",
      });
      setEditDialogOpen(true);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'teacher': return 'default';
      case 'parent': return 'outline';
      case 'student': return 'secondary';
      default: return 'default';
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg">Loading user information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-destructive mb-4">Error loading user data</div>
          <Button onClick={() => navigate("/users")} data-testid="button-back-to-users">
            Back to User Management
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg mb-4">User not found</div>
          <Button onClick={() => navigate("/users")} data-testid="button-back-to-users">
            Back to User Management
          </Button>
        </div>
      </div>
    );
  }

  const userName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.name || user.email;

  // Role-specific data
  const userEnrollments = allEnrollments.filter(e => e.studentId === user.id);
  const enrolledCourses = allCourses.filter(course =>
    userEnrollments.some(e => e.courseId === course.id)
  );
  
  // For teachers: get courses from student_teacher_assignments table (authoritative source)
  // This table tracks which teachers are assigned to which students in each course
  const teacherAssignmentsForThisTeacher = studentTeacherAssignments.filter(
    sta => sta.teacherId === user.id
  );
  
  // Get unique course IDs where this teacher has any student assignments
  const taughtCourseIds = new Set(teacherAssignmentsForThisTeacher.map(sta => sta.courseId));
  
  // Get the actual course objects for those IDs
  const taughtCourses = user.role === "teacher" 
    ? allCourses.filter(course => taughtCourseIds.has(course.id))
    : [];
  
  // Count unique students assigned to this teacher (from student_teacher_assignments)
  const teacherStudentIds = new Set(
    teacherAssignmentsForThisTeacher.map(sta => sta.studentId)
  );
  
  const userSubmissions = allSubmissions.filter(s => s.studentId === user.id);
  const gradedSubmissions = userSubmissions.filter(s => s.grade !== undefined && s.grade !== null);
  const averageGrade = gradedSubmissions.length > 0
    ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" data-testid="user-detail-page">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => window.history.back()}
                className="hover:bg-[#1F3A5F]/10 dark:hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5 text-[#1F3A5F] dark:text-white" />
              </Button>
              </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEditClick}
                className="bg-[#1F3A5F]/10 border-[#1F3A5F]/20 text-[#1F3A5F] hover:bg-[#1F3A5F]/20 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20 h-9"
                data-testid="button-edit-user"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSendMessage}
                className="bg-[#1F3A5F]/10 border-[#1F3A5F]/20 text-[#1F3A5F] hover:bg-[#1F3A5F]/20 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20 h-9"
                data-testid="button-send-message-header"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* User Overview Card with Cover Photo */}
        <Card className="overflow-hidden">
          {/* Cover Photo Background */}
          <div 
            className="h-48 bg-gradient-to-r from-primary/20 to-primary/10 bg-cover bg-center"
            style={user.coverPhotoUrl ? { backgroundImage: `url(${user.coverPhotoUrl})` } : {}}
            data-testid="cover-photo"
          />
          
          <CardContent className="p-6 pt-0">
            <div className="flex items-start gap-6">
              {/* Avatar positioned to overlap cover photo */}
              <Avatar className="w-32 h-32 -mt-16 border-4 border-card ring-2 ring-card-border">
                <AvatarImage src={user.avatarUrl || user.profileImageUrl || undefined} />
                <AvatarFallback className="text-4xl">
                  {user.firstName?.[0] || user.name?.[0] || user.email?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3 pt-4">
                <div>
                  <h2 className="text-2xl font-semibold" data-testid="text-user-name">
                    {userName}
                  </h2>
                  <p className="text-muted-foreground" data-testid="text-user-email">{user.email}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={getRoleColor(user.role)} data-testid="badge-role">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  {user.createdAt && (
                    <Badge variant="outline" data-testid="badge-joined">
                      Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </Badge>
                  )}
                  {user.updatedAt && (
                    <Badge variant="outline" data-testid="badge-updated">
                      Updated {format(new Date(user.updatedAt), "MMM d, yyyy")}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleSendMessage}
                    data-testid="button-send-message"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
              {user.role === "student" && (
                <div className="flex flex-col items-end gap-2 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">Account Status</div>
                      <div className="text-xs text-muted-foreground">
                        {user.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>
                    <Switch
                      checked={user.isActive ?? true}
                      onCheckedChange={() => toggleSuspendMutation.mutate()}
                      disabled={toggleSuspendMutation.isPending}
                      data-testid="toggle-account-status"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      {/* Quick Stats based on role */}
      {user.role === "student" && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-enrolled-courses">
                    {enrolledCourses.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Enrolled Courses</div>
                </div>
                <BookOpen className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-submissions">
                    {userSubmissions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Submissions</div>
                </div>
                <FileText className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-graded">
                    {gradedSubmissions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Graded Work</div>
                </div>
                <CheckCircle className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-average-grade">
                    {averageGrade > 0 ? averageGrade.toFixed(1) : "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">Average Grade</div>
                </div>
                <CheckCircle className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {user.role === "teacher" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-courses-taught">
                    {taughtCourses.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Courses Taught</div>
                </div>
                <BookOpen className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-active-courses">
                    {taughtCourses.filter(c => c.isActive).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Courses</div>
                </div>
                <CheckCircle className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-total-students">
                    {teacherStudentIds.size}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Students</div>
                </div>
                <Users className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20" data-testid="user-tabs">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2" data-testid="tab-overview">
            <Users className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2" data-testid="tab-activity">
            <Clock className="w-4 h-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2" data-testid="tab-settings">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2" data-testid="tab-documents">
            <File className="w-4 h-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">User ID</div>
                  <div className="font-medium" data-testid="text-user-id">{user.id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium" data-testid="text-email">{user.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">First Name</div>
                  <div className="font-medium" data-testid="text-first-name">
                    {user.firstName || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last Name</div>
                  <div className="font-medium" data-testid="text-last-name">
                    {user.lastName || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Role</div>
                  <div className="font-medium" data-testid="text-role">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Account Created</div>
                  <div className="font-medium" data-testid="text-created">
                    {user.createdAt 
                      ? format(new Date(user.createdAt), "MMM d, yyyy 'at' h:mm a")
                      : "N/A"
                    }
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium" data-testid="text-phone">
                    {user.phone || <span className="text-muted-foreground italic">Not set</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Gender</div>
                  <div className="font-medium capitalize" data-testid="text-gender">
                    {user.gender || <span className="text-muted-foreground italic">Not set</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date of Birth</div>
                  <div className="font-medium" data-testid="text-dob">
                    {user.dateOfBirth ? format(new Date(user.dateOfBirth), "MMM d, yyyy") : <span className="text-muted-foreground italic">Not set</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Address</div>
                  <div className="font-medium" data-testid="text-address">
                    {user.address || <span className="text-muted-foreground italic">Not set</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">City</div>
                  <div className="font-medium" data-testid="text-city">
                    {user.city || <span className="text-muted-foreground italic">Not set</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="font-medium" data-testid="text-location">
                    {[user.state, user.country].filter(Boolean).join(", ") || <span className="text-muted-foreground italic">Not set</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Timezone
                  </div>
                  <div className="font-medium" data-testid="text-timezone">
                    {user.timezone ? formatTimezoneDisplay(user.timezone) : <span className="text-muted-foreground italic">Not set</span>}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-1">Bio</div>
                <div className="font-medium text-sm leading-relaxed" data-testid="text-bio">
                  {user.bio || <span className="text-muted-foreground italic">No bio added yet.</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Education & Certifications - for teachers */}
          {user.role === "teacher" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Education & Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <GraduationCap className="w-3 h-3" />
                      Education
                    </div>
                    <div className="font-medium text-sm leading-relaxed whitespace-pre-line" data-testid="text-education">
                      {user.education || <span className="text-muted-foreground italic">Not set</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <Award className="w-3 h-3" />
                      Certifications
                    </div>
                    <div className="font-medium text-sm leading-relaxed whitespace-pre-line" data-testid="text-certifications">
                      {user.certifications || <span className="text-muted-foreground italic">Not set</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parent Information - for students */}
          {user.role === "student" && parentInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Parent / Guardian Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate cursor-pointer"
                  onClick={() => navigate(`/users/${parentInfo.id}`)}
                  data-testid="parent-info-card"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={parentInfo.avatarUrl || parentInfo.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {parentInfo.firstName?.[0] || parentInfo.name?.[0] || parentInfo.email?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium" data-testid="parent-name">
                        {parentInfo.firstName && parentInfo.lastName 
                          ? `${parentInfo.firstName} ${parentInfo.lastName}`
                          : parentInfo.name || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid="parent-email">
                        {parentInfo.email}
                      </div>
                      {parentInfo.phone && (
                        <div className="text-sm text-muted-foreground" data-testid="parent-phone">
                          {parentInfo.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">Parent</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Children Information - for parents (admin management) */}
          {user.role === "parent" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Linked Children {childrenLoading ? "" : `(${children.length})`}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddChildDialogOpen(true)}
                    data-testid="button-add-child"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Child
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {childrenLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-muted-foreground">Loading linked children...</p>
                  </div>
                ) : children.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No children linked yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Click "Add Child" to link a student to this parent</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {children.map((child) => (
                      <div 
                        key={child.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`child-card-${child.id}`}
                      >
                        <div 
                          className="flex items-center gap-4 flex-1 cursor-pointer hover-elevate"
                          onClick={() => navigate(`/users/${child.id}`)}
                        >
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={child.avatarUrl || child.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {child.firstName?.[0] || child.name?.[0] || child.email?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium" data-testid={`child-name-${child.id}`}>
                              {child.firstName && child.lastName 
                                ? `${child.firstName} ${child.lastName}`
                                : child.name || "Unknown"}
                            </div>
                            <div className="text-sm text-muted-foreground" data-testid={`child-email-${child.id}`}>
                              {child.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={child.isActive ? "default" : "secondary"} data-testid={`child-status-${child.id}`}>
                            {child.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeChildMutation.mutate(child.id);
                            }}
                            disabled={removeChildMutation.isPending}
                            data-testid={`button-remove-child-${child.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Role-specific content */}
          {user.role === "student" && enrolledCourses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {enrolledCourses.slice(0, 5).map((course) => (
                    <div 
                      key={course.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover-elevate cursor-pointer"
                      onClick={() => navigate(`/courses/${course.id}`)}
                      data-testid={`course-item-${course.id}`}
                    >
                      <div>
                        <div className="font-medium">{course.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {course.subject} • Grade {course.grade}
                        </div>
                      </div>
                      <Badge variant={course.isActive ? "default" : "secondary"}>
                        {course.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {user.role === "teacher" && taughtCourses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Courses Taught</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {taughtCourses.slice(0, 5).map((course) => (
                    <div 
                      key={course.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover-elevate cursor-pointer"
                      onClick={() => navigate(`/courses/${course.id}`)}
                      data-testid={`course-item-${course.id}`}
                    >
                      <div>
                        <div className="font-medium">{course.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {course.subject} • Grade {course.grade}
                        </div>
                      </div>
                      <Badge variant={course.isActive ? "default" : "secondary"}>
                        {course.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <ActivityLogSection userId={userId || ''} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Account Status</div>
                    <div className="text-sm text-muted-foreground">
                      User account is {user.isActive ? "active" : "suspended"}
                    </div>
                  </div>
                  <Button 
                    variant={user.isActive ? "outline" : "default"} 
                    size="sm" 
                    data-testid="button-suspend-account"
                    onClick={() => setSuspendDialogOpen(true)}
                  >
                    {user.isActive ? "Suspend Account" : "Activate Account"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Reset Password</div>
                    <div className="text-sm text-muted-foreground">Send password reset email</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    data-testid="button-reset-password"
                    onClick={() => setResetPasswordDialogOpen(true)}
                  >
                    Reset Password
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Delete Account</div>
                    <div className="text-sm text-muted-foreground">Permanently remove this user</div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    data-testid="button-delete-account"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <DocumentsSection userId={user.id} isAdmin={currentUser?.role === 'admin'} />
        </TabsContent>
      </Tabs>

      {/* Student History - Only for students */}
      {user.role === 'student' && (
        <StudentHistoryCard studentId={user.id} />
      )}

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  data-testid="input-last-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={editForm.role} 
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                disabled={userId === currentUser?.id}
              >
                <SelectTrigger data-testid="select-role" disabled={userId === currentUser?.id}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {userId === currentUser?.id && (
                <p className="text-xs text-muted-foreground">You cannot change your own role</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                data-testid="input-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                data-testid="input-address"
                rows={3}
              />
            </div>
            {editForm.role === "teacher" && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={editForm.subject}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  data-testid="input-subject"
                />
              </div>
            )}
            {editForm.role === "student" && (
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                  data-testid="input-date-of-birth"
                />
              </div>
            )}
          </div>
          <DialogFooter className="shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button 
              onClick={() => updateUserMutation.mutate(editForm)} 
              disabled={updateUserMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend/Activate Account Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              {user?.isActive ? "Suspend" : "Activate"} Account
            </DialogTitle>
            <DialogDescription>
              {user?.isActive 
                ? "Are you sure you want to suspend this user's account? They will not be able to log in until the account is reactivated."
                : "Are you sure you want to activate this user's account? They will be able to log in again."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)} data-testid="button-cancel-suspend">
              Cancel
            </Button>
            <Button 
              variant={user?.isActive ? "destructive" : "default"}
              onClick={() => toggleSuspendMutation.mutate()} 
              disabled={toggleSuspendMutation.isPending}
              data-testid="button-confirm-suspend"
            >
              {toggleSuspendMutation.isPending ? "Processing..." : user?.isActive ? "Suspend Account" : "Activate Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {user?.email}. You can optionally require them to change it on next login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={resetPasswordForm.newPassword}
                onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                data-testid="input-new-password"
              />
              <p className="text-sm text-muted-foreground">Must be at least 6 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={resetPasswordForm.confirmPassword}
                onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                data-testid="input-confirm-password"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="require-change"
                checked={resetPasswordForm.requirePasswordChange}
                onCheckedChange={(checked) => setResetPasswordForm({ ...resetPasswordForm, requirePasswordChange: checked })}
                data-testid="switch-require-password-change"
              />
              <Label htmlFor="require-change" className="text-sm font-normal">
                Require user to change password on next login
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)} data-testid="button-cancel-reset">
              Cancel
            </Button>
            <Button 
              onClick={() => resetPasswordMutation.mutate()} 
              disabled={resetPasswordMutation.isPending || !resetPasswordForm.newPassword || !resetPasswordForm.confirmPassword}
              data-testid="button-confirm-reset"
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this user account? This action cannot be undone.
              All user data including enrollments, submissions, and grades will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteUserMutation.mutate()} 
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Child Dialog (Admin Only) */}
      <Dialog open={addChildDialogOpen} onOpenChange={setAddChildDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Child to Parent</DialogTitle>
            <DialogDescription>
              Select a student to link to this parent account. The parent will be able to view the student's progress and course information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="student-select" className="mb-2 block">Select Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger id="student-select" data-testid="select-student">
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No available students
                    </div>
                  ) : (
                    availableStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name || `${student.firstName} ${student.lastName}`} ({student.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddChildDialogOpen(false)} data-testid="button-cancel-add-child">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedStudentId) {
                  addChildMutation.mutate(selectedStudentId);
                }
              }} 
              disabled={!selectedStudentId || addChildMutation.isPending}
              data-testid="button-confirm-add-child"
            >
              {addChildMutation.isPending ? "Adding..." : "Add Child"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
