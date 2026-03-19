import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Calendar,
  Target,
  FileText,
  Download,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Trash2,
  Users,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import type { Assignment, User as UserType } from "@shared/schema";

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string | null;
  submittedAt?: string | null;
  status: string;
  student: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  attachments: Array<{
    id: string;
    submissionId: string;
    type: string;
    url: string;
    fileName?: string;
    fileSize?: number;
  }>;
  grade?: {
    id: string;
    submissionId: string;
    score: number;
    maxScore: number;
    feedback?: string | null;
    gradedBy: string;
    gradedAt: string | null;
  } | null;
}

interface AssignmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  courseId: string;
  teacherId?: string;
  readOnly?: boolean;
  selectedStudentFilter?: string;
}

export function AssignmentDetailsModal({ 
  isOpen, 
  onClose, 
  assignment,
  courseId,
  teacherId,
  readOnly = false,
  selectedStudentFilter = "all"
}: AssignmentDetailsModalProps) {
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");

  // Fetch assignment attachments
  const { data: assignmentAttachments = [] } = useQuery<Array<{
    id: string;
    assignmentId: string;
    type: string;
    url: string;
    fileName: string | null;
    fileSize: number | null;
    mimeType: string | null;
    createdAt: string | null;
  }>>({
    queryKey: ["/api/v1/assignments", assignment?.id, "attachments"],
    enabled: !!assignment?.id && isOpen,
  });

  // Fetch submissions for this assignment (with grading data)
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/v1/submissions/assignments", assignment?.id, "grading"],
    queryFn: async () => {
      if (!assignment?.id) return [];
      const response = await fetch(`/api/v1/submissions/assignments/${assignment.id}/grading`);
      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }
      return response.json();
    },
    enabled: !!assignment?.id && isOpen,
  });

  // Fetch students assigned to this specific teacher for the course
  interface AssignedStudent {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    avatarUrl: string | null;
  }

  const { data: assignedStudents = [] } = useQuery<AssignedStudent[]>({
    queryKey: ["/api/v1/courses", courseId, "assigned-students", teacherId],
    enabled: !!courseId && isOpen && !!teacherId,
  });

  // Fetch current individual mappings for this assignment
  interface IndividualMapping {
    id: string;
    assignmentId: string;
    studentId: string;
    student: AssignedStudent | null;
  }

  const { data: individualMappings = [] } = useQuery<IndividualMapping[]>({
    queryKey: ["/api/v1/assignments", assignment?.id, "individual-mappings"],
    enabled: !!assignment?.id && isOpen && !!teacherId,
  });

  // State to track selected students for individual assignment
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Sync selectedStudentIds when individualMappings data loads or assignment changes
  useEffect(() => {
    if (individualMappings.length > 0) {
      setSelectedStudentIds(individualMappings.map(m => m.studentId));
    } else if (assignment?.isShared) {
      // Reset to empty if assignment is shared
      setSelectedStudentIds([]);
    }
  }, [individualMappings, assignment?.id, assignment?.isShared]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedStudentIds([]);
    }
  }, [isOpen]);

  // Initialize selected students when mappings load
  const currentlyAssignedIds = individualMappings.map(m => m.studentId);
  
  // Update individual mappings mutation
  const updateMappingsMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      const response = await apiRequest("PUT", `/api/v1/assignments/${assignment?.id}/individual-mappings`, {
        studentIds,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments", assignment?.id, "individual-mappings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/assignments"] });
      
      toast({
        title: "Assignment updated",
        description: selectedStudentIds.length === 0 
          ? "Assignment is now shared with all enrolled students."
          : `Assignment is now assigned to ${selectedStudentIds.length} specific student(s).`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update assignment",
        variant: "destructive",
      });
    },
  });

  const handleStudentToggle = (studentId: string, checked: boolean) => {
    setSelectedStudentIds(prev => 
      checked 
        ? [...prev, studentId]
        : prev.filter(id => id !== studentId)
    );
  };

  const handleSaveAssignments = () => {
    updateMappingsMutation.mutate(selectedStudentIds);
  };

  const handleMakeShared = () => {
    setSelectedStudentIds([]);
    updateMappingsMutation.mutate([]);
  };

  // Use assigned students directly (already filtered by teacher assignment)
  const enrolledStudents = assignedStudents;

  // Compute effectiveIsShared based on live mappings data (not cached assignment.isShared)
  // This ensures immediate UI updates when individual mappings are added/removed
  const effectiveIsShared = individualMappings.length === 0;

  // Grade submission mutation
  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, grade, feedback, gradedBy }: { submissionId: string; grade: number; feedback: string; gradedBy: string }) => {
      const response = await fetch(`/api/v1/submissions/grades`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          submissionId, 
          score: grade,
          feedback: feedback || undefined,
          gradedBy
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to grade submission");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments", assignment?.id, "grading"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/assignments"] });
      
      toast({
        title: "Graded successfully",
        description: "The submission has been graded.",
      });
      setSelectedSubmission(null);
      setGradeValue("");
      setFeedbackValue("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to grade submission",
        variant: "destructive",
      });
    },
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/v1/assignments/${assignment?.id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "assignments"] });
      
      toast({
        title: "Assignment deleted",
        description: "The assignment has been successfully deleted.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete assignment",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAssignment = () => {
    if (!assignment) return;
    
    if (confirm(`Are you sure you want to delete the assignment "${assignment.title}"? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  const handleGradeSubmission = () => {
    if (!selectedSubmission || !gradeValue) return;

    const grade = parseFloat(gradeValue);
    if (isNaN(grade) || grade < 0 || (assignment?.maxScore && grade > assignment.maxScore)) {
      toast({
        title: "Invalid grade",
        description: `Please enter a valid grade between 0 and ${assignment?.maxScore || 100}`,
        variant: "destructive",
      });
      return;
    }

    if (!teacherId) {
      toast({
        title: "Error",
        description: "Teacher ID not found. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    gradeMutation.mutate({
      submissionId: selectedSubmission.id,
      grade,
      feedback: feedbackValue,
      gradedBy: teacherId,
    });
  };

  // Filter submissions based on selected student
  const filteredSubmissions = selectedStudentFilter === "all" 
    ? submissions 
    : submissions.filter(s => s.studentId === selectedStudentFilter);

  const getSubmissionStats = () => {
    const total = filteredSubmissions.length;
    const graded = filteredSubmissions.filter(s => s.grade !== null && s.grade !== undefined).length;
    const pending = filteredSubmissions.filter(s => s.status === "submitted" && !s.grade).length;
    const notSubmitted = filteredSubmissions.filter(s => s.status === "not_submitted").length;
    
    return { total, graded, pending, notSubmitted };
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!assignment) return null;

  const stats = getSubmissionStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-hidden flex flex-col" data-testid="dialog-assignment-details">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {assignment.title}
          </DialogTitle>
        </DialogHeader>

        {submissionsLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading assignment details...</p>
            </div>
          </div>
        ) : (
        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20">
            <TabsTrigger 
              value="overview"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
              data-testid="tab-overview"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="submissions"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
              data-testid="tab-submissions"
            >
              Submissions ({stats.total})
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
              data-testid="tab-history"
            >
              History
            </TabsTrigger>
            {teacherId && !readOnly && (
              <TabsTrigger 
                value="assigned-students"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                data-testid="tab-assigned-students"
              >
                <Users className="w-4 h-4 mr-1" />
                Assign ({assignment.isShared ? 'All' : individualMappings.length})
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assignment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Type</Label>
                      <p className="font-medium">{assignment.type || "Assignment"}</p>
                    </div>
                    {assignment.dueDate && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Due Date</Label>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(assignment.dueDate), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    )}
                    {assignment.maxScore && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Max Score</Label>
                        <p className="font-medium flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          {assignment.maxScore} points
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge variant={assignment.isPublished ? "default" : "secondary"}>
                        {assignment.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>

                  {assignment.description && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Description</Label>
                      <p className="text-sm whitespace-pre-wrap">{assignment.description}</p>
                    </div>
                  )}

                  {/* Assignment Attachments */}
                  {assignmentAttachments.length > 0 && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label className="text-muted-foreground">Attached Files ({assignmentAttachments.length})</Label>
                      <div className="grid gap-2">
                        {assignmentAttachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 rounded-md border bg-muted/50 hover:bg-accent/50 cursor-pointer transition-colors"
                            data-testid={`attachment-${attachment.id}`}
                            onClick={() => window.open(attachment.url, "_blank")}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
                                <FileText className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {attachment.fileName || "Unnamed file"}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{formatFileSize(attachment.fileSize)}</span>
                                  {attachment.mimeType && (
                                    <>
                                      <span>•</span>
                                      <span>{attachment.mimeType}</span>
                                    </>
                                  )}
                                  {attachment.createdAt && (
                                    <>
                                      <span>•</span>
                                      <span>Uploaded {format(new Date(attachment.createdAt), "MMM d, yyyy")}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const response = await fetch(attachment.url);
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = attachment.fileName || 'attachment';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                } catch (error) {
                                  console.error('Download failed:', error);
                                  window.open(attachment.url, '_blank');
                                }
                              }}
                              data-testid={`button-download-${attachment.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">Total Students</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.graded}</p>
                      <p className="text-xs text-muted-foreground">Graded</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                      <p className="text-xs text-muted-foreground">Pending Review</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-600">{stats.notSubmitted}</p>
                      <p className="text-xs text-muted-foreground">Not Submitted</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Submissions Tab */}
            <TabsContent value="submissions" className="space-y-3 m-0">
              {submissionsLoading ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Loading submissions...</p>
                  </CardContent>
                </Card>
              ) : submissions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Submissions Yet</h3>
                    <p className="text-muted-foreground">
                      Students haven't submitted any work for this assignment yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredSubmissions.map((submission) => (
                    <Card key={submission.id} className="hover-elevate" data-testid={`submission-card-${submission.id}`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Student Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={submission.student?.avatarUrl || undefined} />
                                <AvatarFallback>
                                  {submission.student?.firstName?.[0]}{submission.student?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {submission.student?.firstName && submission.student?.lastName
                                    ? `${submission.student.firstName} ${submission.student.lastName}`
                                    : submission.student?.email}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  {submission.submittedAt ? (
                                    <>
                                      <Clock className="w-3 h-3" />
                                      Submitted {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                                    </>
                                  ) : (
                                    <span className="text-orange-600">Not submitted</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {submission.grade ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {submission.grade.score}/{assignment.maxScore || 100}
                                </Badge>
                              ) : submission.status === "submitted" ? (
                                <Badge variant="secondary" className="gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Pending
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Not Submitted
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Submission Content */}
                          {submission.content && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Submission</Label>
                              <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                                {submission.content}
                              </p>
                            </div>
                          )}

                          {/* Attachments */}
                          {submission.attachments && submission.attachments.length > 0 && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Attachments</Label>
                              <div className="grid gap-2">
                                {submission.attachments.map((attachment) => (
                                  <div
                                    key={attachment.id}
                                    className="flex items-center justify-between p-2 rounded-md border bg-muted/50 hover:bg-accent/50 cursor-pointer transition-colors"
                                    onClick={() => window.open(attachment.url, "_blank")}
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                      <p className="text-xs font-medium truncate">
                                        {attachment.fileName || "Attachment"}
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const response = await fetch(attachment.url);
                                          const blob = await response.blob();
                                          const url = window.URL.createObjectURL(blob);
                                          const link = document.createElement('a');
                                          link.href = url;
                                          link.download = attachment.fileName || 'attachment';
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                          window.URL.revokeObjectURL(url);
                                        } catch (error) {
                                          console.error('Download failed:', error);
                                          window.open(attachment.url, '_blank');
                                        }
                                      }}
                                      className="h-7 w-7 p-0"
                                      data-testid={`button-download-submission-${attachment.id}`}
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Feedback */}
                          {submission.grade?.feedback && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Feedback</Label>
                              <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
                                {submission.grade.feedback}
                              </p>
                            </div>
                          )}

                          {/* Grade Form - Hidden in read-only mode */}
                          {!readOnly && (
                            selectedSubmission?.id === submission.id ? (
                              <div className="space-y-3 pt-3 border-t">
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label htmlFor={`grade-${submission.id}`}>
                                      Grade (max: {assignment.maxScore || 100})
                                    </Label>
                                    <Input
                                      id={`grade-${submission.id}`}
                                      type="number"
                                      min="0"
                                      max={assignment.maxScore || 100}
                                      value={gradeValue}
                                      onChange={(e) => setGradeValue(e.target.value)}
                                      placeholder="Enter grade"
                                      data-testid={`input-grade-${submission.id}`}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`feedback-${submission.id}`}>Feedback (optional)</Label>
                                    <Textarea
                                      id={`feedback-${submission.id}`}
                                      value={feedbackValue}
                                      onChange={(e) => setFeedbackValue(e.target.value)}
                                      placeholder="Enter feedback"
                                      rows={3}
                                      data-testid={`textarea-feedback-${submission.id}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleGradeSubmission}
                                    disabled={gradeMutation.isPending || !gradeValue}
                                    data-testid={`button-submit-grade-${submission.id}`}
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    {gradeMutation.isPending ? "Submitting..." : "Submit Grade"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedSubmission(null);
                                      setGradeValue("");
                                      setFeedbackValue("");
                                    }}
                                    data-testid={`button-cancel-grade-${submission.id}`}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : submission.status === "submitted" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setGradeValue(submission.grade?.score?.toString() || "");
                                  setFeedbackValue(submission.grade?.feedback || "");
                                }}
                                className="w-full"
                                data-testid={`button-grade-${submission.id}`}
                              >
                                {submission.grade ? "Update Grade" : "Grade Submission"}
                              </Button>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-3 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Submission Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredSubmissions.filter(s => s.submittedAt).length === 0 ? (
                    <div className="py-8 text-center">
                      <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No submission activity yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {submissions
                        .filter(s => s.submittedAt)
                        .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime())
                        .map((submission) => (
                          <div key={submission.id} className="flex gap-3 pb-4 border-b last:border-0">
                            <div className="flex-shrink-0">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={submission.student?.avatarUrl || undefined} />
                                <AvatarFallback>
                                  {submission.student?.firstName?.[0]}{submission.student?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {submission.student?.firstName && submission.student?.lastName
                                  ? `${submission.student.firstName} ${submission.student.lastName}`
                                  : submission.student?.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {submission.grade
                                  ? `Graded: ${submission.grade.score}/${assignment.maxScore || 100} points`
                                  : "Submitted work"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(submission.submittedAt!), "MMMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assigned Students Tab - Hidden in read-only mode */}
            {teacherId && !readOnly && (
              <TabsContent value="assigned-students" className="space-y-3 m-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Student Assignment Settings</span>
                      <Badge variant={effectiveIsShared ? "default" : "secondary"}>
                        {effectiveIsShared ? "Shared with All" : `${individualMappings.length} Selected`}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {effectiveIsShared 
                          ? "This assignment is currently shared with all enrolled students in the course."
                          : `This assignment is only visible to ${individualMappings.length} specific student(s).`}
                      </p>
                    </div>

                    {!effectiveIsShared && individualMappings.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">Currently Assigned Students:</Label>
                        <div className="flex flex-wrap gap-2">
                          {individualMappings.map((mapping) => (
                            <Badge key={mapping.id} variant="outline" className="gap-1">
                              <User className="w-3 h-3" />
                              {mapping.student?.firstName && mapping.student?.lastName
                                ? `${mapping.student.firstName} ${mapping.student.lastName}`
                                : mapping.student?.email || "Unknown"}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Assign to Individual Students</Label>
                        {!effectiveIsShared && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMakeShared}
                            disabled={updateMappingsMutation.isPending}
                            data-testid="button-make-shared"
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Share with All
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Select specific students who should see this assignment. Uncheck all to share with everyone.
                      </p>

                      {enrolledStudents.length === 0 ? (
                        <div className="py-6 text-center">
                          <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                          <p className="text-sm text-muted-foreground">No enrolled students found in this course.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                          {enrolledStudents.map((student) => {
                            const isAssigned = currentlyAssignedIds.includes(student.id) || selectedStudentIds.includes(student.id);
                            return (
                              <div
                                key={student.id}
                                className="flex items-center space-x-3 p-2 rounded-md hover-elevate"
                              >
                                <Checkbox
                                  id={`student-${student.id}`}
                                  checked={isAssigned}
                                  onCheckedChange={(checked) => handleStudentToggle(student.id, checked as boolean)}
                                  data-testid={`checkbox-student-${student.id}`}
                                />
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={student.avatarUrl || undefined} />
                                  <AvatarFallback>
                                    {student.firstName?.[0]}{student.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <label
                                  htmlFor={`student-${student.id}`}
                                  className="flex-1 text-sm font-medium cursor-pointer"
                                >
                                  {student.firstName && student.lastName
                                    ? `${student.firstName} ${student.lastName}`
                                    : student.email}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {selectedStudentIds.length > 0 && (
                        <div className="flex items-center justify-between pt-3 border-t">
                          <span className="text-sm text-muted-foreground">
                            {selectedStudentIds.length} student(s) selected
                          </span>
                          <Button
                            onClick={handleSaveAssignments}
                            disabled={updateMappingsMutation.isPending}
                            data-testid="button-save-assignments"
                          >
                            {updateMappingsMutation.isPending ? "Saving..." : "Save Assignments"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </div>
        </Tabs>
        )}

        {/* Footer with Delete Button */}
        {teacherId && !readOnly && (
          <div className="flex justify-between items-center pt-4 border-t mt-6">
            <div className="text-xs text-muted-foreground">
              {submissions.length > 0 ? (
                <span className="text-orange-600">Cannot delete: {submissions.length} submission(s) exist</span>
              ) : (
                <span>No submissions - safe to delete</span>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAssignment}
              disabled={submissions.length > 0 || deleteMutation.isPending}
              data-testid="button-delete-assignment"
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleteMutation.isPending ? "Deleting..." : "Delete Assignment"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
