import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Assignment, Course } from "@shared/schema";
import { insertAssignmentSchema } from "@shared/schema";
import { z } from "zod";
import { FileText, Link as LinkIcon, Upload, X, Paperclip, CheckCircle, Users, UserCheck } from "lucide-react";

interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  assignment?: Assignment;
  courseId?: string;
}

interface AttachmentUpload {
  id: string;
  type: 'file' | 'link';
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  file?: File;
  errorMessage?: string;
}

const assignmentFormSchema = insertAssignmentSchema.extend({
  courseId: z.string().min(1, "Course is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["homework", "quiz", "exam", "project"]),
  dueDate: z.string().optional(),
  maxScore: z.number().min(0).optional(),
  isPublished: z.boolean().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

interface EnrolledStudent {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export function AssignmentFormModal({ isOpen, onClose, teacherId, assignment, courseId }: AssignmentFormModalProps) {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<AttachmentUpload[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [createdAssignmentId, setCreatedAssignmentId] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSharedAssignment, setIsSharedAssignment] = useState(true);

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/teachers", teacherId, "courses"],
    enabled: isOpen && !courseId,
  });

  // Get the selected course ID from form or prop
  const [watchedCourseId, setWatchedCourseId] = useState<string>(courseId || "");

  // Fetch students assigned to this specific teacher for the selected course
  const { data: assignedStudents = [] } = useQuery<EnrolledStudent[]>({
    queryKey: ["/api/courses", watchedCourseId, "assigned-students", teacherId],
    enabled: isOpen && !!watchedCourseId && !!teacherId,
  });

  // Use the assigned students directly (already filtered by teacher assignment)
  const enrolledStudents = assignedStudents;

  // Reset student selection when course changes
  useEffect(() => {
    setSelectedStudentIds([]);
    setIsSharedAssignment(true);
  }, [watchedCourseId]);

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      courseId: courseId || assignment?.courseId || "",
      teacherId: teacherId,
      title: assignment?.title || "",
      description: assignment?.description || "",
      type: assignment?.type || "homework",
      dueDate: assignment?.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : "",
      maxScore: assignment?.maxScore || 100,
      isPublished: true,
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      // Skip assignment creation if we already have one (retry scenario)
      if (createdAssignmentId) {
        return { id: createdAssignmentId, skipCreation: true };
      }

      const response = await apiRequest("POST", "/api/assignments", {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        isShared: isSharedAssignment,
      });

      // Parse response body once - handle both JSON and text responses
      const responseText = await response.text();
      let assignment;
      
      if (responseText) {
        try {
          assignment = JSON.parse(responseText);
        } catch (parseError) {
          if (!response.ok) {
            throw new Error(responseText || "Failed to create assignment");
          }
          throw new Error("Invalid JSON response from server");
        }
      }

      if (!response.ok) {
        const errorMessage = assignment?.error || "Failed to create assignment";
        throw new Error(errorMessage);
      }
      
      // Validate that we received a valid assignment with an ID
      if (!assignment || !assignment.id) {
        throw new Error("Invalid response from server - assignment ID missing");
      }

      return assignment;
    },
    onSuccess: async (newAssignment) => {
      // Store created assignment ID for potential retry
      if (!newAssignment.skipCreation) {
        setCreatedAssignmentId(newAssignment.id);
      }

      // Separate pending/failed files and link attachments
      // Include both 'pending' and 'failed' to support retries
      const pendingFileAttachments = attachments.filter(att => 
        att.type === 'file' && 
        (att.status === 'pending' || att.status === 'failed') && 
        att.file
      );
      // Include uploaded files that haven't had their attachment records created yet
      const uploadedFilesNeedingRecords = attachments.filter(att =>
        att.type === 'file' &&
        att.status === 'uploaded' &&
        att.url
      );
      const linkAttachments = attachments.filter(att => att.type === 'link' && att.status === 'uploaded');
      
      const allAttachmentsNeedingRecords = [...uploadedFilesNeedingRecords, ...linkAttachments];
      
      if (pendingFileAttachments.length > 0 || allAttachmentsNeedingRecords.length > 0) {
        try {
          // First, upload all pending/failed files to object storage
          for (const attachment of pendingFileAttachments) {
            if (!attachment.file) continue;
            
            // Mark as uploading
            setAttachments(prev => prev.map(att => 
              att.id === attachment.id ? { ...att, status: 'uploading' as const } : att
            ));

            const fileExtension = attachment.file.name.split('.').pop() || '';
            
            // Get presigned upload URL with real assignment ID
            const uploadResponse = await apiRequest("POST", "/api/assignments/attachments/upload-url", {
              assignmentId: newAssignment.id,
              fileExtension,
              mimeType: attachment.file.type,
            });

            if (!uploadResponse.ok) {
              const error = await uploadResponse.json();
              throw new Error(error.error || 'Failed to get upload URL');
            }

            const { uploadUrl, publicUrl } = await uploadResponse.json();

            // Upload file to object storage
            const uploadResult = await fetch(uploadUrl, {
              method: 'PUT',
              body: attachment.file,
              headers: {
                'Content-Type': attachment.file.type,
              },
            });

            if (!uploadResult.ok) {
              throw new Error(`File upload to storage failed for ${attachment.fileName}`);
            }

            // Update attachment with public URL and mark as uploaded
            setAttachments(prev => prev.map(att => 
              att.id === attachment.id 
                ? { ...att, url: publicUrl, status: 'uploaded' as const }
                : att
            ));
            
            // Update local reference
            attachment.url = publicUrl;
            attachment.status = 'uploaded';
          }
          
          // Now create attachment records for all uploaded files and links
          // This includes newly-uploaded files (from pendingFileAttachments) and previously-uploaded files/links
          const allUploadedAttachments = attachments.filter(att => att.status === 'uploaded' && att.url);
          
          for (const attachment of allUploadedAttachments) {
            
            const response = await apiRequest("POST", `/api/assignments/${newAssignment.id}/attachments`, {
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
          
          // All attachments uploaded and created successfully
          const targetCourseId = courseId || newAssignment.courseId;
          queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
          queryClient.invalidateQueries({ queryKey: ["/api/teacher/assignments", teacherId] });
          queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
          if (targetCourseId) {
            queryClient.invalidateQueries({ queryKey: ["/api/courses", targetCourseId, "assignments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/courses", targetCourseId] });
          }
          
          // Assign to individual students if not shared
          if (!isSharedAssignment && selectedStudentIds.length > 0) {
            try {
              const response = await apiRequest("PUT", `/api/assignments/${newAssignment.id}/individual-mappings`, {
                studentIds: selectedStudentIds,
              });
              const responseData = await response.json();
              console.log("Individual mappings created:", responseData);
              // Force refresh of related queries
              await queryClient.refetchQueries({ queryKey: ["/api/assignments", newAssignment.id, "individual-mappings"] });
              queryClient.invalidateQueries({ queryKey: ["/api/assignments", newAssignment.id] });
              queryClient.invalidateQueries({ queryKey: ["/api/teacher/assignments"] });
            } catch (mappingError) {
              console.error("Failed to assign individual students:", mappingError instanceof Error ? mappingError.message : String(mappingError));
              toast({
                title: "Warning",
                description: "Assignment created but failed to assign individual students. You can edit the assignment to assign students.",
                variant: "destructive",
              });
            }
          }

          toast({
            title: "Success",
            description: newAssignment.skipCreation 
              ? "Attachments uploaded successfully"
              : isSharedAssignment 
                ? "Assignment created successfully with attachments"
                : `Assignment created and assigned to ${selectedStudentIds.length} student(s) with attachments`,
          });
          
          handleClose();
        } catch (error) {
          // Mark failed attachments
          setAttachments(prev => prev.map(att => 
            att.status === 'uploading' || att.status === 'pending'
              ? { ...att, status: 'failed' as const, errorMessage: error instanceof Error ? error.message : 'Upload failed' }
              : att
          ));
          
          // Attachment upload/creation failed - show error and keep modal open for retry
          toast({
            title: "Attachment Error",
            description: `${newAssignment.skipCreation ? "Attachments" : "Assignment created, but attachments"} failed to upload: ${error instanceof Error ? error.message : "Unknown error"}. Click Create Assignment again to retry attaching files.`,
            variant: "destructive",
          });
          
          // Invalidate queries so assignment appears
          const targetCourseId = courseId || newAssignment.courseId;
          queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
          queryClient.invalidateQueries({ queryKey: ["/api/teacher/assignments", teacherId] });
          queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
          if (targetCourseId) {
            queryClient.invalidateQueries({ queryKey: ["/api/courses", targetCourseId, "assignments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/courses", targetCourseId] });
          }
        }
      } else {
        // No attachments - just complete
        const targetCourseId = courseId || newAssignment.courseId;
        queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/teacher/assignments", teacherId] });
        queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
        if (targetCourseId) {
          queryClient.invalidateQueries({ queryKey: ["/api/courses", targetCourseId, "assignments"] });
          queryClient.invalidateQueries({ queryKey: ["/api/courses", targetCourseId] });
        }
        
        // Assign to individual students if not shared
        if (!isSharedAssignment && selectedStudentIds.length > 0) {
          try {
            const response = await apiRequest("PUT", `/api/assignments/${newAssignment.id}/individual-mappings`, {
              studentIds: selectedStudentIds,
            });
            const responseData = await response.json();
            console.log("Individual mappings created:", responseData);
            // Force refresh of related queries
            await queryClient.refetchQueries({ queryKey: ["/api/assignments", newAssignment.id, "individual-mappings"] });
            queryClient.invalidateQueries({ queryKey: ["/api/assignments", newAssignment.id] });
            queryClient.invalidateQueries({ queryKey: ["/api/teacher/assignments"] });
            
            toast({
              title: "Success",
              description: `Assignment created and assigned to ${selectedStudentIds.length} student(s)`,
            });
          } catch (mappingError) {
            console.error("Failed to assign individual students:", mappingError instanceof Error ? mappingError.message : String(mappingError));
            toast({
              title: "Warning",
              description: "Assignment created but failed to assign individual students. You can edit the assignment to assign students.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Success",
            description: "Assignment created successfully",
          });
        }
        
        handleClose();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create assignment",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const selectedCourseId = form.getValues("courseId");
    if (!selectedCourseId) {
      toast({
        title: "Error",
        description: "Please select a course first",
        variant: "destructive",
      });
      return;
    }

    // Store files in state without uploading yet (upload happens after assignment creation)
    for (const file of Array.from(files)) {
      const tempId = Math.random().toString(36).substring(7);

      setAttachments(prev => [...prev, {
        id: tempId,
        type: 'file',
        url: '',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        status: 'pending',
        file: file,
      }]);
    }

    toast({
      title: "Files Added",
      description: `${files.length} file(s) will be uploaded after assignment creation`,
    });
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setAttachments(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      type: 'link',
      url: linkUrl,
      fileName: linkUrl,
      status: 'uploaded',
    }]);

    setLinkUrl("");
    toast({
      title: "Link Added",
      description: "Link attached successfully",
    });
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleClose = () => {
    form.reset();
    setAttachments([]);
    setLinkUrl("");
    setCreatedAssignmentId(null);
    setSelectedStudentIds([]);
    setIsSharedAssignment(true);
    setWatchedCourseId(courseId || "");
    onClose();
  };

  const handleStudentToggle = (studentId: string, checked: boolean) => {
    setSelectedStudentIds(prev => 
      checked 
        ? [...prev, studentId]
        : prev.filter(id => id !== studentId)
    );
  };

  const handleAssignmentTypeChange = (shared: boolean) => {
    setIsSharedAssignment(shared);
    if (shared) {
      setSelectedStudentIds([]);
    }
  };

  const getStudentInitials = (student: EnrolledStudent) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
    }
    if (student.email) {
      return student.email[0].toUpperCase();
    }
    return "?";
  };

  const getStudentName = (student: EnrolledStudent) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.email || "Unknown Student";
  };

  const onSubmit = (data: AssignmentFormData) => {
    // Validate that at least one student is selected when individual mode is chosen
    if (!isSharedAssignment && selectedStudentIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student or choose 'All Students'",
        variant: "destructive",
      });
      return;
    }
    createAssignmentMutation.mutate(data);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" data-testid="assignment-form-modal">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {assignment ? "Edit Assignment" : "Create New Assignment"}
          </DialogTitle>
          <DialogDescription>
            {assignment ? "Update assignment details" : "Fill in the details to create a new assignment"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            {/* Course Selection (only if not pre-selected) - Always visible at top */}
            {!courseId && (
              <div className="px-1 pb-4">
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setWatchedCourseId(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-course">
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Three-Tab Layout */}
            <Tabs defaultValue="details" className="flex flex-col flex-1 overflow-hidden">
              <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20 flex-wrap flex-shrink-0" data-testid="assignment-tabs-list">
                <TabsTrigger 
                  value="details" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                  data-testid="tab-details"
                >
                  <FileText className="w-4 h-4" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="attachments" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                  data-testid="tab-attachments"
                >
                  <Paperclip className="w-4 h-4" />
                  <span>Attachments</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="assign" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                  data-testid="tab-assign"
                  disabled={!watchedCourseId}
                >
                  <Users className="w-4 h-4" />
                  <span>Assign</span>
                </TabsTrigger>
              </TabsList>

              {/* Details Tab Content */}
              <TabsContent value="details" className="flex-1 overflow-y-auto space-y-4 pr-1 pt-4">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Assignment title"
                          {...field}
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the assignment..."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type and Due Date Row */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="homework">Homework</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="exam">Exam</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-due-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Max Score */}
                <FormField
                  control={form.control}
                  name="maxScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Score</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-max-score"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Attachments Tab Content */}
              <TabsContent value="attachments" className="flex-1 overflow-y-auto space-y-4 pr-1 pt-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="text-sm text-muted-foreground">Upload Files</Label>
                  <div className="flex gap-2">
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.zip"
                      data-testid="input-file-upload"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="icon" disabled>
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supported: PDF, Word, Images, Text, ZIP (max 10MB)
                  </p>
                </div>

                {/* Link Attachment */}
                <div className="space-y-2">
                  <Label htmlFor="link-url" className="text-sm text-muted-foreground">Add Link</Label>
                  <div className="flex gap-2">
                    <Input
                      id="link-url"
                      type="url"
                      placeholder="https://example.com"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      data-testid="input-link-url"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddLink}
                      data-testid="button-add-link"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Attachments List */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Attached Files & Links</Label>
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 border rounded-md bg-muted/50"
                          data-testid={`attachment-${attachment.id}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {attachment.type === 'file' ? (
                              <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                              {attachment.fileSize && (
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(attachment.fileSize)}
                                </p>
                              )}
                            </div>
                            {attachment.status === 'pending' ? (
                              <Badge variant="secondary" className="text-xs">
                                Pending
                              </Badge>
                            ) : attachment.status === 'uploading' ? (
                              <Badge variant="secondary" className="text-xs">
                                Uploading...
                              </Badge>
                            ) : attachment.status === 'failed' ? (
                              <Badge variant="destructive" className="text-xs">
                                Failed
                              </Badge>
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAttachment(attachment.id)}
                            data-testid={`button-remove-${attachment.id}`}
                            className="ml-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {attachments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Paperclip className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">No attachments yet</p>
                    <p className="text-xs">Upload files or add links above</p>
                  </div>
                )}
              </TabsContent>

              {/* Assign To Tab Content */}
              <TabsContent value="assign" className="flex-1 overflow-y-auto space-y-4 pr-1 pt-4">
                {!watchedCourseId ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">Select a course first</p>
                    <p className="text-xs">Go to the Details tab to select a course</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isSharedAssignment ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAssignmentTypeChange(true)}
                        data-testid="button-assign-all"
                      >
                        All Students
                      </Button>
                      <Button
                        type="button"
                        variant={!isSharedAssignment ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAssignmentTypeChange(false)}
                        data-testid="button-assign-individual"
                      >
                        Select Students
                      </Button>
                    </div>

                    {isSharedAssignment ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <Users className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm font-medium">Shared with All Students</p>
                        <p className="text-xs">This assignment will be visible to all enrolled students in the course.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Select specific students to assign this assignment to:
                        </p>
                        
                        {enrolledStudents.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">
                            No enrolled students found in this course.
                          </p>
                        ) : (
                          <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                            {enrolledStudents.map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center gap-3 p-2 hover-elevate rounded-md"
                                data-testid={`student-checkbox-${student.id}`}
                              >
                                <Checkbox
                                  id={`student-${student.id}`}
                                  checked={selectedStudentIds.includes(student.id)}
                                  onCheckedChange={(checked) => handleStudentToggle(student.id, checked as boolean)}
                                />
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={student.avatarUrl || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {getStudentInitials(student)}
                                  </AvatarFallback>
                                </Avatar>
                                <label
                                  htmlFor={`student-${student.id}`}
                                  className="text-sm font-medium cursor-pointer flex-1"
                                >
                                  {getStudentName(student)}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedStudentIds.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <UserCheck className="w-4 h-4" />
                            {selectedStudentIds.length} student(s) selected
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createAssignmentMutation.isPending ||
                  attachments.some(att => att.status === 'uploading')
                }
                data-testid="button-create-assignment-submit"
              >
                {createAssignmentMutation.isPending
                  ? "Creating..."
                  : attachments.some(att => att.status === 'uploading')
                  ? "Uploading files..."
                  : assignment
                  ? "Update Assignment"
                  : "Create Assignment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
