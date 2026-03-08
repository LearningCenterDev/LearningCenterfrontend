import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, X, DollarSign, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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
}

export default function AdminInvoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/admin/invoices"],
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const calculatePaidAmount = (invoiceId: string) => {
    if (!payments) return 0;
    return payments
      .filter((p) => p.invoiceId === invoiceId)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  };

  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${invoice.student.firstName} ${invoice.student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${invoice.parent.firstName} ${invoice.parent.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalInvoices = invoices?.length || 0;
  const pendingInvoices = invoices?.filter((i) => i.status === "pending" || i.status === "partial").length || 0;
  const overdueInvoices = invoices?.filter((i) => i.status === "overdue").length || 0;
  const paidInvoices = invoices?.filter((i) => i.status === "paid").length || 0;
  const totalRevenue = invoices?.reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0;
  const totalCollected = invoices?.filter((i) => i.status === "paid").reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
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
            <Clock className="h-4 w-4 text-muted-foreground" />
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
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-collected-amount">${totalCollected.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{paidInvoices} paid invoices</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <CardTitle className="flex-shrink-0">All Invoices</CardTitle>
            <div className="flex flex-col md:flex-row gap-3 flex-1">
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
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
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
          ) : filteredInvoices && filteredInvoices.length > 0 ? (
            <div className="space-y-3">
              {filteredInvoices
                .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
                .map((invoice) => {
                  const paidAmount = calculatePaidAmount(invoice.id);
                  const remainingAmount = parseFloat(invoice.total) - paidAmount;
                  return (
                    <div
                      key={invoice.id}
                      data-testid={`invoice-${invoice.id}`}
                      className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg hover-elevate"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">#{invoice.invoiceNumber}</span>
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
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Student: {invoice.student.firstName} {invoice.student.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Parent: {invoice.parent.firstName} {invoice.parent.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.feePlan.name} - {invoice.feePlan.billingCycle}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Period: {format(new Date(invoice.billingPeriodStart), "MMM dd")} -{" "}
                          {format(new Date(invoice.billingPeriodEnd), "MMM dd, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Due: {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                        </div>
                      </div>
                      <div className="text-right">
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
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || statusFilter !== "all" ? "No Matches Found" : "No Invoices Yet"}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Invoices will appear here once they are generated"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
