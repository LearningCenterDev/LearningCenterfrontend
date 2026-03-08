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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Course, User } from "@shared/schema";

const enrollmentSchema = z.object({
  notes: z.string().optional(),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

interface EnrollmentRequestModalProps {
  course: Course;
  student: User;
  children: React.ReactNode;
}

export function EnrollmentRequestModal({ course, student, children }: EnrollmentRequestModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      notes: "",
    },
  });

  // Check if student is already enrolled
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["/api/students", student.id, "enrollments"],
    queryFn: async () => {
      const response = await fetch(`/api/students/${student.id}/enrollments`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open,
  });

  const isAlreadyEnrolled = enrollments.some(
    (enrollment: any) => enrollment.courseId === course.id
  );

  // Create enrollment mutation
  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: EnrollmentFormData) => {
      return apiRequest("POST", `/api/enrollments`, {
        studentId: student.id,
        courseId: course.id,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Enrolled Successfully",
        description: "You have been enrolled in this course. An administrator will assign a teacher soon.",
      });
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/students", student.id, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Enrollment Failed",
        description: error?.message || "Failed to enroll in course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EnrollmentFormData) => {
    createEnrollmentMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" data-testid="enrollment-request-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Enroll in Course
          </DialogTitle>
          <DialogDescription>
            Enroll in <strong>{course.title}</strong>. You will be immediately enrolled and an administrator will assign a teacher.
          </DialogDescription>
        </DialogHeader>

        {enrollmentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Checking enrollment status...</span>
          </div>
        ) : isAlreadyEnrolled ? (
          <div className="p-6 text-center border rounded-md bg-muted/50">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
            <h3 className="font-medium mb-2">Already Enrolled</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You are already enrolled in this course.
            </p>
            <Button onClick={() => setOpen(false)} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="enrollment-request-form">
              <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Instant Enrollment
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      By clicking enroll, you will be immediately enrolled in this course. An administrator will assign a teacher to you shortly.
                    </p>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about your learning goals or preferences..."
                        className="resize-none"
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormDescription>
                      Share any information that might help the administrator assign the right teacher.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createEnrollmentMutation.isPending}
                  data-testid="button-submit-request"
                >
                  {createEnrollmentMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Enroll Now
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}