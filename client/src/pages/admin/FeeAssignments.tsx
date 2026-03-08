import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, UserPlus, Search, X, AlertCircle, Tag, Trash2, Percent } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

const assignmentFormSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feePlanId: z.string().min(1, "Fee plan is required"),
  startDate: z.string().min(1, "Start date is required"),
});

const studentDiscountFormSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  discountId: z.string().min(1, "Discount is required"),
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;
type StudentDiscountFormData = z.infer<typeof studentDiscountFormSchema>;

interface Student {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
}

interface FeePlan {
  id: string;
  name: string;
  amount: string;
  billingCycle: "weekly" | "monthly";
  isActive: boolean;
}

interface Discount {
  id: string;
  name: string;
  description: string | null;
  discountType: "percentage" | "fixed_amount";
  discountValue: string;
  isActive: boolean;
}

interface StudentDiscount {
  id: string;
  studentId: string;
  discountId: string;
  isActive: boolean;
  discount: Discount;
  student?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface StudentFeeAssignment {
  id: string;
  studentId: string;
  feePlanId: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  student: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  feePlan: {
    id: string;
    name: string;
    amount: string;
    billingCycle: string;
  };
}

export default function FeeAssignments() {
  const { toast } = useToast();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [selectedStudentForDiscount, setSelectedStudentForDiscount] = useState<StudentFeeAssignment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<StudentFeeAssignment[]>({
    queryKey: ["/api/admin/student-fee-assignments"],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/users", "students"],
    queryFn: async () => {
      const response = await fetch("/api/users?role=student");
      if (!response.ok) throw new Error("Failed to fetch students");
      return response.json();
    },
  });

  const { data: feePlans } = useQuery<FeePlan[]>({
    queryKey: ["/api/admin/fee-plans"],
  });

  const { data: discounts } = useQuery<Discount[]>({
    queryKey: ["/api/admin/discounts"],
  });

  const { data: studentDiscounts } = useQuery<StudentDiscount[]>({
    queryKey: ["/api/admin/student-discounts"],
  });

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      studentId: "",
      feePlanId: "",
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  const discountForm = useForm<StudentDiscountFormData>({
    resolver: zodResolver(studentDiscountFormSchema),
    defaultValues: {
      studentId: "",
      discountId: "",
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const response = await fetch("/api/admin/student-fee-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-fee-assignments"] });
      setIsAssignDialogOpen(false);
      form.reset();
      toast({
        title: "Fee Plan Assigned",
        description: "The fee plan has been assigned to the student successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign fee plan",
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await fetch(`/api/admin/student-fee-assignments/${assignmentId}/deactivate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-fee-assignments"] });
      toast({
        title: "Assignment Deactivated",
        description: "The fee plan assignment has been deactivated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate assignment",
        variant: "destructive",
      });
    },
  });

  const assignDiscountMutation = useMutation({
    mutationFn: async (data: StudentDiscountFormData) => {
      const response = await fetch("/api/admin/student-discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-discounts"] });
      setIsDiscountDialogOpen(false);
      setSelectedStudentForDiscount(null);
      discountForm.reset();
      toast({
        title: "Discount Assigned",
        description: "The discount has been assigned to the student successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign discount",
        variant: "destructive",
      });
    },
  });

  const removeDiscountMutation = useMutation({
    mutationFn: async (studentDiscountId: string) => {
      const response = await fetch(`/api/admin/student-discounts/${studentDiscountId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-discounts"] });
      toast({
        title: "Discount Removed",
        description: "The discount has been removed from the student.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove discount",
        variant: "destructive",
      });
    },
  });

  const handleAssign = (data: AssignmentFormData) => {
    assignMutation.mutate(data);
  };

  const handleAssignDiscount = (data: StudentDiscountFormData) => {
    assignDiscountMutation.mutate(data);
  };

  const handleOpenDiscountDialog = (assignment: StudentFeeAssignment) => {
    setSelectedStudentForDiscount(assignment);
    discountForm.reset({
      studentId: assignment.studentId,
      discountId: "",
    });
    setIsDiscountDialogOpen(true);
  };

  const getStudentDiscounts = (studentId: string) => {
    return studentDiscounts?.filter(sd => sd.studentId === studentId && sd.isActive && sd.discount) || [];
  };

  const activeFeePlans = feePlans?.filter((p) => p.isActive) || [];
  const activeDiscounts = discounts?.filter((d) => d.isActive) || [];
  
  const filteredAssignments = assignments?.filter((assignment) => {
    if (!searchQuery) return true;
    const studentName = `${assignment.student.firstName || ''} ${assignment.student.lastName || ''}`.toLowerCase();
    const email = assignment.student.email.toLowerCase();
    const planName = assignment.feePlan.name.toLowerCase();
    const query = searchQuery.toLowerCase();
    return studentName.includes(query) || email.includes(query) || planName.includes(query);
  });

  const activeAssignments = assignments?.filter((a) => a.isActive).length || 0;
  const totalMonthlyRevenue = assignments
    ?.filter((a) => a.isActive && a.feePlan.billingCycle === "monthly")
    .reduce((sum, a) => sum + parseFloat(a.feePlan.amount), 0) || 0;
  const studentsWithDiscounts = new Set(studentDiscounts?.filter(sd => sd.isActive).map(sd => sd.studentId)).size;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Fee Assignments</h1>
          <p className="text-muted-foreground mt-1">Assign fee plans and discounts to students for automatic billing</p>
        </div>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-assign-fee-plan">
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Fee Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Fee Plan to Student</DialogTitle>
              <DialogDescription>
                Select a student and fee plan to begin automated billing
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAssign)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-student">
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students?.map((student) => (
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
                <FormField
                  control={form.control}
                  name="feePlanId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Plan</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-fee-plan">
                            <SelectValue placeholder="Select a fee plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeFeePlans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} - ${plan.amount}/{plan.billingCycle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input data-testid="input-start-date" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAssignDialogOpen(false)}
                    data-testid="button-cancel-assign"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={assignMutation.isPending} data-testid="button-submit-assign">
                    {assignMutation.isPending ? "Assigning..." : "Assign"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-assignments">{assignments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{activeAssignments} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-assignments">{activeAssignments}</div>
            <p className="text-xs text-muted-foreground">Currently generating invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue (Est.)</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-monthly-revenue">${totalMonthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From active monthly plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students with Discounts</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsWithDiscounts}</div>
            <p className="text-xs text-muted-foreground">Have active discounts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>All Assignments</CardTitle>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search-assignments"
                placeholder="Search by student name, email, or plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              ))}
            </div>
          ) : filteredAssignments && filteredAssignments.length > 0 ? (
            <div className="space-y-3">
              {filteredAssignments.map((assignment) => {
                const studentActiveDiscounts = getStudentDiscounts(assignment.studentId);
                return (
                  <div
                    key={assignment.id}
                    data-testid={`card-assignment-${assignment.id}`}
                    className="p-4 border rounded-lg hover-elevate"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={assignment.student.avatarUrl || undefined} />
                        <AvatarFallback>
                          {assignment.student.firstName?.[0]}{assignment.student.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold" data-testid={`text-student-name-${assignment.id}`}>
                          {assignment.student.firstName} {assignment.student.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">{assignment.student.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold" data-testid={`text-plan-name-${assignment.id}`}>
                          {assignment.feePlan.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${assignment.feePlan.amount}/{assignment.feePlan.billingCycle}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">Start Date:</div>
                        <div>{format(new Date(assignment.startDate), "MMM dd, yyyy")}</div>
                      </div>
                      <div>
                        <Badge variant={assignment.isActive ? "default" : "secondary"} data-testid={`badge-status-${assignment.id}`}>
                          {assignment.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDiscountDialog(assignment)}
                          data-testid={`button-add-discount-${assignment.id}`}
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          Add Discount
                        </Button>
                        {assignment.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateMutation.mutate(assignment.id)}
                            disabled={deactivateMutation.isPending}
                            data-testid={`button-deactivate-${assignment.id}`}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                    {studentActiveDiscounts.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Applied Discounts:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {studentActiveDiscounts.map((sd) => sd.discount && (
                            <Badge 
                              key={sd.id} 
                              variant="outline" 
                              className="flex items-center gap-1 pr-1"
                            >
                              <span>
                                {sd.discount.name}: {sd.discount.discountType === "percentage" 
                                  ? `${sd.discount.discountValue}%` 
                                  : `$${sd.discount.discountValue}`}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1"
                                onClick={() => removeDiscountMutation.mutate(sd.id)}
                                disabled={removeDiscountMutation.isPending}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No Matches Found" : "No Assignments Yet"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery
                  ? "Try a different search term"
                  : "Assign fee plans to students to start automated billing"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsAssignDialogOpen(true)} data-testid="button-create-first-assignment">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Fee Plan
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDiscountDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDiscountDialogOpen(false);
          setSelectedStudentForDiscount(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Discount to Student</DialogTitle>
            <DialogDescription>
              {selectedStudentForDiscount && (
                <>Assign a discount to {selectedStudentForDiscount.student.firstName} {selectedStudentForDiscount.student.lastName}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...discountForm}>
            <form onSubmit={discountForm.handleSubmit(handleAssignDiscount)} className="space-y-4">
              <FormField
                control={discountForm.control}
                name="discountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a discount" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeDiscounts.map((discount) => (
                          <SelectItem key={discount.id} value={discount.id}>
                            {discount.name} - {discount.discountType === "percentage" 
                              ? `${discount.discountValue}%` 
                              : `$${discount.discountValue}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {activeDiscounts.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No active discounts available. Create discounts in the Fee Plans &gt; Discounts tab first.
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDiscountDialogOpen(false);
                    setSelectedStudentForDiscount(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={assignDiscountMutation.isPending || activeDiscounts.length === 0}
                >
                  {assignDiscountMutation.isPending ? "Assigning..." : "Assign Discount"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
