import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Clock, FileText, Link as LinkIcon, Upload, X, CheckCircle2, AlertCircle, Download, User } from "lucide-react";
import { format } from "date-fns";
import type { AssignmentWithRelations, SubmissionWithRelations, Course, User as UserType } from "@shared/schema";

interface StudentAssignmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  studentId: string;
}

interface AttachmentUpload {
  id: string;
  type: "file" | "link";
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isUploading?: boolean;
}

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/webp",
  "text/plain",
  "application/rtf",
  "application/vnd.oasis.opendocument.text",
  "application/zip",
  "application/x-rar-compressed",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function StudentAssignmentDetailModal({ 
  isOpen, 
  onClose, 
  assignmentId,
  studentId 
}: StudentAssignmentDetailModalProps) {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<AttachmentUpload[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [submissionText, setSubmissionText] = useState("");

  const { data: assignment, isLoading: isAssignmentLoading } = useQuery<AssignmentWithRelations>({
    queryKey: [`/api/v1/assignments/${assignmentId}`],
    enabled: isOpen && !!assignmentId,
  });

  const { data: existingSubmission, isLoading: isSubmissionLoading } = useQuery<SubmissionWithRelations>({
    queryKey: [`/api/v1/submissions?assignment_id=${assignmentId}&student_id=${studentId}`],
    enabled: isOpen && !!assignmentId,
  });

  const { data: course } = useQuery<Course>({
    queryKey: [`/api/v1/courses/${assignment?.courseId}`],
    enabled: isOpen && !!assignment?.courseId,
  });

  const { data: teacher } = useQuery<UserType>({
    queryKey: [`/api/v1/users/${course?.teacherId}`],
    enabled: isOpen && !!course?.teacherId,
  });

  const handleClose = () => {
    setAttachments([]);
    setLinkUrl("");
    setSubmissionText("");
    onClose();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type. Please upload PDF, Word, Excel, PowerPoint, images, or other documents.`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB size limit.`,
          variant: "destructive",
        });
        continue;
      }

      const tempId = Math.random().toString(36).substring(7);
      setAttachments(prev => [...prev, {
        id: tempId,
        type: "file",
        url: "",
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        isUploading: true,
      }]);

      try {
        console.log('Uploading file:', file.name, 'size:', file.size, 'type:', file.type);
        
        // Create FormData for multipart upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('assignmentId', assignmentId);
        formData.append('studentId', studentId);

        const uploadResponse = await fetch('/api/v1/submissions/attachments/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        console.log('Upload response status:', uploadResponse.status, uploadResponse.statusText);
        
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || "Failed to upload file");
        }
        
        const { objectPath, fileSize, mimeType } = await uploadResponse.json();
        
        console.log('File uploaded successfully to object storage at:', objectPath);

        setAttachments(prev => prev.map(att =>
          att.id === tempId
            ? { 
                ...att, 
                url: objectPath, 
                fileSize,
                mimeType,
                isUploading: false 
              }
            : att
        ));

        toast({
          title: "File uploaded",
          description: `${file.name} uploaded successfully`,
        });
      } catch (error) {
        setAttachments(prev => prev.filter(att => att.id !== tempId));
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive",
        });
      }
    }

    event.target.value = "";
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;

    try {
      new URL(linkUrl);
      const newLink: AttachmentUpload = {
        id: Math.random().toString(36).substring(7),
        type: "link",
        url: linkUrl.trim(),
      };
      setAttachments(prev => [...prev, newLink]);
      setLinkUrl("");
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const createSubmissionMutation = useMutation({
    mutationFn: async (data: { submissionText: string }) => {
      const response = await apiRequest("POST", "/api/v1/submissions", {
        assignmentId,
        studentId,
        content: data.submissionText,
      });

      const responseText = await response.text();
      let submission;
      
      if (responseText) {
        try {
          submission = JSON.parse(responseText);
        } catch (parseError) {
          if (!response.ok) {
            throw new Error(responseText || "Failed to submit assignment");
          }
          throw new Error("Invalid JSON response from server");
        }
      }

      if (!response.ok) {
        const errorMessage = submission?.error || "Failed to submit assignment";
        throw new Error(errorMessage);
      }
      
      if (!submission || !submission.id) {
        throw new Error("Invalid response from server - submission ID missing");
      }

      return submission;
    },
    onSuccess: async (newSubmission) => {
      const completedAttachments = attachments.filter(att => !att.isUploading && att.url);
      
      if (completedAttachments.length > 0) {
        try {
          for (const attachment of completedAttachments) {
            const response = await apiRequest("POST", `/api/v1/submissions/${newSubmission.id}/attachments`, {
              type: attachment.type,
              url: attachment.url,
              fileName: attachment.fileName || null,
              fileSize: attachment.fileSize || null,
              mimeType: attachment.mimeType || null,
            });

            if (!response.ok) {
              const errorText = await response.text();
              let errorData;
              try {
                errorData = JSON.parse(errorText);
              } catch {
                // Ignore JSON parse error
              }
              throw new Error(errorData?.error || errorText || "Failed to create attachment");
            }
          }
          
          queryClient.invalidateQueries({ queryKey: ["/api/v1/users"] });
          queryClient.invalidateQueries({ queryKey: ["/api/v1/submissions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/v1/assignments?teacher_id="] });
          queryClient.invalidateQueries({ queryKey: ["/api/v1/analytics"] });
          
          toast({
            title: "Success",
            description: "Assignment submitted successfully",
          });
          
          handleClose();
        } catch (error) {
          toast({
            title: "Attachment Error",
            description: `Submission created, but attachments failed to upload: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
            variant: "destructive",
          });
          
          queryClient.invalidateQueries({ queryKey: ["/api/students"] });
          queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/teacher/assignments"] });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/teacher/assignments"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
        
        toast({
          title: "Success",
          description: "Assignment submitted successfully",
        });
        
        handleClose();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit assignment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = () => {
    if (!submissionText.trim() && attachments.length === 0) {
      toast({
        title: "Empty submission",
        description: "Please add text or attachments to your submission",
        variant: "destructive",
      });
      return;
    }

    createSubmissionMutation.mutate({ submissionText: submissionText.trim() });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'homework': return 'default';
      case 'quiz': return 'secondary';
      case 'exam': return 'destructive';
      case 'project': return 'outline';
      default: return 'default';
    }
  };

  const getDueDateStatus = (dueDate: Date | null) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const timeDiff = due.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return { text: 'Overdue', variant: 'destructive' as const, icon: AlertCircle };
    if (daysDiff === 0) return { text: 'Due Today', variant: 'destructive' as const, icon: AlertCircle };
    if (daysDiff <= 3) return { text: `Due in ${daysDiff} days`, variant: 'default' as const, icon: Clock };
    return null;
  };

  const dueDateStatus = assignment ? getDueDateStatus(assignment.dueDate) : null;
  const isSubmitted = !!existingSubmission;
  const isGraded = !!(existingSubmission?.grade);
  const hasAnyUploading = attachments.some(att => att.isUploading);
  
  // Don't show overdue if submitted or graded
  const shouldShowDueDateStatus = dueDateStatus && !isSubmitted && !isGraded;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="assignment-detail-modal">
        {!assignment || isAssignmentLoading || isSubmissionLoading ? (
          <div className="space-y-6 py-6">
            <div className="animate-pulse space-y-4">
              {/* Title and header skeleton */}
              <div>
                <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-6 bg-muted rounded w-32"></div>
                  <div className="h-6 bg-muted rounded w-28"></div>
                  <div className="h-6 bg-muted rounded w-24"></div>
                </div>
              </div>

              {/* Description skeleton */}
              <div>
                <div className="h-5 bg-muted rounded w-24 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/5"></div>
                </div>
              </div>

              {/* Separator */}
              <div className="h-px bg-muted"></div>

              {/* Materials skeleton */}
              <div>
                <div className="h-5 bg-muted rounded w-32 mb-3"></div>
                <div className="space-y-2">
                  <div className="border rounded p-3 bg-muted/50 h-16"></div>
                  <div className="border rounded p-3 bg-muted/50 h-16"></div>
                </div>
              </div>

              {/* Submission skeleton */}
              <div>
                <div className="h-5 bg-muted rounded w-40 mb-3"></div>
                <div className="border rounded p-4 space-y-3">
                  <div className="h-20 bg-muted rounded"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-12 bg-muted rounded"></div>
                  </div>
                </div>
              </div>

              {/* Buttons skeleton */}
              <div className="flex justify-end gap-2 pt-4">
                <div className="h-9 bg-muted rounded w-20"></div>
                <div className="h-9 bg-muted rounded w-28"></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">{assignment.title}</DialogTitle>
          <DialogDescription>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant={getTypeColor(assignment.type) as any} className="text-xs">
                {assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}
              </Badge>
              {teacher && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span>{teacher.name || `${teacher.firstName} ${teacher.lastName}`}</span>
                </div>
              )}
              {assignment.dueDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Due {format(new Date(assignment.dueDate), 'MMM d, yyyy')}</span>
                </div>
              )}
              {shouldShowDueDateStatus && (
                <Badge variant={dueDateStatus.variant} className="text-xs gap-1">
                  <dueDateStatus.icon className="w-3 h-3" />
                  {dueDateStatus.text}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Max Score: {assignment.maxScore || 100}</span>
              </div>
              {isSubmitted && (
                <Badge variant="default" className="text-xs gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Submitted
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Assignment Description */}
          {assignment.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {assignment.description}
              </p>
            </div>
          )}

          {/* Assignment Attachments */}
          {assignment.attachments && assignment.attachments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Assignment Materials</h3>
              <div className="space-y-2">
                {assignment.attachments.map((attachment) => (
                  <Card 
                    key={attachment.id} 
                    className="overflow-hidden hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => window.open(attachment.url, '_blank')}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {attachment.type === "file" ? (
                          <FileText className="w-5 h-5 text-primary" />
                        ) : (
                          <LinkIcon className="w-5 h-5 text-primary" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {attachment.fileName || "Attachment"}
                          </p>
                          {attachment.fileSize && (
                            <p className="text-xs text-muted-foreground">
                              {(attachment.fileSize / 1024).toFixed(1)} KB
                            </p>
                          )}
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
                          data-testid={`button-download-${attachment.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Existing Submission Display */}
          {isSubmitted && existingSubmission && (
            <div>
              <h3 className="font-semibold mb-2">Your Submission</h3>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  {existingSubmission.content && (
                    <p className="text-sm whitespace-pre-wrap mb-4">
                      {existingSubmission.content}
                    </p>
                  )}
                  {existingSubmission.attachments && existingSubmission.attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Attachments:</p>
                      {existingSubmission.attachments.map((attachment) => (
                        <Card 
                          key={attachment.id} 
                          className="overflow-hidden hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => window.open(attachment.url, '_blank')}
                        >
                          <CardContent className="p-2">
                            <div className="flex items-center gap-2">
                              {attachment.type === "file" ? (
                                <FileText className="w-4 h-4 text-primary" />
                              ) : (
                                <LinkIcon className="w-4 h-4 text-primary" />
                              )}
                              <div className="flex-1 min-w-0">
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
                                className="h-6"
                                data-testid={`button-view-submission-${attachment.id}`}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  {existingSubmission.grade && (
                    <div className="mt-4 p-3 bg-background rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Grade:</span>
                        <span className="text-lg font-bold text-primary">
                          {existingSubmission.grade.score} / {assignment.maxScore || 100}
                        </span>
                      </div>
                      {existingSubmission.grade.feedback && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Feedback:</p>
                          <p className="text-sm">{existingSubmission.grade.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {existingSubmission.submittedAt && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Submitted on {format(new Date(existingSubmission.submittedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Submission Form - Only show if not submitted */}
          {!isSubmitted && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Your Submission</h3>
                <Textarea
                  placeholder="Enter your submission text here..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="min-h-32"
                  data-testid="textarea-submission"
                />
              </div>

              {/* File Upload */}
              <div>
                <h3 className="font-semibold mb-2">Attachments</h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={hasAnyUploading}
                      data-testid="button-upload-file"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste a link..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                      data-testid="input-link-url"
                    />
                    <Button
                      variant="outline"
                      onClick={handleAddLink}
                      disabled={!linkUrl.trim()}
                      data-testid="button-add-link"
                    >
                      Add Link
                    </Button>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <Card key={attachment.id}>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              {attachment.type === "file" ? (
                                <FileText className="w-5 h-5 text-primary" />
                              ) : (
                                <LinkIcon className="w-5 h-5 text-primary" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {attachment.fileName || attachment.url}
                                </p>
                                {attachment.fileSize && (
                                  <p className="text-xs text-muted-foreground">
                                    {(attachment.fileSize / 1024).toFixed(1)} KB
                                    {attachment.isUploading && " - Uploading..."}
                                  </p>
                                )}
                              </div>
                              {!attachment.isUploading && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveAttachment(attachment.id)}
                                  data-testid={`button-remove-${attachment.id}`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={createSubmissionMutation.isPending}
                  data-testid="button-cancel-submission"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={createSubmissionMutation.isPending || hasAnyUploading}
                  data-testid="button-submit-assignment"
                >
                  {hasAnyUploading ? "Uploading files..." : "Submit Assignment"}
                </Button>
              </div>
            </>
          )}
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
