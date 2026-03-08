import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Search, DollarSign, TrendingUp, Receipt, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface FinancePaymentsProps {
  financeAdminId: string;
}

interface Payment {
  id: string;
  invoiceId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string | null;
  transactionId: string | null;
  status: string;
  notes: string | null;
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

export default function FinancePayments({ financeAdminId }: FinancePaymentsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const filteredPayments = payments.filter(payment => {
    const studentName = `${payment.invoice?.student?.firstName || ''} ${payment.invoice?.student?.lastName || ''}`.toLowerCase();
    const parentName = `${payment.invoice?.parent?.firstName || ''} ${payment.invoice?.parent?.lastName || ''}`.toLowerCase();
    const matchesSearch = searchQuery === "" || 
      studentName.includes(searchQuery.toLowerCase()) ||
      parentName.includes(searchQuery.toLowerCase()) ||
      payment.invoice?.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesMethod = methodFilter === "all" || payment.paymentMethod === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
  const completedPayments = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
  const pendingPayments = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500 text-white">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-primary" />
          Payments
        </h1>
        <p className="text-muted-foreground mt-1">Track and manage all payment transactions</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Total Payments</span>
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary" data-testid="stat-total">
              ${totalPayments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{payments.length} transactions</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Completed</span>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary" data-testid="stat-completed">
              ${completedPayments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Successfully processed</p>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Pending</span>
              <div className="p-2 rounded-lg bg-secondary/10">
                <Receipt className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-secondary" data-testid="stat-pending">
              ${pendingPayments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Failed</span>
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="w-4 h-4 text-destructive" />
              </div>
            </div>
            <div className="text-3xl font-bold text-destructive" data-testid="stat-failed">
              {payments.filter(p => p.status === 'failed').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Failed transactions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by student, parent, invoice or transaction ID..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-payments"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-method-filter">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                    <TableCell className="font-medium">
                      {payment.invoice?.invoiceNumber || '-'}
                    </TableCell>
                    <TableCell>
                      {payment.invoice?.student?.firstName} {payment.invoice?.student?.lastName}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{payment.invoice?.parent?.firstName} {payment.invoice?.parent?.lastName}</div>
                        <div className="text-xs text-muted-foreground">{payment.invoice?.parent?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      ${parseFloat(payment.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.paymentMethod?.replace('_', ' ') || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.paymentDate ? format(new Date(payment.paymentDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status || 'pending')}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                      <p className="text-muted-foreground">No payments found matching your criteria</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
