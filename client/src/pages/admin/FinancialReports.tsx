import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Receipt, Download, Calendar, CreditCard, FileText, UserPlus, Wallet, Search, X, Plus, AlertCircle, BarChart3, TrendingDown, PieChart, Loader2, List, LayoutGrid, Table, ArrowUpDown, ArrowUp, ArrowDown, Clock, CheckCircle, MoreVertical, Trash2, Tag, Percent, Pencil, MapPin, Archive, Copy } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface FinancialReportsProps {
  adminId: string;
}

interface FinancialData {
  totalRevenue: number;
  monthlyRevenue: number;
  outstandingPayments: number;
  paidPayments: number;
  revenueByCategory: {
    tuition: number;
    fees: number;
    other: number;
  };
  recentTransactions: {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: Date;
    category: string;
    status: 'completed' | 'pending' | 'failed';
  }[];
}

interface FeePlan {
  id: string;
  name: string;
  description: string | null;
  ratePerClass: string;
  billingCycle: "weekly" | "monthly";
  isActive: boolean;
  deletedAt?: string | null;
  createdAt?: string;
}

interface FeeAssignment {
  id: string;
  studentId: string;
  feePlanId: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
  student: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
    state: string | null;
  };
  feePlan: {
    id: string;
    name: string;
    ratePerClass: string;
    adjustedRatePerClass?: string;
    billingCycle: string;
  };
  stateAdjustment?: {
    id: string;
    stateCode: string;
    stateName: string;
    adjustmentType: "percentage" | "fixed_amount";
    adjustmentValue: string;
    isActive: boolean;
  } | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  parentId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  subtotal: string;
  tax: string;
  total: string;
  status: "pending" | "paid" | "overdue" | "partial";
  dueDate: string;
  notes: string | null;
  createdAt: string;
  isCopy: boolean;
  originalInvoiceId: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  deletionReason: string | null;
  student: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  parent: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  feePlan: {
    name: string;
    billingCycle: string;
  };
}

interface Payment {
  id: string;
  invoiceId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string | null;
  transactionId: string | null;
  notes: string | null;
  status: "pending" | "completed" | "failed" | "refunded";
  createdAt: string;
  invoice: {
    invoiceNumber: string;
    student: {
      firstName: string | null;
      lastName: string | null;
    };
    parent: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
    feePlan: {
      name: string;
    };
  };
}

interface Student {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  parentId?: string | null;
  hasParentLink?: boolean;
}

interface Discount {
  id: string;
  name: string;
  description: string | null;
  type: "percentage" | "fixed_amount";
  value: string;
  isActive: boolean;
  createdAt: string;
}

interface StudentDiscount {
  id: string;
  studentId: string;
  discountId: string;
  isActive: boolean;
  createdAt: string;
  discount: Discount;
}

interface StateFeeStructure {
  id: string;
  feePlanId: string;
  stateCode: string;
  stateName: string;
  adjustmentType: "percentage" | "fixed_amount";
  adjustmentValue: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  feePlan?: {
    id: string;
    name: string;
    amount: string;
  };
}

// Form schemas
const stateAdjustmentSchema = z.object({
  id: z.string().optional(),
  stateCode: z.string().min(1, "State code is required").max(10, "State code must be 10 characters or less"),
  stateName: z.string().min(1, "State name is required"),
  adjustmentType: z.enum(["percentage", "fixed_amount"]),
  adjustmentValue: z.string().min(1, "Value is required").refine((val) => !isNaN(parseFloat(val)), {
    message: "Value must be a number",
  }),
  description: z.string().optional(),
});

type StateAdjustmentData = z.infer<typeof stateAdjustmentSchema>;

const feePlanFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  ratePerClass: z.string().min(1, "Rate per class is required"),
  billingCycle: z.enum(["weekly", "monthly"]),
  isActive: z.boolean().default(true),
  stateAdjustments: z.array(stateAdjustmentSchema).default([]),
});

type FeePlanFormData = z.infer<typeof feePlanFormSchema>;

const assignmentFormSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feePlanId: z.string().min(1, "Fee plan is required"),
  startDate: z.string().min(1, "Start date is required"),
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

const paymentFormSchema = z.object({
  amount: z.string().min(1, "Amount is required").transform(val => parseFloat(val)).refine(val => val > 0, "Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "check", "bank_transfer", "online", "other"], {
    errorMap: () => ({ message: "Payment method is required" })
  }),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

const discountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z.string().min(1, "Discount value is required"),
  isActive: z.boolean().default(true),
});

type DiscountFormData = z.infer<typeof discountFormSchema>;

const assignDiscountFormSchema = z.object({
  discountId: z.string().min(1, "Discount is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

type AssignDiscountFormData = z.infer<typeof assignDiscountFormSchema>;

const stateFeeFormSchema = z.object({
  feePlanId: z.string().min(1, "Fee plan is required"),
  stateCode: z.string().min(1, "State code is required").max(10, "State code must be 10 characters or less"),
  stateName: z.string().min(1, "State name is required"),
  adjustmentType: z.enum(["percentage", "fixed_amount"]),
  adjustmentValue: z.string().min(1, "Adjustment value is required"),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

type StateFeeFormData = z.infer<typeof stateFeeFormSchema>;

function OverviewTab({ adminId }: { adminId: string }) {
  const { data: financialData, isLoading } = useQuery<FinancialData>({
    queryKey: ["/api/admin/financial-reports"],
  });

  const { data: feePlans } = useQuery<FeePlan[]>({
    queryKey: ["/api/admin/fee-plans"],
  });

  const { data: feeAssignments } = useQuery<FeeAssignment[]>({
    queryKey: ["/api/admin/student-fee-assignments"],
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/admin/invoices"],
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const {
    totalRevenue = 0,
    monthlyRevenue = 0,
    outstandingPayments = 0,
    paidPayments = 0,
    revenueByCategory = {
      tuition: 0,
      fees: 0,
      other: 0
    },
    recentTransactions = []
  } = financialData || {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-8">
      {/* Fee Management Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Fee Management Overview</h2>
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Active Fee Plans</span>
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-primary" data-testid="active-fee-plans">
                {feePlans?.filter(fp => fp.isActive).length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {feePlans?.length || 0} total plans
              </p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Fee Assignments</span>
                <div className="p-2 rounded-lg bg-secondary/10">
                  <UserPlus className="w-4 h-4 text-secondary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-secondary" data-testid="total-assignments">
                {feeAssignments?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Students assigned</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Total Invoices</span>
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-primary" data-testid="total-invoices">
                {invoices?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${invoices?.reduce((sum, inv) => sum + parseFloat(inv.total), 0).toFixed(2) || "0.00"} total value
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Total Payments</span>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-primary" data-testid="total-payments">
                {payments?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2) || "0.00"} collected
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-primary" data-testid="total-revenue">
                ${totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This academic year</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Monthly Revenue</span>
                <div className="p-2 rounded-lg bg-secondary/10">
                  <TrendingUp className="w-4 h-4 text-secondary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-secondary" data-testid="monthly-revenue">
                ${monthlyRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Current month</p>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Outstanding</span>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Receipt className="w-4 h-4 text-destructive" />
                </div>
              </div>
              <div className="text-3xl font-bold text-destructive" data-testid="outstanding-payments">
                ${outstandingPayments.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pending payments</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Collected</span>
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-primary" data-testid="paid-payments">
                ${paidPayments.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Revenue by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(revenueByCategory).map(([category, amount]) => (
              <div 
                key={category}
                className="p-4 border rounded-lg text-center transition-colors hover:bg-accent/50 cursor-pointer"
                data-testid={`revenue-${category}`}
              >
                <div className="text-xl font-bold text-primary">${amount.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground capitalize mt-1">{category}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {totalRevenue > 0 ? ((amount / totalRevenue) * 100).toFixed(1) : 0}% of total
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
              <p className="text-muted-foreground">
                Financial transactions will appear here once payments are processed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.slice(0, 10).map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg transition-colors hover:bg-accent/50 cursor-pointer"
                  data-testid={`transaction-${transaction.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-md ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{transaction.description}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{transaction.category}</span>
                        <span>•</span>
                        <span>{transaction.date ? format(new Date(transaction.date), 'MMM d, yyyy') : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(transaction.status)} className="text-xs">
                      {transaction.status}
                    </Badge>
                    <div className="text-right">
                      <div className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {recentTransactions.length > 10 && (
                <div className="text-center">
                  <Button variant="ghost" size="sm">
                    View All Transactions ({recentTransactions.length - 10} more)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Calendar className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Monthly Report</div>
                <div className="text-xs text-muted-foreground">Generate monthly summary</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Annual Report</div>
                <div className="text-xs text-muted-foreground">Year-end financial report</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Receipt className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Tax Report</div>
                <div className="text-xs text-muted-foreground">Tax documentation</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FeePlansTab() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FeePlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<FeePlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<FeePlan | null>(null);
  const { toast } = useToast();

  const { data: feePlans, isLoading } = useQuery<FeePlan[]>({
    queryKey: ["/api/admin/fee-plans"],
    enabled: true,
  });

  const { data: stateAdjustments } = useQuery<StateFeeStructure[]>({
    queryKey: ["/api/admin/state-fee-structures", viewingPlan?.id],
    queryFn: async () => {
      if (!viewingPlan) return [];
      const res = await fetch(`/api/admin/state-fee-structures?feePlanId=${viewingPlan.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!viewingPlan,
  });
  
  const { data: editingPlanAdjustments } = useQuery<StateFeeStructure[]>({
    queryKey: ["/api/admin/state-fee-structures", editingPlan?.id],
    queryFn: async () => {
      if (!editingPlan) return [];
      const res = await fetch(`/api/admin/state-fee-structures?feePlanId=${editingPlan.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!editingPlan,
  });

  const createForm = useForm<FeePlanFormData>({
    resolver: zodResolver(feePlanFormSchema),
    defaultValues: {
      name: "",
      description: "",
      ratePerClass: "",
      billingCycle: "monthly",
      isActive: true,
      stateAdjustments: [],
    },
  });

  const [newStateAdjustment, setNewStateAdjustment] = useState<Partial<StateAdjustmentData>>({
    stateCode: "",
    stateName: "",
    adjustmentType: "percentage",
    adjustmentValue: "",
    description: "",
  });

  const addStateAdjustment = () => {
    if (newStateAdjustment.stateCode && newStateAdjustment.stateName && newStateAdjustment.adjustmentValue) {
      const current = createForm.getValues("stateAdjustments") || [];
      createForm.setValue("stateAdjustments", [
        ...current,
        {
          id: crypto.randomUUID(),
          stateCode: newStateAdjustment.stateCode!,
          stateName: newStateAdjustment.stateName!,
          adjustmentType: newStateAdjustment.adjustmentType || "percentage",
          adjustmentValue: newStateAdjustment.adjustmentValue!,
          description: newStateAdjustment.description || "",
        },
      ]);
      setNewStateAdjustment({
        stateCode: "",
        stateName: "",
        adjustmentType: "percentage",
        adjustmentValue: "",
        description: "",
      });
    }
  };

  const removeStateAdjustment = (index: number) => {
    const current = createForm.getValues("stateAdjustments") || [];
    createForm.setValue("stateAdjustments", current.filter((_, i) => i !== index));
  };

  const editForm = useForm<FeePlanFormData>({
    resolver: zodResolver(feePlanFormSchema),
    defaultValues: {
      stateAdjustments: [],
    },
  });

  const [editStateAdjustment, setEditStateAdjustment] = useState<Partial<StateAdjustmentData>>({
    stateCode: "",
    stateName: "",
    adjustmentType: "percentage",
    adjustmentValue: "",
    description: "",
  });

  const [editTab, setEditTab] = useState("basic-info");

  const addEditStateAdjustment = () => {
    if (editStateAdjustment.stateCode && editStateAdjustment.stateName && editStateAdjustment.adjustmentValue) {
      const current = editForm.getValues("stateAdjustments") || [];
      editForm.setValue("stateAdjustments", [
        ...current,
        {
          id: crypto.randomUUID(),
          stateCode: editStateAdjustment.stateCode!,
          stateName: editStateAdjustment.stateName!,
          adjustmentType: editStateAdjustment.adjustmentType || "percentage",
          adjustmentValue: editStateAdjustment.adjustmentValue!,
          description: editStateAdjustment.description || "",
        },
      ]);
      setEditStateAdjustment({
        stateCode: "",
        stateName: "",
        adjustmentType: "percentage",
        adjustmentValue: "",
        description: "",
      });
    }
  };

  const removeEditStateAdjustment = (index: number) => {
    const current = editForm.getValues("stateAdjustments") || [];
    editForm.setValue("stateAdjustments", current.filter((_, i) => i !== index));
  };

  
  const createMutation = useMutation({
    mutationFn: async (data: FeePlanFormData) => {
      const payload = {
        ...data,
        ratePerClass: data.ratePerClass,
      };
      const response = await fetch("/api/admin/fee-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fee-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/state-fee-structures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-fee-assignments"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      setNewStateAdjustment({
        stateCode: "",
        stateName: "",
        adjustmentType: "percentage",
        adjustmentValue: "",
        description: "",
      });
      toast({
        title: "Fee Plan Created",
        description: "The fee plan has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create fee plan",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FeePlanFormData> }) => {
      const payload = {
        ...data,
        ratePerClass: data.ratePerClass,
      };
      const response = await fetch(`/api/admin/fee-plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fee-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/state-fee-structures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-fee-assignments"] });
      setEditingPlan(null);
      editForm.reset();
      toast({
        title: "Fee Plan Updated",
        description: "The fee plan has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update fee plan",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/fee-plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fee-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-fee-assignments"] });
      toast({
        title: "Fee Plan Updated",
        description: "The fee plan status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update fee plan status",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/fee-plans/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fee-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/state-fee-structures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-fee-assignments"] });
      setDeletingPlan(null);
      toast({
        title: "Fee Plan Deleted",
        description: "The fee plan and its state adjustments have been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete fee plan",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: FeePlanFormData) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: FeePlanFormData) => {
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data });
    }
  };

  const handleEditClick = (plan: FeePlan) => {
    setEditingPlan(plan);
    setEditTab("basic-info");
    // Reset form with basic info first, state adjustments will be loaded via useEffect
    editForm.reset({
      name: plan.name,
      description: plan.description || "",
      ratePerClass: plan.ratePerClass || "",
      billingCycle: plan.billingCycle,
      isActive: plan.isActive,
      stateAdjustments: [],
    });
    setEditStateAdjustment({
      stateCode: "",
      stateName: "",
      adjustmentType: "percentage",
      adjustmentValue: "",
      description: "",
    });
  };
  
  // Load state adjustments when editing plan data is fetched
  useEffect(() => {
    if (editingPlan && editingPlanAdjustments && editingPlanAdjustments.length > 0) {
      editForm.setValue("stateAdjustments", editingPlanAdjustments.map(adj => ({
        id: adj.id,
        stateCode: adj.stateCode,
        stateName: adj.stateName,
        adjustmentType: adj.adjustmentType as "percentage" | "fixed_amount",
        adjustmentValue: adj.adjustmentValue,
        description: adj.notes || "",
      })));
    }
  }, [editingPlan, editingPlanAdjustments]);

  const activePlansCount = feePlans?.filter((p) => p.isActive).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Fee Plans</h2>
          <p className="text-muted-foreground mt-1">Create and manage billing plans</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-fee-plan">
              <Plus className="w-4 h-4 mr-2" />
              Create Fee Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Fee Plan</DialogTitle>
              <DialogDescription>
                Create a new fee plan for student billing with optional state-specific adjustments
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                <Tabs defaultValue="basic-info" className="w-full">
                  <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20 w-full">
                    <TabsTrigger 
                      value="basic-info" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2 flex-1"
                    >
                      <DollarSign className="w-4 h-4" />
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger 
                      value="state-adjustments" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2 flex-1"
                    >
                      <MapPin className="w-4 h-4" />
                      State Adjustments
                      {(createForm.watch("stateAdjustments")?.length || 0) > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                          {createForm.watch("stateAdjustments")?.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic-info" className="space-y-4 mt-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Standard Tuition" data-testid="input-plan-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe what this plan includes" data-testid="input-plan-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="ratePerClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate per Class ($)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-rate-per-class" />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Final invoice amount will be calculated from scheduled classes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="billingCycle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Cycle</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-billing-cycle">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="state-adjustments" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Add state-specific fee adjustments for this plan
                      </p>
                    </div>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Add State Adjustment</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium">State Code</label>
                            <Input
                              placeholder="e.g., CA"
                              value={newStateAdjustment.stateCode || ""}
                              onChange={(e) => setNewStateAdjustment({ ...newStateAdjustment, stateCode: e.target.value.toUpperCase() })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">State Name</label>
                            <Input
                              placeholder="e.g., California"
                              value={newStateAdjustment.stateName || ""}
                              onChange={(e) => setNewStateAdjustment({ ...newStateAdjustment, stateName: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium">Adjustment Type</label>
                            <Select
                              value={newStateAdjustment.adjustmentType || "percentage"}
                              onValueChange={(value: "percentage" | "fixed_amount") => setNewStateAdjustment({ ...newStateAdjustment, adjustmentType: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-medium">Value</label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={newStateAdjustment.adjustmentValue || ""}
                              onChange={(e) => setNewStateAdjustment({ ...newStateAdjustment, adjustmentValue: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium">Description (Optional)</label>
                          <Input
                            placeholder="e.g., State tax adjustment"
                            value={newStateAdjustment.description || ""}
                            onChange={(e) => setNewStateAdjustment({ ...newStateAdjustment, description: e.target.value })}
                          />
                        </div>
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={addStateAdjustment}
                          disabled={!newStateAdjustment.stateCode || !newStateAdjustment.stateName || !newStateAdjustment.adjustmentValue}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Adjustment
                        </Button>
                      </CardContent>
                    </Card>
                    
                    {(createForm.watch("stateAdjustments")?.length || 0) > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Current State Adjustments</h4>
                        {createForm.watch("stateAdjustments")?.map((adj, index) => (
                          <div key={adj.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{adj.stateCode}</Badge>
                              <div>
                                <p className="text-sm font-medium">{adj.stateName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {adj.adjustmentType === "percentage" ? `${adj.adjustmentValue}%` : `$${adj.adjustmentValue}`}
                                  {adj.description && ` - ${adj.description}`}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeStateAdjustment(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create">
                    {createMutation.isPending ? "Creating..." : "Create Plan"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fee Plans</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-plans">{feePlans?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{activePlansCount} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="text-active-plans">{activePlansCount}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
              </div>

      <Card>
        <CardHeader>
          <CardTitle>All Fee Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : feePlans && feePlans.length > 0 ? (
            <div className="space-y-2">
              {feePlans.map((plan) => (
                <Card
                  key={plan.id}
                  data-testid={`card-fee-plan-${plan.id}`}
                  className="hover-elevate overflow-visible group relative cursor-pointer"
                  onClick={() => setViewingPlan(plan)}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-l-lg" />
                  <CardContent className="p-3 pl-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full shrink-0">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm" data-testid={`text-plan-name-${plan.id}`}>{plan.name}</span>
                          {plan.deletedAt ? (
                            <Badge variant="destructive" className="text-xs" data-testid={`badge-status-${plan.id}`}>
                              Deleted
                            </Badge>
                          ) : (
                            <Badge variant={plan.isActive ? "default" : "secondary"} className="text-xs" data-testid={`badge-status-${plan.id}`}>
                              {plan.isActive ? "Active" : "Inactive"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="font-medium">${plan.ratePerClass}/class ({plan.billingCycle})</span>
                          {plan.description && <span className="truncate">{plan.description}</span>}
                        </div>
                      </div>
                      {!plan.deletedAt && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" 
                              data-testid={`button-actions-${plan.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem 
                              onSelect={(e) => { e.preventDefault(); handleEditClick(plan); }} 
                              data-testid={`button-edit-${plan.id}`}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={(e) => { e.preventDefault(); toggleActiveMutation.mutate({ id: plan.id, isActive: !plan.isActive }); }}
                              disabled={toggleActiveMutation.isPending}
                              data-testid={`button-toggle-${plan.id}`}
                            >
                              {plan.isActive ? <><X className="w-4 h-4 mr-2" />Deactivate</> : <><CheckCircle className="w-4 h-4 mr-2" />Activate</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={(e) => { e.preventDefault(); setDeletingPlan(plan); }}
                              className="text-destructive focus:text-destructive"
                              data-testid={`button-delete-${plan.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {/* Edit Dialog - moved outside the loop */}
              <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Fee Plan</DialogTitle>
                    <DialogDescription>
                      Update the fee plan details and state adjustments
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
                      <Tabs value={editTab} onValueChange={setEditTab} className="w-full">
                        <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20 w-full">
                          <TabsTrigger 
                            value="basic-info" 
                            className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2 flex-1"
                          >
                            <DollarSign className="w-4 h-4" />
                            Basic Info
                          </TabsTrigger>
                          <TabsTrigger 
                            value="state-adjustments" 
                            className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2 flex-1"
                          >
                            <MapPin className="w-4 h-4" />
                            State Adjustments
                            {(editForm.watch("stateAdjustments")?.length || 0) > 0 && (
                              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                {editForm.watch("stateAdjustments")?.length}
                              </Badge>
                            )}
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic-info" className="space-y-4 mt-4">
                          <FormField
                            control={editForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Plan Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-edit-plan-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea {...field} data-testid="input-edit-plan-description" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="ratePerClass"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rate per Class ($)</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-edit-rate-per-class" />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  Final invoice amount will be calculated from scheduled classes
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="billingCycle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Billing Cycle</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-edit-billing-cycle">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>

                        <TabsContent value="state-adjustments" className="space-y-4 mt-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Manage state-specific fee adjustments for this plan
                            </p>
                          </div>
                          
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">Add State Adjustment</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-medium">State Code</label>
                                  <Input
                                    placeholder="e.g., CA"
                                    value={editStateAdjustment.stateCode || ""}
                                    onChange={(e) => setEditStateAdjustment({ ...editStateAdjustment, stateCode: e.target.value.toUpperCase() })}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">State Name</label>
                                  <Input
                                    placeholder="e.g., California"
                                    value={editStateAdjustment.stateName || ""}
                                    onChange={(e) => setEditStateAdjustment({ ...editStateAdjustment, stateName: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-medium">Adjustment Type</label>
                                  <Select
                                    value={editStateAdjustment.adjustmentType || "percentage"}
                                    onValueChange={(value: "percentage" | "fixed_amount") => setEditStateAdjustment({ ...editStateAdjustment, adjustmentType: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                                      <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-xs font-medium">Value</label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={editStateAdjustment.adjustmentValue || ""}
                                    onChange={(e) => setEditStateAdjustment({ ...editStateAdjustment, adjustmentValue: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-medium">Description (Optional)</label>
                                <Input
                                  placeholder="e.g., State tax adjustment"
                                  value={editStateAdjustment.description || ""}
                                  onChange={(e) => setEditStateAdjustment({ ...editStateAdjustment, description: e.target.value })}
                                />
                              </div>
                              <Button 
                                type="button" 
                                size="sm" 
                                onClick={addEditStateAdjustment}
                                disabled={!editStateAdjustment.stateCode || !editStateAdjustment.stateName || !editStateAdjustment.adjustmentValue}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Adjustment
                              </Button>
                            </CardContent>
                          </Card>
                          
                          {(editForm.watch("stateAdjustments")?.length || 0) > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Current State Adjustments</h4>
                              {editForm.watch("stateAdjustments")?.map((adj, index) => (
                                <div key={adj.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline">{adj.stateCode}</Badge>
                                    <div>
                                      <p className="text-sm font-medium">{adj.stateName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {adj.adjustmentType === "percentage" ? `${adj.adjustmentValue}%` : `$${adj.adjustmentValue}`}
                                        {adj.description && ` - ${adj.description}`}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeEditStateAdjustment(index)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setEditingPlan(null)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                          {updateMutation.isPending ? "Updating..." : "Update Plan"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              {/* Delete Confirmation Dialog */}
              <AlertDialog open={!!deletingPlan} onOpenChange={(open) => !open && setDeletingPlan(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Fee Plan</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{deletingPlan?.name}"? This will also delete all state-specific adjustments associated with this plan. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deletingPlan && deleteMutation.mutate(deletingPlan.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {/* Detail View Dialog */}
              <Dialog open={!!viewingPlan} onOpenChange={(open) => !open && setViewingPlan(null)}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      {viewingPlan?.name}
                    </DialogTitle>
                    <DialogDescription>
                      Fee plan details and state adjustments
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Rate per Class</p>
                        <p className="font-semibold text-lg">${viewingPlan?.ratePerClass}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Billing Cycle</p>
                        <p className="font-semibold text-lg capitalize">{viewingPlan?.billingCycle}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <div className="mt-1">
                          {viewingPlan?.deletedAt ? (
                            <Badge variant="destructive">Deleted</Badge>
                          ) : (
                            <Badge variant={viewingPlan?.isActive ? "default" : "secondary"}>
                              {viewingPlan?.isActive ? "Active" : "Inactive"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="font-medium">{viewingPlan?.createdAt ? new Date(viewingPlan.createdAt).toLocaleDateString() : "N/A"}</p>
                      </div>
                    </div>
                    {viewingPlan?.description && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{viewingPlan.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        State Adjustments
                      </p>
                      {stateAdjustments && stateAdjustments.length > 0 ? (
                        <div className="space-y-2">
                          {stateAdjustments.map((adj) => (
                            <div key={adj.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{adj.stateName}</p>
                                <p className="text-xs text-muted-foreground">{adj.stateCode}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-sm">
                                  {adj.adjustmentType === "percentage" ? `${adj.adjustmentValue}%` : `$${adj.adjustmentValue}`}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">{adj.adjustmentType.replace("_", " ")}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No state-specific adjustments configured</p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setViewingPlan(null)}>
                      Close
                    </Button>
                    {!viewingPlan?.deletedAt && (
                      <Button onClick={() => {
                        if (viewingPlan) {
                          handleEditClick(viewingPlan);
                          setViewingPlan(null);
                        }
                      }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Plan
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Fee Plans Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first fee plan to start billing students
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-plan">
                <Plus className="w-4 h-4 mr-2" />
                Create Fee Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DiscountsTab() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const { toast } = useToast();

  const { data: discounts, isLoading } = useQuery<Discount[]>({
    queryKey: ["/api/admin/discounts"],
  });

  const form = useForm<DiscountFormData>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      name: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      isActive: true,
    },
  });

  const editForm = useForm<DiscountFormData>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      name: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DiscountFormData) => {
      // Transform field names to match backend schema
      const payload = {
        name: data.name,
        description: data.description,
        type: data.discountType,
        value: data.discountValue,
        isActive: data.isActive,
      };
      const response = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Discount Created",
        description: "The discount has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create discount",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DiscountFormData> }) => {
      // Transform field names to match backend schema
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description;
      if (data.discountType !== undefined) payload.type = data.discountType;
      if (data.discountValue !== undefined) payload.value = data.discountValue;
      if (data.isActive !== undefined) payload.isActive = data.isActive;
      
      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
      setEditingDiscount(null);
      toast({
        title: "Discount Updated",
        description: "The discount has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update discount",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
      toast({
        title: "Discount Updated",
        description: "The discount status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update discount",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
      toast({
        title: "Discount Deleted",
        description: "The discount has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete discount",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: DiscountFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (data: DiscountFormData) => {
    if (editingDiscount) {
      updateMutation.mutate({ id: editingDiscount.id, data });
    }
  };

  const openEditDialog = (discount: Discount) => {
    setEditingDiscount(discount);
    editForm.reset({
      name: discount.name,
      description: discount.description || "",
      discountType: discount.type,
      discountValue: discount.value,
      isActive: discount.isActive,
    });
  };

  const activeDiscounts = discounts?.filter((d) => d.isActive).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Discounts</h2>
          <p className="text-muted-foreground mt-1">Create and manage discounts that can be assigned to students</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-discount">
              <Plus className="w-4 h-4 mr-2" />
              Create Discount
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Discount</DialogTitle>
              <DialogDescription>
                Create a new discount to apply to student fee plans
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Early Bird Discount" data-testid="input-discount-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe this discount..." data-testid="input-discount-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-discount-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="e.g., 10" data-testid="input-discount-value" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-discount">
                    {createMutation.isPending ? "Creating..." : "Create Discount"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-discounts">{discounts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{activeDiscounts} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Discounts</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-discounts">{activeDiscounts}</div>
            <p className="text-xs text-muted-foreground">Available for assignment</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Discounts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              ))}
            </div>
          ) : discounts && discounts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {discounts.map((discount) => (
                <Card
                  key={discount.id}
                  data-testid={`card-discount-${discount.id}`}
                  className="hover-elevate overflow-visible group relative"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className={`flex items-center justify-center w-14 h-14 rounded-xl shrink-0 ${discount.type === "percentage" ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-emerald-500 to-emerald-600"}`}>
                          <span className="text-xl font-bold text-white">
                            {discount.type === "percentage" ? `${parseFloat(discount.value).toFixed(0)}%` : `$${parseFloat(discount.value).toFixed(0)}`}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold truncate" data-testid={`text-discount-name-${discount.id}`}>{discount.name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {discount.description || "No description provided"}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={discount.isActive ? "default" : "destructive"} data-testid={`badge-status-${discount.id}`}>
                              {discount.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">
                              {discount.type === "percentage" ? "Percentage" : "Fixed Amount"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="shrink-0" data-testid={`button-actions-${discount.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={5}>
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openEditDialog(discount); }} data-testid={`button-edit-${discount.id}`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={(e) => { e.preventDefault(); toggleActiveMutation.mutate({ id: discount.id, isActive: !discount.isActive }); }}
                            disabled={toggleActiveMutation.isPending}
                            data-testid={`button-toggle-${discount.id}`}
                          >
                            {discount.isActive ? <><X className="w-4 h-4 mr-2" />Deactivate</> : <><CheckCircle className="w-4 h-4 mr-2" />Activate</>}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={(e) => { e.preventDefault(); deleteMutation.mutate(discount.id); }}
                            disabled={deleteMutation.isPending}
                            className="text-destructive focus:text-destructive"
                            data-testid={`button-delete-${discount.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {/* Edit Dialog - moved outside the loop */}
              <Dialog open={!!editingDiscount} onOpenChange={(open) => !open && setEditingDiscount(null)}>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Edit Discount</DialogTitle>
                          <DialogDescription>Update the discount details</DialogDescription>
                        </DialogHeader>
                        <Form {...editForm}>
                          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
                            <FormField
                              control={editForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Early Bird Discount" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Describe this discount..." />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={editForm.control}
                                name="discountType"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editForm.control}
                                name="discountValue"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Value</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" step="0.01" placeholder="e.g., 10" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                              <Button type="button" variant="outline" onClick={() => setEditingDiscount(null)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? "Updating..." : "Update Discount"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Discounts Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first discount to offer to students
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-discount">
                <Plus className="w-4 h-4 mr-2" />
                Create Discount
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


type ViewMode = "list" | "grid" | "table";

function AssignmentsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("assignmentsViewMode") as ViewMode) || "list";
    }
    return "list";
  });
  const { toast } = useToast();

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("assignmentsViewMode", mode);
  };

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<FeeAssignment[]>({
    queryKey: ["/api/admin/student-fee-assignments"],
    enabled: true,
  });

  const { data: students, refetch: refetchStudents } = useQuery<Student[]>({
    queryKey: ["/api/users", "students", "with-parents"],
    queryFn: async () => {
      const response = await fetch("/api/users?role=student");
      if (!response.ok) throw new Error("Failed to fetch students");
      const studentList: Student[] = await response.json();
      
      // Check parent-child junction table for each student
      const studentsWithParentInfo = await Promise.all(
        studentList.map(async (student) => {
          try {
            const parentResponse = await fetch(`/api/users/${student.id}/parents`);
            if (parentResponse.ok) {
              const parentData = await parentResponse.json();
              return {
                ...student,
                hasParentLink: parentData && (Array.isArray(parentData) ? parentData.length > 0 : !!parentData.id)
              };
            }
          } catch {
            // Ignore errors, keep original student data
          }
          return { ...student, hasParentLink: !!student.parentId };
        })
      );
      
      return studentsWithParentInfo;
    },
    enabled: true,
    staleTime: 0,
  });

  const { data: feePlans } = useQuery<FeePlan[]>({
    queryKey: ["/api/admin/fee-plans"],
    enabled: true,
  });

  const { data: discounts } = useQuery<Discount[]>({
    queryKey: ["/api/admin/discounts"],
  });

  const { data: studentDiscounts } = useQuery<StudentDiscount[]>({
    queryKey: ["/api/admin/student-discounts"],
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/admin/invoices"],
  });

  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [selectedStudentForDiscount, setSelectedStudentForDiscount] = useState<{ studentId: string; student: { firstName: string | null; lastName: string | null } } | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<FeeAssignment | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const discountForm = useForm<AssignDiscountFormData>({
    resolver: zodResolver(assignDiscountFormSchema),
    defaultValues: {
      discountId: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      notes: "",
    },
  });

  const assignDiscountMutation = useMutation({
    mutationFn: async (data: { studentId: string; discountId: string; startDate: string; endDate?: string; notes?: string }) => {
      const response = await fetch("/api/admin/student-discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: data.studentId,
          discountId: data.discountId,
          startDate: data.startDate,
          endDate: data.endDate || null,
          notes: data.notes || null,
          isActive: true,
        }),
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
        description: "The discount has been assigned to the student.",
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

  const openDiscountDialog = (assignment: FeeAssignment) => {
    setSelectedStudentForDiscount({
      studentId: assignment.studentId,
      student: assignment.student,
    });
    discountForm.reset({ discountId: "" });
    setIsDiscountDialogOpen(true);
  };

  const handleAssignDiscount = (data: AssignDiscountFormData) => {
    if (selectedStudentForDiscount) {
      assignDiscountMutation.mutate({
        studentId: selectedStudentForDiscount.studentId,
        discountId: data.discountId,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes,
      });
    }
  };

  const getStudentDiscounts = (studentId: string) => {
    return studentDiscounts?.filter(sd => sd.studentId === studentId && sd.isActive && sd.discount) || [];
  };

  const getStudentDueAmount = (studentId: string) => {
    const dueInvoices = invoices?.filter(
      (inv) => inv.studentId === studentId && (inv.status === "pending" || inv.status === "overdue" || inv.status === "partial")
    ) || [];
    return dueInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);
  };

  const activeDiscounts = discounts?.filter((d) => d.isActive) || [];

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      studentId: "",
      feePlanId: "",
      startDate: new Date().toISOString().split("T")[0],
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

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/student-fee-assignments/${id}/toggle-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-fee-assignments"] });
      toast({
        title: variables.isActive ? "Assignment Activated" : "Assignment Deactivated",
        description: `The fee plan assignment has been ${variables.isActive ? "activated" : "deactivated"}.`,
      });
      // Update detail dialog if open
      if (selectedAssignment && selectedAssignment.id === variables.id) {
        setSelectedAssignment({ ...selectedAssignment, isActive: variables.isActive });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update assignment status",
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await fetch(`/api/admin/student-fee-assignments/${assignmentId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-fee-assignments"] });
      toast({
        title: "Assignment Removed",
        description: "The fee plan assignment has been removed from the list.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove assignment",
        variant: "destructive",
      });
    },
  });

  const handleAssign = (data: AssignmentFormData) => {
    assignMutation.mutate(data);
  };

  const activeFeePlans = feePlans?.filter((p) => p.isActive && !p.deletedAt) || [];
  
  const filteredAssignments = assignments?.filter((assignment) => {
    // Only show students with assigned fee plans
    if (!assignment.feePlan || !assignment.student) return false;
    
    if (!searchQuery) return true;
    const studentName = `${assignment.student.firstName || ''} ${assignment.student.lastName || ''}`.toLowerCase();
    const email = assignment.student.email.toLowerCase();
    const planName = assignment.feePlan.name.toLowerCase();
    const query = searchQuery.toLowerCase();
    return studentName.includes(query) || email.includes(query) || planName.includes(query);
  });

  const activeAssignments = assignments?.filter((a) => a.isActive).length || 0;
  const totalMonthlyRevenue = assignments
    ?.filter((a) => a.isActive && a.feePlan && a.feePlan.billingCycle === "monthly")
    .reduce((sum, a) => sum + parseFloat(a.feePlan.ratePerClass || '0'), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Student Fee Assignments</h2>
          <p className="text-muted-foreground mt-1">Assign fee plans to students for automatic billing</p>
        </div>
        <Dialog open={isAssignDialogOpen} onOpenChange={(open) => {
          setIsAssignDialogOpen(open);
          if (open) {
            refetchStudents();
          }
        }}>
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
                  render={({ field }) => {
                    const selectedStudent = students?.find(s => s.id === field.value);
                    const hasNoParent = selectedStudent && !selectedStudent.hasParentLink && !selectedStudent.parentId;
                    return (
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
                              {!student.hasParentLink && !student.parentId && " - No Parent"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {hasNoParent && (
                        <div className="flex items-start gap-2 p-3 mt-2 text-sm border border-destructive/50 bg-destructive/10 rounded-md text-destructive">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>
                            This student has no parent assigned. Invoices cannot be generated until a parent is linked by an administrator.
                          </span>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  );}}
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
                              {plan.name} (${plan.ratePerClass}/class - {plan.billingCycle})
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
                        <Input {...field} type="date" data-testid="input-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={assignMutation.isPending} data-testid="button-submit-assignment">
                    {assignMutation.isPending ? "Assigning..." : "Assign Fee Plan"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-assignments">{assignments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{activeAssignments} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-assignments">{activeAssignments}</div>
            <p className="text-xs text-muted-foreground">Currently generating invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue (Est.)</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-monthly-revenue">${totalMonthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From active monthly plans</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>All Assignments</CardTitle>
            <div className="flex items-center gap-3 flex-1 justify-end">
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
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleViewModeChange("list")}
                  data-testid="button-view-list"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleViewModeChange("grid")}
                  data-testid="button-view-grid"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleViewModeChange("table")}
                  data-testid="button-view-table"
                >
                  <Table className="h-4 w-4" />
                </Button>
              </div>
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
            <>
              {viewMode === "list" && (
                <div className="space-y-3">
                  {filteredAssignments?.map((assignment) => {
                    const studentActiveDiscounts = getStudentDiscounts(assignment.studentId);
                    return (
                      <Card
                        key={assignment.id}
                        data-testid={`card-assignment-${assignment.id}`}
                        className="hover-elevate cursor-pointer overflow-visible group relative"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-l-lg" />
                        <CardContent className="p-3">
                          {/* Compact Header Row */}
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                                <AvatarImage src={assignment.student?.avatarUrl || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                  {assignment.student?.firstName?.[0]}{assignment.student?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${assignment.isActive ? 'bg-primary' : 'bg-muted'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-sm truncate" data-testid={`text-student-name-${assignment.id}`}>
                                  {assignment.student?.firstName || ""} {assignment.student?.lastName || "Student"}
                                </h3>
                                <Badge variant={assignment.isActive ? "default" : "secondary"} className="shrink-0 text-xs" data-testid={`badge-status-${assignment.id}`}>
                                  {assignment.isActive ? "Active" : "Inactive"}
                                </Badge>
                                {(() => {
                                  const dueAmount = getStudentDueAmount(assignment.studentId);
                                  return dueAmount > 0 ? (
                                    <Badge variant="destructive" className="shrink-0 text-xs" data-testid={`badge-due-${assignment.id}`}>
                                      Due: ${dueAmount.toFixed(2)}
                                    </Badge>
                                  ) : null;
                                })()}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span data-testid={`text-plan-name-${assignment.id}`}>{assignment.feePlan.name}</span>
                                <span className="font-medium">
                                  ${assignment.feePlan.adjustedRatePerClass || assignment.feePlan.ratePerClass}/class
                                  {assignment.stateAdjustment && (
                                    <span className="ml-1 text-primary">({assignment.stateAdjustment.stateCode})</span>
                                  )}
                                </span>
                                <span>{format(new Date(assignment.startDate), "MMM dd, yyyy")}</span>
                              </div>
                            </div>
                            {/* Discount Badges */}
                            {studentActiveDiscounts.length > 0 && (
                              <div className="hidden sm:flex items-center gap-1 shrink-0">
                                {studentActiveDiscounts.slice(0, 2).map((sd) => (
                                  <Badge key={sd.id} variant="secondary" className="text-xs">
                                    {sd.discount?.discountType === "percentage" 
                                      ? `${sd.discount?.discountValue || 0}%` 
                                      : `$${sd.discount?.discountValue || 0}`}
                                  </Badge>
                                ))}
                                {studentActiveDiscounts.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">+{studentActiveDiscounts.length - 2}</Badge>
                                )}
                              </div>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`button-actions-${assignment.id}`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => openDiscountDialog(assignment)} data-testid={`button-add-discount-list-${assignment.id}`}>
                                  <Tag className="w-4 h-4 mr-2" />
                                  Add Discount
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => toggleStatusMutation.mutate({ id: assignment.id, isActive: !assignment.isActive })}
                                  disabled={toggleStatusMutation.isPending}
                                  data-testid={`button-toggle-status-${assignment.id}`}
                                >
                                  {assignment.isActive ? <><X className="w-4 h-4 mr-2" />Deactivate</> : <><CheckCircle className="w-4 h-4 mr-2" />Activate</>}
                                </DropdownMenuItem>
                                {!assignment.isActive && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => removeMutation.mutate(assignment.id)} disabled={removeMutation.isPending} className="text-destructive" data-testid={`button-remove-${assignment.id}`}>
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Remove Assignment
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAssignments?.map((assignment) => {
                    const studentActiveDiscounts = getStudentDiscounts(assignment.studentId);
                    return (
                      <Card
                        key={assignment.id}
                        data-testid={`card-assignment-${assignment.id}`}
                        className="hover-elevate cursor-pointer overflow-visible group"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        {/* Top Accent Bar */}
                        <div className="h-1 bg-gradient-to-r from-primary to-primary/50 rounded-t-lg" />
                        <CardContent className="p-4">
                          {/* Header with Avatar and Actions */}
                          <div className="flex items-start gap-3 mb-4">
                            <div className="relative">
                              <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                                <AvatarImage src={assignment.student?.avatarUrl || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                  {assignment.student?.firstName?.[0]}{assignment.student?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${assignment.isActive ? 'bg-primary' : 'bg-muted'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate mb-0.5" data-testid={`text-student-name-${assignment.id}`}>
                                {assignment.student?.firstName || ""} {assignment.student?.lastName || "Student"}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">{assignment.student?.email || ""}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`button-actions-grid-${assignment.id}`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => openDiscountDialog(assignment)} data-testid={`button-add-discount-grid-${assignment.id}`}>
                                  <Tag className="w-4 h-4 mr-2" />
                                  Add Discount
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => toggleStatusMutation.mutate({ id: assignment.id, isActive: !assignment.isActive })}
                                  disabled={toggleStatusMutation.isPending}
                                  data-testid={`button-toggle-status-grid-${assignment.id}`}
                                >
                                  {assignment.isActive ? <><X className="w-4 h-4 mr-2" />Deactivate</> : <><CheckCircle className="w-4 h-4 mr-2" />Activate</>}
                                </DropdownMenuItem>
                                {!assignment.isActive && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => removeMutation.mutate(assignment.id)} disabled={removeMutation.isPending} className="text-destructive" data-testid={`button-remove-grid-${assignment.id}`}>
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Remove Assignment
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Fee Plan Details */}
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2 mb-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground uppercase tracking-wide">Fee Plan</span>
                              <span className="font-medium text-sm" data-testid={`text-plan-name-${assignment.id}`}>{assignment.feePlan.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground uppercase tracking-wide">Amount</span>
                              <span className="font-semibold text-sm">
                                ${assignment.feePlan.adjustedRatePerClass || assignment.feePlan.ratePerClass}/class
                                <span className="text-muted-foreground font-normal text-xs">/{assignment.feePlan.billingCycle}</span>
                                {assignment.stateAdjustment && (
                                  <span className="ml-1 text-primary text-xs">({assignment.stateAdjustment.stateCode})</span>
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground uppercase tracking-wide">Start</span>
                              <span className="text-sm">{format(new Date(assignment.startDate), "MMM dd, yyyy")}</span>
                            </div>
                          </div>

                          {/* Status, Due Payment and Discounts */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1 flex-wrap">
                              <Badge variant={assignment.isActive ? "default" : "secondary"} data-testid={`badge-status-${assignment.id}`}>
                                {assignment.isActive ? "Active" : "Inactive"}
                              </Badge>
                              {(() => {
                                const dueAmount = getStudentDueAmount(assignment.studentId);
                                return dueAmount > 0 ? (
                                  <Badge variant="destructive" className="text-xs" data-testid={`badge-due-grid-${assignment.id}`}>
                                    Due: ${dueAmount.toFixed(2)}
                                  </Badge>
                                ) : null;
                              })()}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {studentActiveDiscounts.map((sd) => (
                                <Badge key={sd.id} variant="secondary" className="text-xs">
                                  {sd.discount?.discountType === "percentage" 
                                    ? `${sd.discount?.discountValue || 0}%` 
                                    : `$${sd.discount?.discountValue || 0}`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {viewMode === "table" && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-4 font-medium text-xs uppercase tracking-wide text-muted-foreground">Student</th>
                        <th className="text-left p-4 font-medium text-xs uppercase tracking-wide text-muted-foreground">Fee Plan</th>
                        <th className="text-left p-4 font-medium text-xs uppercase tracking-wide text-muted-foreground">Amount</th>
                        <th className="text-left p-4 font-medium text-xs uppercase tracking-wide text-muted-foreground">Start Date</th>
                        <th className="text-left p-4 font-medium text-xs uppercase tracking-wide text-muted-foreground">Due</th>
                        <th className="text-left p-4 font-medium text-xs uppercase tracking-wide text-muted-foreground">Discounts</th>
                        <th className="text-left p-4 font-medium text-xs uppercase tracking-wide text-muted-foreground">Status</th>
                        <th className="text-right p-4 font-medium text-xs uppercase tracking-wide text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments?.map((assignment, index) => {
                        const studentActiveDiscounts = getStudentDiscounts(assignment.studentId);
                        return (
                          <tr 
                            key={assignment.id} 
                            className={`hover:bg-muted/30 cursor-pointer transition-colors group ${index !== filteredAssignments.length - 1 ? 'border-b' : ''}`}
                            data-testid={`card-assignment-${assignment.id}`}
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setIsDetailDialogOpen(true);
                            }}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                                    <AvatarImage src={assignment.student?.avatarUrl || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                      {assignment.student?.firstName?.[0]}{assignment.student?.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${assignment.isActive ? 'bg-primary' : 'bg-muted'}`} />
                                </div>
                                <div>
                                  <div className="font-medium text-sm" data-testid={`text-student-name-${assignment.id}`}>
                                    {assignment.student?.firstName || ""} {assignment.student?.lastName || "Student"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{assignment.student?.email || ""}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-medium text-sm" data-testid={`text-plan-name-${assignment.id}`}>{assignment.feePlan.name}</span>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-sm">${assignment.feePlan.adjustedRatePerClass || assignment.feePlan.ratePerClass}/class</span>
                              <span className="text-xs text-muted-foreground">/{assignment.feePlan.billingCycle}</span>
                              {assignment.stateAdjustment && (
                                <span className="ml-1 text-primary text-xs">({assignment.stateAdjustment.stateCode})</span>
                              )}
                            </td>
                            <td className="p-4 text-sm">{format(new Date(assignment.startDate), "MMM dd, yyyy")}</td>
                            <td className="p-4">
                              {(() => {
                                const dueAmount = getStudentDueAmount(assignment.studentId);
                                return dueAmount > 0 ? (
                                  <Badge variant="destructive" className="text-xs" data-testid={`badge-due-table-${assignment.id}`}>
                                    ${dueAmount.toFixed(2)}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                );
                              })()}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1 items-center">
                                {studentActiveDiscounts.length > 0 ? (
                                  studentActiveDiscounts.map((sd) => (
                                    <Badge key={sd.id} variant="secondary" className="text-xs">
                                      {sd.discount?.name}: {sd.discount?.discountType === "percentage" 
                                        ? `${sd.discount?.discountValue || 0}%` 
                                        : `$${sd.discount?.discountValue || 0}`}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant={assignment.isActive ? "default" : "secondary"} data-testid={`badge-status-${assignment.id}`}>
                                {assignment.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`button-actions-table-${assignment.id}`}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenuItem onClick={() => openDiscountDialog(assignment)} data-testid={`button-add-discount-${assignment.id}`}>
                                    <Tag className="w-4 h-4 mr-2" />
                                    Add Discount
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => toggleStatusMutation.mutate({ id: assignment.id, isActive: !assignment.isActive })}
                                    disabled={toggleStatusMutation.isPending}
                                    data-testid={`button-toggle-status-${assignment.id}`}
                                  >
                                    {assignment.isActive ? <><X className="w-4 h-4 mr-2" />Deactivate</> : <><CheckCircle className="w-4 h-4 mr-2" />Activate</>}
                                  </DropdownMenuItem>
                                  {!assignment.isActive && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => removeMutation.mutate(assignment.id)} disabled={removeMutation.isPending} className="text-destructive" data-testid={`button-remove-${assignment.id}`}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove Assignment
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
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

      {/* Discount Assignment Dialog */}
      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Assign Discount
            </DialogTitle>
            <DialogDescription>
              {selectedStudentForDiscount && (
                <span>
                  Select a discount to apply to{" "}
                  <strong>
                    {selectedStudentForDiscount.student?.firstName || ""} {selectedStudentForDiscount.student?.lastName || "Student"}
                  </strong>
                </span>
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
                    <FormLabel>Select Discount</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a discount" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeDiscounts.length > 0 ? (
                          activeDiscounts.map((discount) => (
                            <SelectItem key={discount.id} value={discount.id}>
                              <div className="flex items-center gap-2">
                                <span>{discount.name}</span>
                                <span className="text-muted-foreground">
                                  ({discount.type === "percentage" 
                                    ? `${discount.value}%` 
                                    : `$${discount.value}`})
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-discounts" disabled>
                            No active discounts available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={discountForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={discountForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={discountForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Sibling discount for 2024-2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDiscountDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={assignDiscountMutation.isPending || !discountForm.watch("discountId") || !discountForm.watch("startDate")}
                  data-testid="button-confirm-assign-discount"
                >
                  {assignDiscountMutation.isPending ? "Assigning..." : "Assign Discount"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assignment Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Fee Assignment Details
            </DialogTitle>
            <DialogDescription>
              View detailed fee plan and discount information for this student
            </DialogDescription>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedAssignment.student?.avatarUrl || undefined} />
                  <AvatarFallback>
                    {selectedAssignment.student?.firstName?.[0]}{selectedAssignment.student?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold">
                    {selectedAssignment.student?.firstName || ""} {selectedAssignment.student?.lastName || "Student"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedAssignment.student?.email || ""}
                  </div>
                  {selectedAssignment.student?.state && (
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedAssignment.student.state}
                    </div>
                  )}
                </div>
                <Badge variant={selectedAssignment.isActive ? "default" : "secondary"}>
                  {selectedAssignment.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* Fee Plan Details */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Fee Plan
                </h4>
                <div className="p-3 border rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan Name</span>
                    <span className="font-medium">{selectedAssignment.feePlan.name}</span>
                  </div>
                  {selectedAssignment.stateAdjustment ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Rate per Class</span>
                        <span className="font-medium">${selectedAssignment.feePlan.ratePerClass}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">State Adjustment</span>
                        <span className="font-medium text-primary">
                          {selectedAssignment.stateAdjustment.adjustmentType === 'percentage' 
                            ? `+${selectedAssignment.stateAdjustment.adjustmentValue}%` 
                            : `+$${selectedAssignment.stateAdjustment.adjustmentValue}`}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-1">
                        <span className="text-muted-foreground font-medium">Adjusted Rate per Class</span>
                        <span className="font-semibold text-primary">
                          ${selectedAssignment.feePlan.adjustedRatePerClass}
                          <span className="ml-1 text-xs">({selectedAssignment.stateAdjustment.stateCode} - {selectedAssignment.stateAdjustment.stateName})</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate per Class</span>
                      <span className="font-medium">${selectedAssignment.feePlan.ratePerClass}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing Cycle</span>
                    <span className="font-medium capitalize">{selectedAssignment.feePlan.billingCycle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date</span>
                    <span className="font-medium">{format(new Date(selectedAssignment.startDate), "MMM dd, yyyy")}</span>
                  </div>
                  {selectedAssignment.endDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date</span>
                      <span className="font-medium">{format(new Date(selectedAssignment.endDate), "MMM dd, yyyy")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Due Info */}
              {(() => {
                const dueAmount = getStudentDueAmount(selectedAssignment.studentId);
                const dueInvoices = invoices?.filter(
                  (inv) => inv.studentId === selectedAssignment.studentId && 
                  (inv.status === "pending" || inv.status === "overdue" || inv.status === "partial")
                ) || [];
                return dueAmount > 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Receipt className="w-4 h-4" />
                      Payment Due
                    </h4>
                    <div className="p-3 border border-destructive/30 bg-destructive/5 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Due</span>
                        <Badge variant="destructive" className="text-sm">
                          ${dueAmount.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Invoices</span>
                        <div className="space-y-1">
                          {dueInvoices.map((inv) => (
                            <div key={inv.id} className="flex justify-between items-center text-sm">
                              <span className="font-medium">{inv.invoiceNumber}</span>
                              <div className="flex items-center gap-2">
                                <span>${parseFloat(inv.total).toFixed(2)}</span>
                                <Badge 
                                  variant={inv.status === "overdue" ? "destructive" : "secondary"} 
                                  className="text-xs capitalize"
                                >
                                  {inv.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Applied Discounts */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Applied Discounts
                </h4>
                <div className="p-3 border rounded-lg">
                  {getStudentDiscounts(selectedAssignment.studentId).length > 0 ? (
                    <div className="space-y-2">
                      {getStudentDiscounts(selectedAssignment.studentId).map((sd) => (
                        <div key={sd.id} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {sd.discount?.name || "Discount"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {sd.discount?.type === "percentage" 
                                ? `${sd.discount?.value || 0}% off` 
                                : `$${sd.discount?.value || 0} off`}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeDiscountMutation.mutate(sd.id)}
                            disabled={removeDiscountMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      No discounts applied
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        openDiscountDialog(selectedAssignment);
                        setIsDetailDialogOpen(false);
                      }}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      Add Discount
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <DialogFooter className="gap-2 pt-2">
                <Button
                  variant={selectedAssignment.isActive ? "outline" : "default"}
                  onClick={() => {
                    toggleStatusMutation.mutate({ 
                      id: selectedAssignment.id, 
                      isActive: !selectedAssignment.isActive 
                    });
                  }}
                  disabled={toggleStatusMutation.isPending}
                >
                  {selectedAssignment.isActive ? "Deactivate" : "Activate"}
                </Button>
                {!selectedAssignment.isActive && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      removeMutation.mutate(selectedAssignment.id);
                      setIsDetailDialogOpen(false);
                    }}
                    disabled={removeMutation.isPending}
                  >
                    Remove Assignment
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoicesTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDeletedInvoices, setShowDeletedInvoices] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [invoiceViewMode, setInvoiceViewMode] = useState<"list" | "grid" | "table">(() => {
    const saved = localStorage.getItem("invoiceViewMode");
    return (saved as "list" | "grid" | "table") || "list";
  });
  const [invoiceSortOrder, setInvoiceSortOrder] = useState<"default" | "asc" | "desc">("default");
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  
  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "online",
      transactionId: "",
      notes: "",
    },
  });

  const { data: invoices, isLoading, refetch: refetchInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/admin/invoices", { includeDeleted: showDeletedInvoices }],
    queryFn: async () => {
      const endpoint = showDeletedInvoices 
        ? "/api/admin/invoices/all/including-deleted" 
        : "/api/admin/invoices";
      const response = await fetch(endpoint, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch invoices");
      return response.json();
    },
    enabled: true,
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
    enabled: true,
  });

  const copyInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/copy`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create invoice copy");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice copy created successfully.",
      });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/admin/invoices" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice copy",
        variant: "destructive",
      });
    },
  });

  const generateInvoicesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/generate-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to generate invoices");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice generation triggered. Invoices will appear shortly.",
      });
      setTimeout(() => {
        refetchInvoices();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate invoices",
        variant: "destructive",
      });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData & { invoiceId: string }) => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: data.invoiceId,
          amount: data.amount.toString(),
          paymentMethod: data.paymentMethod,
          transactionId: data.transactionId || null,
          notes: data.notes || null,
        }),
      });
      if (!response.ok) throw new Error("Failed to create payment");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment recorded successfully.",
      });
      paymentForm.reset();
      setShowPaymentForm(false);
      setSelectedInvoice(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async ({ invoiceId, reason }: { invoiceId: string; reason?: string }) => {
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("Failed to delete invoice");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice deleted. Record maintained for audit purposes.",
      });
      setSelectedInvoice(null);
      setInvoiceToDelete(null);
      setDeleteReason("");
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/admin/invoices" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  const calculatePaidAmount = (invoiceId: string) => {
    if (!payments) return 0;
    return payments
      .filter((p) => p.invoiceId === invoiceId)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  };

  const activeInvoices = invoices?.filter((i) => !i.isDeleted && i.status !== "paid") || [];
  const deletedInvoices = invoices?.filter((i) => i.isDeleted) || [];
  const baseInvoices = showDeletedInvoices ? invoices || [] : activeInvoices;
  
  const filteredInvoices = baseInvoices.filter((invoice) => {
    const studentName = `${invoice.student?.firstName || ''} ${invoice.student?.lastName || ''}`.toLowerCase();
    const parentName = `${invoice.parent?.firstName || ''} ${invoice.parent?.lastName || ''}`.toLowerCase();
    const studentEmail = invoice.student?.email?.toLowerCase() || '';
    
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentName.includes(searchQuery.toLowerCase()) ||
      parentName.includes(searchQuery.toLowerCase()) ||
      studentEmail.includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "deleted" && invoice.isDeleted) ||
      (!invoice.isDeleted && invoice.status === statusFilter);
    
    return matchesSearch && matchesStatus;
  });

  const totalInvoices = activeInvoices.length;
  const pendingInvoices = activeInvoices.filter((i) => i.status === "pending" || i.status === "partial").length || 0;
  const overdueInvoices = activeInvoices.filter((i) => i.status === "overdue").length || 0;
  const deletedCount = deletedInvoices.length;
  const paidInvoices = invoices?.filter((i) => !i.isDeleted && i.status === "paid").length || 0;
  const totalRevenue = activeInvoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0;
  const totalCollected = invoices?.filter((i) => !i.isDeleted && i.status === "paid").reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Invoice Management</h2>
        <p className="text-muted-foreground mt-1">Monitor and manage all student invoices</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-invoices">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">${totalRevenue.toFixed(2)} total value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="text-pending-invoices">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-overdue-invoices">{overdueInvoices}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-collected-amount">${totalCollected.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{paidInvoices} paid invoices</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <CardTitle className="flex-shrink-0">All Invoices</CardTitle>
              <div className="flex flex-col md:flex-row gap-3 flex-1 justify-end">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    data-testid="input-search-invoices"
                    placeholder="Search by invoice #, student, or parent..."
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Unpaid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    {showDeletedInvoices && <SelectItem value="deleted">Deleted</SelectItem>}
                  </SelectContent>
                </Select>
                <Button
                  variant={showDeletedInvoices ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowDeletedInvoices(!showDeletedInvoices)}
                  className="gap-2"
                  data-testid="button-toggle-deleted"
                >
                  <Archive className="h-4 w-4" />
                  {showDeletedInvoices ? `Show All (${deletedCount} deleted)` : "Show Deleted"}
                </Button>
                <Button
                  size="icon"
                  variant={invoiceSortOrder !== "default" ? "default" : "outline"}
                  onClick={() => {
                    if (invoiceSortOrder === "default") setInvoiceSortOrder("desc");
                    else if (invoiceSortOrder === "desc") setInvoiceSortOrder("asc");
                    else setInvoiceSortOrder("default");
                  }}
                  data-testid="button-sort-invoices"
                  title={invoiceSortOrder === "default" ? "Sort by date" : invoiceSortOrder === "desc" ? "Newest first" : "Oldest first"}
                >
                  {invoiceSortOrder === "default" && <ArrowUpDown className="h-4 w-4" />}
                  {invoiceSortOrder === "desc" && <ArrowDown className="h-4 w-4" />}
                  {invoiceSortOrder === "asc" && <ArrowUp className="h-4 w-4" />}
                </Button>
                <div className="flex gap-1 border rounded-md p-1">
                  <Button
                    size="sm"
                    variant={invoiceViewMode === "list" ? "default" : "ghost"}
                    onClick={() => {
                      setInvoiceViewMode("list");
                      localStorage.setItem("invoiceViewMode", "list");
                    }}
                    data-testid="button-view-list"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={invoiceViewMode === "grid" ? "default" : "ghost"}
                    onClick={() => {
                      setInvoiceViewMode("grid");
                      localStorage.setItem("invoiceViewMode", "grid");
                    }}
                    data-testid="button-view-grid"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={invoiceViewMode === "table" ? "default" : "ghost"}
                    onClick={() => {
                      setInvoiceViewMode("table");
                      localStorage.setItem("invoiceViewMode", "table");
                    }}
                    data-testid="button-view-table"
                  >
                    <Table className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={() => generateInvoicesMutation.mutate()}
                  disabled={generateInvoicesMutation.isPending}
                  data-testid="button-generate-invoices"
                >
                  {generateInvoicesMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Generate Invoices
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : filteredInvoices && filteredInvoices.length > 0 ? (
            <>
              {invoiceViewMode === "grid" && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredInvoices
                    .sort((a, b) => invoiceSortOrder === "default" 
                      ? 0
                      : invoiceSortOrder === "desc" 
                      ? new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
                      : new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .map((invoice) => {
                      const paidAmount = calculatePaidAmount(invoice.id);
                      return (
                        <div
                          key={invoice.id}
                          data-testid={`invoice-${invoice.id}`}
                          className="p-4 border rounded-lg hover-elevate cursor-pointer bg-card"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">#{invoice.invoiceNumber}</span>
                            <Badge
                              variant={
                                invoice.status === "paid"
                                  ? "default"
                                  : invoice.status === "overdue"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {invoice.status}
                            </Badge>
                          </div>
                          <div className="text-xs mb-2">
                            <span className="font-semibold text-foreground">{invoice.student?.firstName || 'N/A'} {invoice.student?.lastName || ''}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {invoice.feePlan?.name || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground mb-3">
                            Due: {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                          </div>
                          <div className="flex justify-between items-end gap-2">
                            <div className="flex-1">
                              <div className="text-xl font-bold" data-testid={`text-amount-${invoice.id}`}>
                                ${parseFloat(invoice.total).toFixed(2)}
                              </div>
                              {paidAmount > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  ${paidAmount.toFixed(2)} paid
                                </div>
                              )}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => e.stopPropagation()}
                                    data-testid={`button-menu-invoice-${invoice.id}`}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyInvoiceMutation.mutate(invoice.id);
                                    }}
                                    data-testid={`button-copy-invoice-${invoice.id}`}
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Create Copy
                                  </DropdownMenuItem>
                                  {!invoice.isDeleted && invoice.status !== "paid" && (
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setInvoiceToDelete(invoice.id);
                                      }}
                                      data-testid={`button-delete-invoice-${invoice.id}`}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Invoice
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
              {invoiceViewMode === "table" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-3">Invoice</th>
                        <th className="text-left py-2 px-3">Student</th>
                        <th className="text-left py-2 px-3">Status</th>
                        <th className="text-left py-2 px-3">Due Date</th>
                        <th className="text-right py-2 px-3">Amount</th>
                        <th className="text-right py-2 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices
                        .sort((a, b) => invoiceSortOrder === "default" 
                          ? 0
                          : invoiceSortOrder === "desc" 
                          ? new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
                          : new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                        .map((invoice) => (
                          <tr
                            key={invoice.id}
                            data-testid={`invoice-${invoice.id}`}
                            className="border-b hover-elevate cursor-pointer"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            <td className="py-3 px-3 font-semibold">#{invoice.invoiceNumber}</td>
                            <td className="py-3 px-3"><span className="font-semibold">{invoice.student?.firstName || 'N/A'} {invoice.student?.lastName || ''}</span></td>
                            <td className="py-3 px-3">
                              <Badge
                                variant={
                                  invoice.status === "paid"
                                    ? "default"
                                    : invoice.status === "overdue"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {invoice.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-3">{format(new Date(invoice.dueDate), "MMM dd, yyyy")}</td>
                            <td className="py-3 px-3 text-right font-semibold" data-testid={`text-amount-${invoice.id}`}>
                              ${parseFloat(invoice.total).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {invoice.status !== "paid" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteInvoiceMutation.mutate(invoice.id);
                                  }}
                                  disabled={deleteInvoiceMutation.isPending}
                                  data-testid={`button-delete-invoice-${invoice.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
              {invoiceViewMode === "list" && (
                <div className="space-y-3">
                  {filteredInvoices
                    .sort((a, b) => invoiceSortOrder === "default" 
                      ? 0
                      : invoiceSortOrder === "desc" 
                      ? new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
                      : new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .map((invoice) => {
                      const paidAmount = calculatePaidAmount(invoice.id);
                      const remainingAmount = parseFloat(invoice.total) - paidAmount;
                      return (
                        <div
                          key={invoice.id}
                          data-testid={`invoice-${invoice.id}`}
                          className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg hover-elevate cursor-pointer"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold">#{invoice.invoiceNumber}</span>
                              {invoice.isDeleted ? (
                                <Badge variant="destructive" data-testid={`badge-deleted-${invoice.id}`}>
                                  Deleted
                                </Badge>
                              ) : (
                                <Badge
                                  variant={
                                    invoice.status === "paid"
                                      ? "default"
                                      : invoice.status === "overdue"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  data-testid={`badge-status-${invoice.id}`}
                                >
                                  {invoice.status}
                                </Badge>
                              )}
                              {invoice.isCopy && (
                                <Badge variant="outline" data-testid={`badge-copy-${invoice.id}`}>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm">
                              Student: <span className="font-semibold text-foreground">{invoice.student?.firstName || 'N/A'} {invoice.student?.lastName || ''}</span>
                            </div>
                            <div className="text-sm">
                              Parent: <span className="font-semibold text-foreground">{invoice.parent?.firstName || 'N/A'} {invoice.parent?.lastName || ''}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {invoice.feePlan?.name || 'N/A'} - {invoice.feePlan?.billingCycle || ''}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Due: {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <div className="text-right flex-1">
                              <div className="text-2xl font-bold" data-testid={`text-amount-${invoice.id}`}>
                                ${parseFloat(invoice.total).toFixed(2)}
                              </div>
                              {paidAmount > 0 && invoice.status !== "paid" && (
                                <div className="text-sm text-muted-foreground">
                                  ${paidAmount.toFixed(2)} paid, ${remainingAmount.toFixed(2)} remaining
                                </div>
                              )}
                              {invoice.status === "paid" && (
                                <div className="text-sm text-primary">Fully Paid</div>
                              )}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => e.stopPropagation()}
                                    data-testid={`button-menu-invoice-${invoice.id}`}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyInvoiceMutation.mutate(invoice.id);
                                    }}
                                    data-testid={`button-copy-invoice-${invoice.id}`}
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Create Copy
                                  </DropdownMenuItem>
                                  {!invoice.isDeleted && invoice.status !== "paid" && (
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setInvoiceToDelete(invoice.id);
                                      }}
                                      data-testid={`button-delete-invoice-${invoice.id}`}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Invoice
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || statusFilter !== "all" ? "No Matches Found" : "No Invoices Yet"}
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Invoices will be automatically generated based on active student fee assignments"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button 
                  onClick={() => generateInvoicesMutation.mutate()}
                  disabled={generateInvoicesMutation.isPending}
                  data-testid="button-generate-invoices"
                >
                  {generateInvoicesMutation.isPending ? "Generating..." : "Generate Invoices Now"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => {
        if (!open) {
          setSelectedInvoice(null);
          setShowPaymentForm(false);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice #{selectedInvoice?.invoiceNumber}
            </DialogTitle>
            <DialogDescription>
              {showPaymentForm ? "Record payment details" : "Full invoice details"}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && !showPaymentForm && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    selectedInvoice.status === "paid"
                      ? "default"
                      : selectedInvoice.status === "overdue"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                </Badge>
              </div>
              
              <div className="grid gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2 text-sm">Student Information</h4>
                  <p className="text-sm">{selectedInvoice.student?.firstName || 'N/A'} {selectedInvoice.student?.lastName || ''}</p>
                  <p className="text-xs text-muted-foreground">{selectedInvoice.student?.email || 'No email'}</p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2 text-sm">Parent/Guardian</h4>
                  <p className="text-sm">{selectedInvoice.parent?.firstName || 'N/A'} {selectedInvoice.parent?.lastName || ''}</p>
                  <p className="text-xs text-muted-foreground">{selectedInvoice.parent?.email || 'No email'}</p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2 text-sm">Fee Plan</h4>
                  <p className="text-sm">{selectedInvoice.feePlan?.name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">
                    Billing Cycle: {selectedInvoice.feePlan?.billingCycle || 'N/A'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-1 text-sm">Billing Period</h4>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(selectedInvoice.billingPeriodStart), "MMM dd, yyyy")} - {format(new Date(selectedInvoice.billingPeriodEnd), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-1 text-sm">Due Date</h4>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(selectedInvoice.dueDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-sm">${parseFloat(selectedInvoice.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Tax</span>
                    <span className="text-sm">${parseFloat(selectedInvoice.tax).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">${parseFloat(selectedInvoice.total).toFixed(2)}</span>
                  </div>
                  {calculatePaidAmount(selectedInvoice.id) > 0 && selectedInvoice.status !== "paid" && (
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-muted-foreground">Paid</span>
                      <span className="text-green-600">${calculatePaidAmount(selectedInvoice.id).toFixed(2)}</span>
                    </div>
                  )}
                  {calculatePaidAmount(selectedInvoice.id) > 0 && selectedInvoice.status !== "paid" && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="text-amber-600">${(parseFloat(selectedInvoice.total) - calculatePaidAmount(selectedInvoice.id)).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {selectedInvoice.notes && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-1 text-sm">Notes</h4>
                    <p className="text-xs text-muted-foreground">{selectedInvoice.notes}</p>
                  </div>
                )}

                {selectedInvoice.status !== "paid" && (
                  <Button
                    onClick={() => setShowPaymentForm(true)}
                    className="w-full bg-red-900 text-white hover:bg-red-800 dark:bg-red-950 dark:hover:bg-red-900"
                    data-testid="button-mark-as-paid"
                  >
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          )}
          {selectedInvoice && showPaymentForm && (
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit((data) => createPaymentMutation.mutate({ ...data, invoiceId: selectedInvoice.id }))} className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={paymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              data-testid="input-payment-amount"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Method</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="text-xs h-9" data-testid="select-payment-method">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={paymentForm.control}
                    name="transactionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Transaction ID (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., CHK-12345"
                            {...field}
                            data-testid="input-transaction-id"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paymentForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add payment notes..."
                            {...field}
                            className="text-xs min-h-16"
                            data-testid="textarea-payment-notes"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPaymentForm(false)}
                    data-testid="button-cancel-payment"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPaymentMutation.isPending}
                    className="flex-1"
                    data-testid="button-record-payment"
                  >
                    {createPaymentMutation.isPending ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      "Record Payment"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => {
        if (!open) {
          setInvoiceToDelete(null);
          setDeleteReason("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This invoice will be soft-deleted. The record will be maintained for audit purposes and you can create a copy if needed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deleteReason">Reason for deletion (optional)</Label>
              <Input
                id="deleteReason"
                placeholder="Enter reason for deletion..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (invoiceToDelete) {
                    deleteInvoiceMutation.mutate({ invoiceId: invoiceToDelete, reason: deleteReason || undefined });
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteInvoiceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PaymentsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
    enabled: true,
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await apiRequest("PATCH", `/api/payments/${paymentId}/verify`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Payment Verified",
        description: "The payment has been verified and the invoice status updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Unable to verify payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredPayments = payments?.filter((payment) => {
    if (!payment.invoice) return false;
    
    const invoiceNumber = payment.invoice.invoiceNumber?.toLowerCase() || '';
    const studentName = `${payment.invoice.student?.firstName || ''} ${payment.invoice.student?.lastName || ''}`.toLowerCase();
    const parentName = `${payment.invoice.parent?.firstName || ''} ${payment.invoice.parent?.lastName || ''}`.toLowerCase();
    const parentEmail = payment.invoice.parent?.email?.toLowerCase() || '';
    
    const matchesSearch =
      invoiceNumber.includes(searchQuery.toLowerCase()) ||
      studentName.includes(searchQuery.toLowerCase()) ||
      parentName.includes(searchQuery.toLowerCase()) ||
      parentEmail.includes(searchQuery.toLowerCase());

    const matchesMethod = methodFilter === "all" || payment.paymentMethod === methodFilter;
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const pendingPayments = payments?.filter((p) => p.status === "pending") || [];
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalPayments = payments?.length || 0;
  const totalAmount = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

  const today = new Date();
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthPayments = payments?.filter((p) => new Date(p.paymentDate) >= thisMonthStart) || [];
  const thisMonthAmount = thisMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const lastMonthPayments = payments?.filter((p) => {
    const date = new Date(p.paymentDate);
    return date >= lastMonthStart && date <= lastMonthEnd;
  }) || [];
  const lastMonthAmount = lastMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const paymentMethods = Array.from(new Set(payments?.map((p) => p.paymentMethod).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Payment Management</h2>
        <p className="text-muted-foreground mt-1">Track all payment transactions and revenue</p>
      </div>

      {pendingPayments.length > 0 && (
        <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Clock className="h-5 w-5" />
              Payments Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-amber-800 dark:text-amber-200" data-testid="text-pending-count">
                  {pendingPayments.length}
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Total: ${pendingAmount.toFixed(2)} awaiting verification
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setStatusFilter("pending")}
                className="border-amber-500 text-amber-700 dark:text-amber-300"
                data-testid="button-view-pending"
              >
                View Pending
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-payments">
              {totalPayments}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ${totalAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="text-month-revenue">
              ${thisMonthAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{thisMonthPayments.length} payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Last Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-last-month-revenue">
              ${lastMonthAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{lastMonthPayments.length} payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <CardTitle className="flex-shrink-0">All Payments</CardTitle>
            <div className="flex flex-col md:flex-row gap-3 flex-1 justify-end">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-payments"
                  placeholder="Search by invoice #, student, or parent..."
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[160px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-full md:w-[160px]" data-testid="select-method-filter">
                  <SelectValue placeholder="Filter by method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method.replace("_", " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : filteredPayments && filteredPayments.length > 0 ? (
            <div className="space-y-3">
              {filteredPayments
                .sort((a, b) => {
                  const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
                  const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
                  return dateB - dateA;
                })
                .map((payment) => (
                  <div
                    key={payment.id}
                    data-testid={`payment-${payment.id}`}
                    className={`flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg hover-elevate ${
                      payment.status === 'pending' ? 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Invoice #{payment.invoice?.invoiceNumber || 'N/A'}</span>
                        <Badge 
                          variant={payment.status === 'completed' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}
                          className={payment.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : ''}
                          data-testid={`badge-status-${payment.id}`}
                        >
                          {payment.status === 'pending' ? 'Pending Verification' : payment.status}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        Student: <span className="font-semibold text-foreground">{payment.invoice?.student?.firstName || 'N/A'} {payment.invoice?.student?.lastName || ''}</span>
                      </div>
                      <div className="text-sm">
                        Parent: <span className="font-semibold text-foreground">{payment.invoice?.parent?.firstName || 'N/A'} {payment.invoice?.parent?.lastName || ''}</span> (
                        {payment.invoice?.parent?.email || 'N/A'})
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Fee Plan: {payment.invoice?.feePlan?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Date: {payment.paymentDate ? format(new Date(payment.paymentDate), "MMM dd, yyyy") : 'N/A'}
                      </div>
                      {payment.paymentMethod && (
                        <div className="text-sm text-muted-foreground">
                          Method: {payment.paymentMethod.replace("_", " ").toUpperCase()}
                        </div>
                      )}
                      {payment.transactionId && (
                        <div className="text-sm text-muted-foreground">
                          Transaction ID: {payment.transactionId}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-2xl font-bold text-primary" data-testid={`text-amount-${payment.id}`}>
                        ${parseFloat(payment.amount).toFixed(2)}
                      </div>
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => verifyPaymentMutation.mutate(payment.id)}
                          disabled={verifyPaymentMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          data-testid={`button-verify-${payment.id}`}
                        >
                          {verifyPaymentMutation.isPending ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verify Payment
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || methodFilter !== "all" ? "No Matches Found" : "No Payments Yet"}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || methodFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Payment transactions will appear here once parents make payments"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ReportsTab() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/admin/invoices"],
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const { data: feeAssignments } = useQuery<FeeAssignment[]>({
    queryKey: ["/api/admin/student-fee-assignments"],
  });

  // Filter data based on date range
  const filteredPayments = payments?.filter((p) => {
    if (!startDate && !endDate) return true;
    const paymentDate = new Date(p.paymentDate);
    if (startDate && paymentDate < new Date(startDate)) return false;
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      if (paymentDate > endDateObj) return false;
    }
    return true;
  }) || [];

  const filteredInvoices = invoices?.filter((i) => {
    if (!startDate && !endDate) return true;
    const invoiceDate = new Date(i.dueDate);
    if (startDate && invoiceDate < new Date(startDate)) return false;
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      if (invoiceDate > endDateObj) return false;
    }
    return true;
  }) || [];

  // Calculate financial metrics
  const totalIncome = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  
  const pendingInvoices = filteredInvoices.filter(i => i.status === 'pending' || i.status === 'overdue') || [];
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + parseFloat(i.total), 0);
  
  const paidInvoices = filteredInvoices.filter(i => i.status === 'paid') || [];
  const paidAmount = paidInvoices.reduce((sum, i) => sum + parseFloat(i.total), 0);
  
  const totalInvoiced = filteredInvoices.reduce((sum, i) => sum + parseFloat(i.total), 0) || 0;
  
  const overallProfit = totalIncome;
  const collectionRate = totalInvoiced > 0 ? (totalIncome / totalInvoiced * 100) : 0;

  const today = new Date();
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthInvoices = filteredInvoices.filter(i => new Date(i.dueDate) >= thisMonthStart) || [];
  const thisMonthAmount = thisMonthInvoices.reduce((sum, i) => sum + parseFloat(i.total), 0);

  const activeAssignments = feeAssignments?.filter(a => a.isActive).length || 0;

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Financial Reports</h2>
        <p className="text-muted-foreground mt-1">Insights into profit & loss, income, and payment status</p>
      </div>

      {/* Date Filter */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/[0.02]">
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Quick Filter Buttons and Date Inputs */}
            <div className="flex flex-col md:flex-row gap-2 md:items-end">
              <div className="flex gap-1 flex-wrap">
                <Button 
                  variant={startDate === format(new Date(), "yyyy-MM-dd") && endDate === format(new Date(), "yyyy-MM-dd") ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setStartDate(format(today, "yyyy-MM-dd"));
                    setEndDate(format(today, "yyyy-MM-dd"));
                  }}
                  className="text-xs"
                  data-testid="button-filter-day"
                >
                  Today
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    setStartDate(format(weekAgo, "yyyy-MM-dd"));
                    setEndDate(format(today, "yyyy-MM-dd"));
                  }}
                  className="text-xs"
                  data-testid="button-filter-week"
                >
                  7 Days
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                    setStartDate(format(monthAgo, "yyyy-MM-dd"));
                    setEndDate(format(today, "yyyy-MM-dd"));
                  }}
                  className="text-xs"
                  data-testid="button-filter-month"
                >
                  30 Days
                </Button>
              </div>

              <div className="flex gap-2 md:flex-1 flex-wrap">
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-background h-8 text-xs w-32 md:w-auto"
                  data-testid="input-start-date"
                  placeholder="Start"
                />
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-background h-8 text-xs w-32 md:w-auto"
                  data-testid="input-end-date"
                  placeholder="End"
                />
              </div>

              <div className="flex gap-1 items-center">
                {(startDate || endDate) && (
                  <p className="text-xs text-muted-foreground">
                    {startDate ? `${format(new Date(startDate), "MMM dd")}` : "Start"} → {endDate ? `${format(new Date(endDate), "MMM dd")}` : "End"}
                  </p>
                )}
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8"
                  data-testid="button-clear-filters"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="total-income">
              ${totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From completed payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600" data-testid="pending-payments">
              ${pendingAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{pendingInvoices.length} invoices pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600" data-testid="collection-rate">
              {collectionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Of total invoiced amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <UserPlus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary" data-testid="active-students">
              {activeAssignments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">With active fee assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Revenue Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Total Invoiced</span>
              <span className="font-semibold" data-testid="text-total-invoiced">${totalInvoiced.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Paid Invoices</span>
              <span className="font-semibold text-green-600">${paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Pending/Overdue</span>
              <span className="font-semibold text-amber-600">${pendingAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 bg-muted p-3 rounded-lg">
              <span className="text-sm font-medium">This Month's Invoices</span>
              <span className="font-bold text-primary">${thisMonthAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Invoice Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Total Invoices</span>
              <Badge variant="outline" data-testid="badge-total-invoices">{invoices?.length || 0}</Badge>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Paid</span>
              <Badge variant="default">{paidInvoices.length}</Badge>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Pending</span>
              <Badge variant="secondary">{pendingInvoices.filter(i => i.status === 'pending').length}</Badge>
            </div>
            <div className="flex justify-between items-center pt-2 bg-muted p-3 rounded-lg">
              <span className="text-sm font-medium">Overdue</span>
              <Badge variant="destructive" data-testid="badge-overdue">
                {pendingInvoices.filter(i => i.status === 'overdue').length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Payment Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-950/20 dark:to-green-950/10 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-muted-foreground mb-1">Total Payments Received</p>
              <div className="text-2xl font-bold text-green-600" data-testid="total-payments-received">
                ${totalIncome.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-2" data-testid="filtered-payment-count">{filteredPayments?.length || 0} transactions</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-muted-foreground mb-1">Average Payment</p>
              <div className="text-2xl font-bold text-blue-600">
                ${filteredPayments && filteredPayments.length > 0 ? (totalIncome / filteredPayments.length).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Per transaction</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-950/20 dark:to-amber-950/10 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-muted-foreground mb-1">Outstanding Balance</p>
              <div className="text-2xl font-bold text-amber-600" data-testid="outstanding-balance">
                ${pendingAmount.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Awaiting payment</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryTab() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [historyViewMode, setHistoryViewMode] = useState<"list" | "grid" | "table">(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem("historyViewMode") as "list" | "grid" | "table") || "list";
    }
    return "list";
  });
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

  const handlePresetDate = (preset: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const toDate = new Date(today);
    toDate.setHours(23, 59, 59, 999);
    let fromDate = new Date(today);

    switch (preset) {
      case "today":
        setActivePreset("today");
        setDateFrom(today.toISOString().split('T')[0]);
        setDateTo(toDate.toISOString().split('T')[0]);
        break;
      case "7days":
        fromDate.setDate(fromDate.getDate() - 6);
        setActivePreset("7days");
        setDateFrom(fromDate.toISOString().split('T')[0]);
        setDateTo(toDate.toISOString().split('T')[0]);
        break;
      case "30days":
        fromDate.setDate(fromDate.getDate() - 29);
        setActivePreset("30days");
        setDateFrom(fromDate.toISOString().split('T')[0]);
        setDateTo(toDate.toISOString().split('T')[0]);
        break;
    }
  };

  const handleClearDates = () => {
    setDateFrom("");
    setDateTo("");
    setActivePreset(null);
  };

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/admin/invoices"],
  });

  const paidInvoices = invoices?.filter(i => i.status === "paid") || [];

  const allActivities = [
    ...(payments?.map(p => ({
      id: p.id,
      type: 'payment' as const,
      description: `Payment received: $${parseFloat(p.amount).toFixed(2)}`,
      status: p.status,
      date: p.paymentDate || p.createdAt,
      details: `Method: ${p.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}`,
      fullData: p,
    })) || []),
    ...(paidInvoices.map(i => ({
      id: i.id,
      type: 'invoice' as const,
      description: `Invoice #${i.invoiceNumber} - $${parseFloat(i.total).toFixed(2)}`,
      status: i.status,
      date: i.createdAt,
      details: `Due: ${i.dueDate ? format(new Date(i.dueDate), 'MMM dd, yyyy') : 'N/A'}`,
      fullData: i,
    })) || []),
  ].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const filteredActivities = allActivities.filter(activity => {
    // Type filter
    const typeMatches = typeFilter === "all" || activity.type === typeFilter;
    
    // Date filter
    let dateMatches = true;
    if (activity.date) {
      const activityDate = new Date(activity.date);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        dateMatches = dateMatches && activityDate >= fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        dateMatches = dateMatches && activityDate <= toDate;
      }
    }
    
    return typeMatches && dateMatches;
  });

  const isLoading = paymentsLoading || invoicesLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Activity History</CardTitle>
          <p className="text-sm text-muted-foreground">Complete timeline of all financial transactions and invoices</p>
          
          <div className="flex gap-2 items-center flex-wrap pt-4 p-3 border rounded-lg bg-muted/30">
            <Button
              size="sm"
              variant={activePreset === "today" ? "default" : "secondary"}
              onClick={() => handlePresetDate("today")}
              data-testid="button-preset-today"
              className={activePreset === "today" ? "" : "hover-elevate"}
            >
              Today
            </Button>
            <Button
              size="sm"
              variant={activePreset === "7days" ? "default" : "secondary"}
              onClick={() => handlePresetDate("7days")}
              data-testid="button-preset-7days"
              className={activePreset === "7days" ? "" : "hover-elevate"}
            >
              7 Days
            </Button>
            <Button
              size="sm"
              variant={activePreset === "30days" ? "default" : "secondary"}
              onClick={() => handlePresetDate("30days")}
              data-testid="button-preset-30days"
              className={activePreset === "30days" ? "" : "hover-elevate"}
            >
              30 Days
            </Button>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setActivePreset(null);
              }}
              data-testid="input-history-date-from"
              className="px-3 py-1.5 border rounded-md bg-background text-sm"
              title="From date"
              placeholder="mm/dd/yyyy"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setActivePreset(null);
              }}
              data-testid="input-history-date-to"
              className="px-3 py-1.5 border rounded-md bg-background text-sm"
              title="To date"
              placeholder="mm/dd/yyyy"
            />
            {(dateFrom || dateTo || activePreset) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearDates}
                data-testid="button-clear-date-filter"
                className="h-8 w-8 p-0"
                title="Clear dates"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <div className="ml-auto flex gap-1 border rounded-md p-1">
              <Button
                size="sm"
                variant={historyViewMode === "list" ? "default" : "ghost"}
                onClick={() => {
                  setHistoryViewMode("list");
                  localStorage.setItem("historyViewMode", "list");
                }}
                data-testid="button-history-view-list"
                title="List view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={historyViewMode === "grid" ? "default" : "ghost"}
                onClick={() => {
                  setHistoryViewMode("grid");
                  localStorage.setItem("historyViewMode", "grid");
                }}
                data-testid="button-history-view-grid"
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={historyViewMode === "table" ? "default" : "ghost"}
                onClick={() => {
                  setHistoryViewMode("table");
                  localStorage.setItem("historyViewMode", "table");
                }}
                data-testid="button-history-view-table"
                title="Table view"
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No activity yet</h3>
              <p className="text-muted-foreground">
                {typeFilter === "all" ? "Financial activities will appear here once payments and invoices are created." : `No ${typeFilter}s found.`}
              </p>
            </div>
          ) : (
            <>
              {historyViewMode === "list" && (
                <div className="space-y-3">
                  {filteredActivities.map((activity) => (
                    <div
                      key={`${activity.type}-${activity.id}`}
                      data-testid={`history-${activity.type}-${activity.id}`}
                      className="flex items-center gap-4 p-4 border rounded-lg hover-elevate cursor-pointer"
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <div className={`p-2 rounded-md ${
                        activity.type === 'payment' 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {activity.type === 'payment' ? (
                          <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{activity.description}</div>
                        <div className="text-xs text-muted-foreground">{activity.details}</div>
                        <div className="text-xs text-muted-foreground">
                          {activity.date ? format(new Date(activity.date), 'MMM dd, yyyy h:mm a') : 'N/A'}
                        </div>
                      </div>
                      <Badge 
                        variant={
                          activity.status === 'completed' || activity.status === 'paid' 
                            ? 'default' 
                            : activity.status === 'pending' 
                              ? 'secondary' 
                              : activity.status === 'overdue'
                                ? 'destructive'
                                : 'outline'
                        }
                        className={
                          activity.status === 'pending' 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' 
                            : ''
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              {historyViewMode === "grid" && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredActivities.map((activity) => (
                    <div
                      key={`${activity.type}-${activity.id}`}
                      data-testid={`history-${activity.type}-${activity.id}`}
                      className="p-4 border rounded-lg hover-elevate bg-transparent cursor-pointer"
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-md ${
                          activity.type === 'payment' 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          {activity.type === 'payment' ? (
                            <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <Badge 
                          variant={
                            activity.status === 'completed' || activity.status === 'paid' 
                              ? 'default' 
                              : activity.status === 'pending' 
                                ? 'secondary' 
                                : activity.status === 'overdue'
                                  ? 'destructive'
                                  : 'outline'
                          }
                          className={
                            activity.status === 'pending' 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' 
                              : ''
                          }
                        >
                          {activity.status}
                        </Badge>
                      </div>
                      <div className="font-medium text-sm mb-1">{activity.description}</div>
                      <div className="text-xs text-muted-foreground mb-2">{activity.details}</div>
                      <div className="text-xs text-muted-foreground">
                        {activity.date ? format(new Date(activity.date), 'MMM dd, yyyy h:mm a') : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {historyViewMode === "table" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-3">Type</th>
                        <th className="text-left py-2 px-3">Description</th>
                        <th className="text-left py-2 px-3">Details</th>
                        <th className="text-left py-2 px-3">Date</th>
                        <th className="text-left py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActivities.map((activity) => (
                        <tr
                          key={`${activity.type}-${activity.id}`}
                          data-testid={`history-${activity.type}-${activity.id}`}
                          className="border-b hover-elevate cursor-pointer"
                          onClick={() => setSelectedActivity(activity)}
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {activity.type === 'payment' ? (
                                <Wallet className="w-4 h-4 text-green-600" />
                              ) : (
                                <Receipt className="w-4 h-4 text-blue-600" />
                              )}
                              <span className="capitalize font-medium">{activity.type}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">{activity.description}</td>
                          <td className="py-3 px-3 text-xs text-muted-foreground">{activity.details}</td>
                          <td className="py-3 px-3 text-xs">
                            {activity.date ? format(new Date(activity.date), 'MMM dd, yyyy h:mm a') : 'N/A'}
                          </td>
                          <td className="py-3 px-3">
                            <Badge 
                              variant={
                                activity.status === 'completed' || activity.status === 'paid' 
                                  ? 'default' 
                                  : activity.status === 'pending' 
                                    ? 'secondary' 
                                    : activity.status === 'overdue'
                                      ? 'destructive'
                                      : 'outline'
                              }
                              className={
                                activity.status === 'pending' 
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' 
                                  : ''
                              }
                            >
                              {activity.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Activity Details Modal */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedActivity?.type === 'payment' ? 'Payment Details' : 'Invoice Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              {selectedActivity.type === 'invoice' && selectedActivity.fullData && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Invoice Number</p>
                      <p className="font-semibold">{selectedActivity.fullData.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <Badge variant={
                        selectedActivity.fullData.status === 'paid' ? 'default' : 
                        selectedActivity.fullData.status === 'overdue' ? 'destructive' : 'secondary'
                      }>
                        {selectedActivity.fullData.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Student</p>
                    <p className="font-medium">
                      {selectedActivity.fullData.student?.firstName} {selectedActivity.fullData.student?.lastName}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                      <p className="font-semibold text-lg">${parseFloat(selectedActivity.fullData.total).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Fee Plan</p>
                      <p className="font-medium">{selectedActivity.fullData.feePlan?.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Billing Period Start</p>
                      <p className="font-medium">{format(new Date(selectedActivity.fullData.billingPeriodStart), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Billing Period End</p>
                      <p className="font-medium">{format(new Date(selectedActivity.fullData.billingPeriodEnd), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                      <p className="font-medium">{format(new Date(selectedActivity.fullData.dueDate), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Created Date</p>
                      <p className="font-medium">{format(new Date(selectedActivity.fullData.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </>
              )}
              {selectedActivity.type === 'payment' && selectedActivity.fullData && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Invoice Number</p>
                      <p className="font-semibold">{selectedActivity.fullData.invoice?.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <Badge variant={
                        selectedActivity.fullData.status === 'completed' ? 'default' : 
                        selectedActivity.fullData.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {selectedActivity.fullData.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Student</p>
                    <p className="font-medium">
                      {selectedActivity.fullData.invoice?.student?.firstName} {selectedActivity.fullData.invoice?.student?.lastName}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Payment Amount</p>
                      <p className="font-semibold text-lg text-green-600">${parseFloat(selectedActivity.fullData.amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                      <p className="font-medium">{selectedActivity.fullData.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Payment Date</p>
                      <p className="font-medium">{format(new Date(selectedActivity.fullData.paymentDate || selectedActivity.fullData.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Fee Plan</p>
                      <p className="font-medium">{selectedActivity.fullData.invoice?.feePlan?.name}</p>
                    </div>
                  </div>
                  {selectedActivity.fullData.transactionId && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
                      <p className="font-mono text-sm">{selectedActivity.fullData.transactionId}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FinancialManagementContent({ adminId }: FinancialReportsProps) {
  const [activeTab, setActiveTab] = useState("assignments");

  const { data: feeAssignments = [], isLoading: assignmentsLoading } = useQuery<FeeAssignment[]>({
    queryKey: ["/api/admin/student-fee-assignments"],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/admin/invoices"],
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const isLoading = assignmentsLoading || invoicesLoading || paymentsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="bg-gradient-to-r from-[#1F3A5F]/10 via-[#1F3A5F]/5 to-[#2a4a75]/5 relative overflow-hidden border-b border-[#1F3A5F]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
            <Skeleton className="h-8 w-48 bg-[#1F3A5F]/10 dark:bg-white/20 mb-2" />
            <Skeleton className="h-4 w-32 bg-[#1F3A5F]/5 dark:bg-white/10" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-16 mb-3" />
                  <Skeleton className="h-8 w-12 mb-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" data-testid="financial-reports-page">
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
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#1F3A5F]/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white">Financial Management</h1>
              </div>
              <p className="text-[#1F3A5F]/60 dark:text-white/60 text-sm sm:text-base font-medium">Manage fees, invoices, payments, and financial reporting</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-[#1F3A5F]/10 border-[#1F3A5F]/20 text-[#1F3A5F] hover:bg-[#1F3A5F]/20 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20">
                <Download className="w-4 h-4 mr-2" />
                Export Reports
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20 flex-wrap" data-testid="financial-tabs">
            <TabsTrigger 
              value="assignments" 
              data-testid="tab-assignments"
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="fee-plans" 
              data-testid="tab-fee-plans"
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Fee Plans
            </TabsTrigger>
            <TabsTrigger 
              value="discounts" 
              data-testid="tab-discounts"
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Tag className="w-4 h-4" />
              Discounts
            </TabsTrigger>
            <TabsTrigger 
              value="invoices" 
              data-testid="tab-invoices"
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              data-testid="tab-payments"
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              data-testid="tab-history"
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fee-plans" className="mt-6">
            {activeTab === "fee-plans" && <FeePlansTab />}
          </TabsContent>

          <TabsContent value="discounts" className="mt-6">
            {activeTab === "discounts" && <DiscountsTab />}
          </TabsContent>


          <TabsContent value="assignments" className="mt-6">
            {activeTab === "assignments" && <AssignmentsTab />}
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            {activeTab === "invoices" && <InvoicesTab />}
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            {activeTab === "payments" && <PaymentsTab />}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {activeTab === "history" && <HistoryTab />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function FinancialReports({ adminId }: FinancialReportsProps) {
  return <FinancialManagementContent adminId={adminId} />;
}
