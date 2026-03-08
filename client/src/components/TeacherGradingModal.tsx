import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Assignment, SubmissionForGrading } from "@shared/schema";
import { FileText, Link as LinkIcon, CheckCircle, Clock, User, Mail, AlertCircle, Calendar, FileIcon, Download, Edit, X } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";

interface TeacherGradingModalProps {
  assignment: Assignment | null;
  assignmentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  teacherId?: string;
}

export function TeacherGradingModal({ assignment, assignmentId, isOpen, onClose, teacherId }: TeacherGradingModalProps) {
  const { toast } = useToast();
  const [gradingData, setGradingData] = useState<Record<string, { score: string; feedback: string }>>({});
  const [editingSubmissions, setEditingSubmissions] = useState<Record<string, boolean>>({});

  const { data: submissions = [], isLoading } = useQuery<SubmissionForGrading[]>({
    queryKey: [`/api/assignments/${assignmentId}/grading`],
    enabled: isOpen && !!assignmentId,
  });

  // Initialize editing state based on whether submissions have grades
  // Only update for NEW submission IDs to preserve active edits during refetches
  useEffect(() => {
    if (submissions.length > 0) {
      setEditingSubmissions(prev => {
        const updated = { ...prev };
        submissions.forEach(submission => {
          // Only initialize if this submission ID hasn't been seen before
          if (!(submission.id in updated)) {
            // Ungraded submissions start in edit mode, graded ones in read-only
            updated[submission.id] = !submission.grade;
          }
        });
        return updated;
      });
    }
  }, [submissions]);

  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, score, feedback, gradedBy }: { submissionId: string; score: number; feedback: string; gradedBy: string }) => {
      return await apiRequest("POST", `/api/grades`, { 
        submissionId, 
        score, 
        feedback: feedback || undefined,
        gradedBy 
      });
    },
    onSuccess: async (_, variables) => {
      // First, ensure edit mode is disabled for this submission
      setEditingSubmissions(prev => ({ ...prev, [variables.submissionId]: false }));
      
      // Invalidate and refetch to get fresh data from the database
      await queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignmentId}/grading`] });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/analytics"] }); // Update teacher analytics
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      
      // Invalidate course assignments to update grading stats on course page
      if (assignment?.courseId) {
        queryClient.invalidateQueries({ queryKey: ["/api/courses", assignment.courseId, "assignments"] });
      }
      
      toast({
        title: "Grade submitted",
        description: "The grade has been successfully recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit grade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGradeSubmit = (submissionId: string, maxScore: number) => {
    const data = gradingData[submissionId];
    if (!data || !data.score) {
      toast({
        title: "Missing score",
        description: "Please enter a score before submitting.",
        variant: "destructive",
      });
      return;
    }

    const score = parseFloat(data.score);
    if (isNaN(score) || score < 0 || score > maxScore) {
      toast({
        title: "Invalid score",
        description: `Score must be between 0 and ${maxScore}.`,
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
      submissionId,
      score,
      feedback: data.feedback || "",
      gradedBy: teacherId,
    });
  };

  const updateGradingData = (submissionId: string, field: "score" | "feedback", value: string) => {
    setGradingData(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        score: prev[submissionId]?.score || "",
        feedback: prev[submissionId]?.feedback || "",
        [field]: value,
      },
    }));
  };

  const enterEditMode = (submission: SubmissionForGrading) => {
    // Prefill form with existing grade data when entering edit mode
    if (submission.grade) {
      setGradingData(prev => ({
        ...prev,
        [submission.id]: {
          score: submission.grade!.score.toString(),
          feedback: submission.grade!.feedback || "",
        },
      }));
    }
    setEditingSubmissions(prev => ({ ...prev, [submission.id]: true }));
  };

  const cancelEditMode = (submission: SubmissionForGrading) => {
    // Revert to persisted grade data when canceling
    if (submission.grade) {
      setGradingData(prev => ({
        ...prev,
        [submission.id]: {
          score: submission.grade!.score.toString(),
          feedback: submission.grade!.feedback || "",
        },
      }));
    }
    setEditingSubmissions(prev => ({ ...prev, [submission.id]: false }));
  };

  const handleClose = () => {
    setGradingData({});
    setEditingSubmissions({});
    onClose();
  };

  if (!assignment) {
    return null;
  }

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return FileText;
    if (mimeType.startsWith('image/')) return FileText;
    return FileText;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" data-testid="dialog-teacher-grading">
        <DialogHeader>
          <DialogTitle>Grade Submissions - {assignment.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Submissions Yet</h3>
                <p className="text-muted-foreground">
                  Students haven't submitted their work for this assignment yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-2">
            {submissions.map((submission) => {
              const currentGrade = gradingData[submission.id] || {
                score: submission.grade?.score?.toString() || "",
                feedback: submission.grade?.feedback || "",
              };

              // Calculate submission status
              const isLate = submission.assignment.dueDate && submission.submittedAt
                ? new Date(submission.submittedAt) > new Date(submission.assignment.dueDate)
                : false;
              
              const totalAttachmentSize = submission.attachments.reduce((total, att) => total + (att.fileSize || 0), 0);

              return (
                <AccordionItem key={submission.id} value={submission.id} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline" data-testid={`accordion-submission-${submission.id}`}>
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={submission.student.avatarUrl || undefined} />
                        <AvatarFallback>
                          {submission.student.firstName?.[0]}{submission.student.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="font-medium">
                          {submission.student.firstName} {submission.student.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Submitted {format(new Date(submission.submittedAt!), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                      {isLate && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          Late
                        </Badge>
                      )}
                      {submission.grade ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Graded: {submission.grade.score}/{assignment.maxScore}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="w-3 h-3" />
                          Not Graded
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-4">
                    {/* Student Details Section */}
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{submission.student.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Submitted:</span>
                          <span className="font-medium">
                            {format(new Date(submission.submittedAt!), 'MMM d, yyyy h:mm a')}
                          </span>
                          {isLate && (
                            <Badge variant="destructive" className="ml-2 text-xs">Late Submission</Badge>
                          )}
                        </div>
                        {submission.attachments.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Attachments:</span>
                            <span className="font-medium">
                              {submission.attachments.length} file{submission.attachments.length !== 1 ? 's' : ''} 
                              {totalAttachmentSize > 0 && ` (${(totalAttachmentSize / 1024 / 1024).toFixed(2)} MB)`}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Existing Grade History */}
                    {submission.grade && (
                      <Card className="border-primary/40 bg-primary/5">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            Grade History
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Score:</span>
                            <span className="text-lg font-bold text-primary">
                              {submission.grade.score} / {assignment.maxScore || 100}
                            </span>
                          </div>
                          {submission.grade.feedback && (
                            <div>
                              <Label className="text-sm mb-1 block">Feedback:</Label>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {submission.grade.feedback}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Graded: {format(new Date(submission.grade.gradedAt!), 'MMM d, yyyy h:mm a')}</span>
                            </div>
                            {submission.grade.grader && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>
                                  By: {submission.grade.grader.firstName} {submission.grade.grader.lastName}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Submission Content */}
                    {submission.content && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Submission</Label>
                        <Card>
                          <CardContent className="pt-4">
                            <p className="text-sm whitespace-pre-wrap">{submission.content}</p>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Attachments ({submission.attachments.length})</Label>
                      {submission.attachments.length > 0 ? (
                        <div className="space-y-2">
                          {submission.attachments.map((attachment) => {
                            const Icon = attachment.type === 'link' ? LinkIcon : getFileIcon(attachment.mimeType);
                            const fileTypeLabel = attachment.type === 'link' ? 'Link' : (attachment.mimeType || 'File');
                            return (
                              <Card key={attachment.id} className="hover-elevate active-elevate-2">
                                <CardContent className="p-3">
                                  <a
                                    href={`/api/submissions/attachments/${attachment.id}/download`}
                                    className="flex items-center gap-3"
                                    data-testid={`link-attachment-${attachment.id}`}
                                  >
                                    <div className="p-2 rounded-lg bg-primary/10">
                                      <Icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm truncate">
                                        {attachment.fileName || attachment.url}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{fileTypeLabel}</span>
                                        {attachment.fileSize && (
                                          <>
                                            <span>•</span>
                                            <span>{(attachment.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <Download className="w-4 h-4 text-muted-foreground" />
                                  </a>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <Card className="border-dashed">
                          <CardContent className="py-6 text-center">
                            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              No files uploaded with this submission
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium mb-3 block">Grade Submission</Label>
                      
                      {/* Read-only view when grade exists and not in edit mode */}
                      {submission.grade && !editingSubmissions[submission.id] ? (
                        <Card className="bg-muted/30">
                          <CardContent className="pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Current Score:</span>
                              <span className="text-lg font-bold text-primary">
                                {submission.grade.score} / {assignment.maxScore || 100}
                              </span>
                            </div>
                            {submission.grade.feedback && (
                              <div>
                                <Label className="text-sm mb-1 block">Feedback:</Label>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background/50 p-3 rounded-md">
                                  {submission.grade.feedback}
                                </p>
                              </div>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => enterEditMode(submission)}
                              className="w-full gap-2"
                              data-testid={`button-edit-grade-${submission.id}`}
                            >
                              <Edit className="w-4 h-4" />
                              Edit Grade
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        /* Editable form */
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`score-${submission.id}`} className="text-sm mb-1 block">
                              Score (out of {assignment.maxScore})
                            </Label>
                            <Input
                              id={`score-${submission.id}`}
                              type="number"
                              min="0"
                              max={assignment.maxScore || 100}
                              value={currentGrade.score}
                              onChange={(e) => updateGradingData(submission.id, "score", e.target.value)}
                              placeholder="Enter score"
                              data-testid={`input-score-${submission.id}`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`feedback-${submission.id}`} className="text-sm mb-1 block">
                              Feedback (Optional)
                            </Label>
                            <Textarea
                              id={`feedback-${submission.id}`}
                              value={currentGrade.feedback}
                              onChange={(e) => updateGradingData(submission.id, "feedback", e.target.value)}
                              placeholder="Provide feedback to the student..."
                              rows={3}
                              data-testid={`textarea-feedback-${submission.id}`}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleGradeSubmit(submission.id, assignment.maxScore || 100)}
                              disabled={gradeMutation.isPending}
                              className="flex-1"
                              data-testid={`button-submit-grade-${submission.id}`}
                            >
                              {submission.grade ? "Update Grade" : "Submit Grade"}
                            </Button>
                            {submission.grade && (
                              <Button
                                variant="outline"
                                onClick={() => cancelEditMode(submission)}
                                disabled={gradeMutation.isPending}
                                className="gap-2"
                                data-testid={`button-cancel-edit-${submission.id}`}
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
            </Accordion>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleClose} data-testid="button-close-grading">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
