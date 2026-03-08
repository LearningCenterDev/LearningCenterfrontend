import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Users, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Course, User, ParentChild } from "@shared/schema";

const activationRequestSchema = z.object({
  childId: z.string().min(1, "Please select a student"),
  parentId: z.string().min(1, "Please select a parent/guardian"),
  notes: z.string().optional(),
});

type ActivationRequestFormData = z.infer<typeof activationRequestSchema>;

interface CourseActivationModalProps {
  course: Course;
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function CourseActivationModal({ course, children, onSuccess }: CourseActivationModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ActivationRequestFormData>({
    resolver: zodResolver(activationRequestSchema),
    defaultValues: {
      childId: "",
      parentId: "",
      notes: "",
    },
  });

  // Get all students for the teacher to choose from
  const { data: students = [], isLoading: studentsLoading } = useQuery<User[]>({
    queryKey: ["/api/users", { role: "student" }],
    queryFn: async () => {
      const response = await fetch("/api/users?role=student");
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      return response.json();
    },
    enabled: open,
  });

  // Get parent-child relationships to find parents for selected student
  const selectedChildId = form.watch("childId");
  const { data: parentRelations = [], isLoading: parentRelationsLoading } = useQuery<ParentChild[]>({
    queryKey: ["/api/parent-children", "child", selectedChildId],
    queryFn: async () => {
      const response = await fetch(`/api/parent-children?childId=${selectedChildId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch parent relationships");
      }
      return response.json();
    },
    enabled: !!selectedChildId && open,
  });

  // Get parent details for the selected student
  const { data: parents = [], isLoading: parentsLoading } = useQuery<User[]>({
    queryKey: ["/api/users", "parents", parentRelations.map(p => p.parentId)],
    queryFn: async () => {
      if (parentRelations.length === 0) return [];
      
      const parentPromises = parentRelations.map(async (relation) => {
        const response = await fetch(`/api/users/${relation.parentId}`);
        if (!response.ok) return null;
        return response.json();
      });
      
      const parentResults = await Promise.all(parentPromises);
      return parentResults.filter(Boolean);
    },
    enabled: parentRelations.length > 0,
  });

  // Check if there's already an activation request for this course
  const { data: existingRequest, isLoading: requestLoading } = useQuery({
    queryKey: ["/api/courses", course.id, "activation-request"],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${course.id}/activation-request`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch activation request");
      }
      return response.json();
    },
    enabled: open,
    retry: (failureCount, error: any) => {
      return !error?.message?.includes('404') && failureCount < 3;
    },
  });

  // Submit course for activation mutation
  const submitForActivationMutation = useMutation({
    mutationFn: async (data: ActivationRequestFormData) => {
      const response = await fetch(`/api/courses/${course.id}/submit-for-activation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          childId: data.childId,
          parentId: data.parentId,
          notes: data.notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to submit course for activation" }));
        throw new Error(error.message || "Failed to submit course for activation");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Course Submitted for Activation",
        description: "Your course has been submitted for parent and admin approval.",
      });
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/course-activation-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to submit course for activation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ActivationRequestFormData) => {
    if (parents.length === 0) {
      toast({
        title: "No Parent Found",
        description: "The selected student does not have a registered parent/guardian. Please select a different student.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.parentId) {
      toast({
        title: "Parent Required",
        description: "Please select a parent/guardian to authorize this course activation.",
        variant: "destructive",
      });
      return;
    }
    
    submitForActivationMutation.mutate(data);
  };

  const handleClose = () => {
    setOpen(false);
    form.reset({
      childId: "",
      parentId: "",
      notes: "",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary" data-testid="status-draft"><FileText className="w-3 h-3 mr-1" />Draft</Badge>;
      case "pending_parent":
        return <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300" data-testid="status-pending-parent">Pending Parent</Badge>;
      case "parent_authorized":
        return <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300" data-testid="status-parent-authorized">Parent Authorized</Badge>;
      case "pending_admin":
        return <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300" data-testid="status-pending-admin">Pending Admin</Badge>;
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" data-testid="status-active">Active</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid="status-rejected">Rejected</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`status-${status}`}>{status}</Badge>;
    }
  };

  const isLoading = studentsLoading || parentRelationsLoading || parentsLoading || requestLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" data-testid="course-activation-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Submit Course for Activation
          </DialogTitle>
          <DialogDescription>
            Submit "{course.title}" for the parent and admin approval process to make it active for student enrollment.
          </DialogDescription>
        </DialogHeader>

        {/* Show existing request status if any */}
        {existingRequest && (
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Current Activation Request</h4>
              {getStatusBadge(existingRequest.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              Submitted on {new Date(existingRequest.submittedAt).toLocaleDateString()}
            </p>
            {existingRequest.rejectionReason && (
              <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
                <p className="text-sm text-destructive font-medium">Rejection Reason:</p>
                <p className="text-sm text-destructive">{existingRequest.rejectionReason}</p>
              </div>
            )}
          </div>
        )}

        {existingRequest && existingRequest.status !== "rejected" ? (
          <div className="text-center p-6">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              This course already has an activation request in progress.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="childId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Student</FormLabel>
                    <FormDescription>
                      Choose a student whose parent will need to authorize this course activation.
                    </FormDescription>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-student">
                          <SelectValue placeholder="Select a student..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.firstName} {student.lastName} ({student.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Parent selection for selected student */}
              {selectedChildId && (
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Parent/Guardian</FormLabel>
                      <FormDescription>
                        Choose which parent/guardian should authorize this course activation.
                      </FormDescription>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                        }} 
                        value={field.value}
                        disabled={isLoading || parents.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-parent">
                            <SelectValue placeholder={parents.length === 0 ? "No parents found" : "Select a parent/guardian..."} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {parents.map((parent) => (
                            <SelectItem key={parent.id} value={parent.id}>
                              {parent.firstName} {parent.lastName} ({parent.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedChildId && parents.length === 0 && !parentsLoading && (
                <div className="p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                  <p className="text-sm text-destructive">
                    No parent/guardian found for this student. Please select a different student.
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormDescription>
                      Add any additional information about this course activation request.
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes for the parent and admin..."
                        {...field}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={submitForActivationMutation.isPending}
                  data-testid="button-cancel-activation"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitForActivationMutation.isPending || isLoading || parents.length === 0 || !form.watch("parentId")}
                  className="flex-1"
                  data-testid="button-submit-activation"
                >
                  {submitForActivationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit for Activation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}