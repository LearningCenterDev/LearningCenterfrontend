import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Search, X, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Payment {
  id: string;
  invoiceId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string | null;
  transactionId: string | null;
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

export default function AdminPayments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const filteredPayments = payments?.filter((payment) => {
    const matchesSearch =
      payment.invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${payment.invoice.student.firstName} ${payment.invoice.student.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      `${payment.invoice.parent.firstName} ${payment.invoice.parent.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      payment.invoice.parent.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMethod = methodFilter === "all" || payment.paymentMethod === methodFilter;

    return matchesSearch && matchesMethod;
  });

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
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
        <p className="text-muted-foreground mt-1">Track all payment transactions and revenue</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
            <div className="flex flex-col md:flex-row gap-3 flex-1">
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
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-full md:w-[200px]" data-testid="select-method-filter">
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
                .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                .map((payment) => (
                  <div
                    key={payment.id}
                    data-testid={`payment-${payment.id}`}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg hover-elevate"
                  >
                    <div className="flex-1">
                      <div className="font-semibold mb-1">Invoice #{payment.invoice.invoiceNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        Student: {payment.invoice.student.firstName} {payment.invoice.student.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Parent: {payment.invoice.parent.firstName} {payment.invoice.parent.lastName} (
                        {payment.invoice.parent.email})
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Fee Plan: {payment.invoice.feePlan.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Date: {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
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
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary" data-testid={`text-amount-${payment.id}`}>
                        ${parseFloat(payment.amount).toFixed(2)}
                      </div>
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
