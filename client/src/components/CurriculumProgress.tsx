import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Circle, Plus, BookOpen, ChevronRight, Loader2, GraduationCap, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { CurriculumUnitWithSubsections, CourseProgressSummary, User } from "@shared/schema";

interface CurriculumProgressProps {
  courseId: string;
  studentId: string;
  student: User;
  isTeacher?: boolean;
  isAdmin?: boolean;
}

export function CurriculumProgress({ courseId, studentId, student, isTeacher = false, isAdmin = false }: CurriculumProgressProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [addSubsectionOpen, setAddSubsectionOpen] = useState<string | null>(null);
  const [newSubsectionTitle, setNewSubsectionTitle] = useState("");
  const [newSubsectionDescription, setNewSubsectionDescription] = useState("");
  const [deleteSubsectionId, setDeleteSubsectionId] = useState<string | null>(null);
  const [deleteSubsectionTitle, setDeleteSubsectionTitle] = useState("");

  const { data: progressSummary, isLoading } = useQuery<CourseProgressSummary>({
    queryKey: ["/api/courses", courseId, "progress", studentId],
  });

  // Listen for curriculum updates via WebSocket
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'curriculum_updated' && message.courseId === courseId) {
          // Invalidate the course progress query to fetch latest data
          queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "progress", studentId] });
        }
      } catch (error) {
        // Silently ignore parsing errors
      }
    };

    const ws = (window as any).__ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, [courseId, studentId]);

  const markCompleteMutation = useMutation({
    mutationFn: async ({ unitId, notes }: { unitId: string; notes?: string }) => {
      return apiRequest("POST", `/api/courses/${courseId}/progress/${studentId}/units/${unitId}/complete`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "progress", studentId] });
      toast({
        title: "Unit marked complete",
        description: "The student and their parents have been notified.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markIncompleteMutation = useMutation({
    mutationFn: async (unitId: string) => {
      return apiRequest("POST", `/api/courses/${courseId}/progress/${studentId}/units/${unitId}/incomplete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "progress", studentId] });
      toast({
        title: "Unit marked incomplete",
        description: "Progress has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addSubsectionMutation = useMutation({
    mutationFn: async ({ unitId, title, description }: { unitId: string; title: string; description?: string }) => {
      return apiRequest("POST", `/api/curriculum/${unitId}/subsections`, { title, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "progress", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "curriculum"] });
      setAddSubsectionOpen(null);
      setNewSubsectionTitle("");
      setNewSubsectionDescription("");
      toast({
        title: "Subsection added",
        description: "The new topic has been added to the curriculum.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSubsectionMutation = useMutation({
    mutationFn: async (subsectionId: string) => {
      return apiRequest("DELETE", `/api/subsections/${subsectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "progress", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "curriculum"] });
      toast({
        title: "Topic deleted",
        description: "The topic has been removed from the curriculum.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncCurriculumMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/courses/${courseId}/curriculum/sync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "progress", studentId] });
      toast({
        title: "Curriculum synced",
        description: "Curriculum units have been loaded from the course.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!progressSummary || progressSummary.totalUnits === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Curriculum Units Loaded</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
            Curriculum units need to be synced from the course definition.
          </p>
          {(isTeacher || isAdmin) && (
            <Button 
              onClick={() => syncCurriculumMutation.mutate()}
              disabled={syncCurriculumMutation.isPending}
              data-testid="button-sync-curriculum"
            >
              {syncCurriculumMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Load Curriculum Units
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const studentName = student.firstName && student.lastName
    ? `${student.firstName} ${student.lastName}`
    : student.name || student.email || "Student";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Course Progress
              </CardTitle>
              <CardDescription>
                {studentName}'s curriculum progress
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{progressSummary.progressPercentage}%</p>
              <p className="text-sm text-muted-foreground">
                {progressSummary.completedUnits} of {progressSummary.totalUnits} units
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressSummary.progressPercentage} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-medium">Curriculum Units</h3>
        <Accordion type="multiple" className="space-y-2">
          {progressSummary.units.map((unit, index) => (
            <AccordionItem 
              key={unit.id} 
              value={unit.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </span>
                  {unit.isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-medium">{unit.title}</p>
                    {unit.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{unit.description}</p>
                    )}
                  </div>
                  {unit.isCompleted && (
                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      Completed
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {unit.subsections && unit.subsections.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Related Topics</h4>
                      <ul className="space-y-1">
                        {unit.subsections.map((sub) => {
                          const canDelete = isAdmin || (isTeacher && currentUser?.id === sub.teacherId);
                          return (
                            <li key={sub.id} className="flex items-start justify-between gap-2 text-sm pl-4 group hover:bg-muted/30 rounded px-2 py-1 transition-colors">
                              <div className="flex items-start gap-2 flex-1">
                                <ChevronRight className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                <div>
                                  <span>{sub.title}</span>
                                  {sub.description && (
                                    <p className="text-muted-foreground">{sub.description}</p>
                                  )}
                                </div>
                              </div>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteSubsectionId(sub.id);
                                    setDeleteSubsectionTitle(sub.title);
                                  }}
                                  disabled={deleteSubsectionMutation.isPending}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  data-testid={`button-delete-subsection-${sub.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {(isTeacher || isAdmin) && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {unit.isCompleted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markIncompleteMutation.mutate(unit.id)}
                          disabled={markIncompleteMutation.isPending}
                          data-testid={`button-mark-incomplete-${unit.id}`}
                        >
                          {markIncompleteMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Circle className="w-4 h-4 mr-2" />
                          )}
                          Mark Incomplete
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => markCompleteMutation.mutate({ unitId: unit.id })}
                          disabled={markCompleteMutation.isPending}
                          data-testid={`button-mark-complete-${unit.id}`}
                        >
                          {markCompleteMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Mark Complete
                        </Button>
                      )}

                      <Dialog open={addSubsectionOpen === unit.id} onOpenChange={(open) => setAddSubsectionOpen(open ? unit.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`button-add-subsection-${unit.id}`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Topic
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Related Topic</DialogTitle>
                            <DialogDescription>
                              Add a sub-section or related topic under "{unit.title}".
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="subsection-title">Topic Title</Label>
                              <Input
                                id="subsection-title"
                                value={newSubsectionTitle}
                                onChange={(e) => setNewSubsectionTitle(e.target.value)}
                                placeholder="Enter topic title"
                                data-testid="input-subsection-title"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="subsection-description">Description (optional)</Label>
                              <Textarea
                                id="subsection-description"
                                value={newSubsectionDescription}
                                onChange={(e) => setNewSubsectionDescription(e.target.value)}
                                placeholder="Brief description of the topic"
                                data-testid="input-subsection-description"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setAddSubsectionOpen(null);
                                setNewSubsectionTitle("");
                                setNewSubsectionDescription("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => {
                                if (newSubsectionTitle.trim()) {
                                  addSubsectionMutation.mutate({
                                    unitId: unit.id,
                                    title: newSubsectionTitle.trim(),
                                    description: newSubsectionDescription.trim() || undefined,
                                  });
                                }
                              }}
                              disabled={!newSubsectionTitle.trim() || addSubsectionMutation.isPending}
                              data-testid="button-save-subsection"
                            >
                              {addSubsectionMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : null}
                              Add Topic
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <AlertDialog open={!!deleteSubsectionId} onOpenChange={(open) => {
        if (!open) {
          setDeleteSubsectionId(null);
          setDeleteSubsectionTitle("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteSubsectionTitle}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteSubsectionId) {
                  deleteSubsectionMutation.mutate(deleteSubsectionId);
                  setDeleteSubsectionId(null);
                  setDeleteSubsectionTitle("");
                }
              }}
              disabled={deleteSubsectionMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSubsectionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
