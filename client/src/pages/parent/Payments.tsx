import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CreditCard, Download, Calendar, DollarSign, Receipt, AlertCircle, Wallet, FileText, CheckCircle, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ParentPaymentsProps {
  parentId: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  parentId: string;
  feePlanId: string;
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
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  verifiedAt: string | null;
  invoice: {
    invoiceNumber: string;
    student: {
      firstName: string | null;
      lastName: string | null;
    };
  };
}

export default function ParentPayments({ parentId }: ParentPaymentsProps) {
  const { toast } = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/parent/invoices"],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/parent/payments"],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });

  const paymentMutation = useMutation({
    mutationFn: async ({ invoiceId, amount, method }: { invoiceId: string; amount: string; method: string }) => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          amount,
          paymentMethod: method,
          paymentDate: new Date().toISOString().split("T")[0],
          notes: "Payment submitted via parent portal",
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process payment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent/payments"] });
      setSelectedInvoice(null);
      setPaymentAmount("");
      toast({
        title: "Payment Submitted",
        description: "Your payment has been submitted and is pending verification by the finance team.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    if (!selectedInvoice) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    paymentMutation.mutate({
      invoiceId: selectedInvoice.id,
      amount: paymentAmount,
      method: paymentMethod,
    });
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    
    const existingPayments = payments?.filter((p) => p.invoiceId === invoice.id) || [];
    const totalPaid = existingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const remainingBalance = parseFloat(invoice.total) - totalPaid;
    
    setPaymentAmount(remainingBalance.toFixed(2));
  };

  const handleViewInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoiceForDetails(invoice);
  };

  const calculateRemainingBalance = (invoice: Invoice) => {
    const existingPayments = payments?.filter((p) => p.invoiceId === invoice.id) || [];
    const totalPaid = existingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    return parseFloat(invoice.total) - totalPaid;
  };

  if (invoicesLoading || paymentsLoading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const pendingInvoices = invoices?.filter((inv) => inv.status === "pending" || inv.status === "partial") || [];
  const overdueInvoices = invoices?.filter((inv) => inv.status === "overdue") || [];
  const paidInvoices = invoices?.filter((inv) => inv.status === "paid") || [];
  
  const totalOwed = pendingInvoices.reduce((sum, inv) => sum + calculateRemainingBalance(inv), 0);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + calculateRemainingBalance(inv), 0);
  const totalPaid = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto" data-testid="parent-payments-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payments & Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Manage your student fees and payment history
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className={totalOwed > 0 ? "border-destructive/30" : "border-primary/30"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Total Due</span>
              <div className={`p-2 rounded-lg ${totalOwed > 0 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                <DollarSign className={`w-4 h-4 ${totalOwed > 0 ? 'text-destructive' : 'text-primary'}`} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${totalOwed > 0 ? 'text-destructive' : 'text-primary'}`} data-testid="stat-total-due">
              ${totalOwed.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className={overdueAmount > 0 ? "border-destructive/30" : "border-secondary/20"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Overdue</span>
              <div className={`p-2 rounded-lg ${overdueAmount > 0 ? 'bg-destructive/10' : 'bg-secondary/10'}`}>
                <AlertCircle className={`w-4 h-4 ${overdueAmount > 0 ? 'text-destructive' : 'text-secondary'}`} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${overdueAmount > 0 ? 'text-destructive' : 'text-secondary'}`} data-testid="stat-overdue-amount">
              ${overdueAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Pending Invoices</span>
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary" data-testid="stat-pending-invoices">{pendingInvoices.length}</div>
          </CardContent>
        </Card>
        <Card className="border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Total Paid</span>
              <div className="p-2 rounded-lg bg-secondary/10">
                <CheckCircle className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-secondary" data-testid="stat-total-paid">${totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {overdueInvoices.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span>Overdue Invoices - Immediate Action Required</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueInvoices.map((invoice) => {
                const remaining = calculateRemainingBalance(invoice);
                return (
                  <div 
                    key={invoice.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-destructive/5 rounded-lg border border-destructive/20"
                    data-testid={`overdue-invoice-${invoice.id}`}
                  >
                    <div className="flex-1">
                      <div className="font-semibold">Invoice #{invoice.invoiceNumber}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {invoice.student ? `${invoice.student.firstName} ${invoice.student.lastName}` : 'Unknown'} - {invoice.feePlan ? invoice.feePlan.name : 'Unknown'}
                      </div>
                      <div className="text-sm text-destructive mt-1">
                        Due: {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM dd, yyyy") : "N/A"}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-destructive">
                          ${remaining.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">remaining</div>
                      </div>
                      <Button 
                        variant="destructive"
                        onClick={() => handlePayInvoice(invoice)}
                        data-testid={`button-pay-overdue-${invoice.id}`}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Now
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20 flex-wrap">
          <TabsTrigger 
            value="invoices" 
            data-testid="tab-invoices"
            className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger 
            value="payments" 
            data-testid="tab-payments"
            className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            Payment History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                All Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices && invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices
                    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
                    .map((invoice) => {
                      const remaining = calculateRemainingBalance(invoice);
                      return (
                        <div
                          key={invoice.id}
                          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border rounded-lg hover-elevate cursor-pointer"
                          data-testid={`invoice-${invoice.id}`}
                          onClick={() => handleViewInvoiceDetails(invoice)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">#{invoice.invoiceNumber}</span>
                              <Badge 
                                variant={invoice.status === "paid" ? "default" : invoice.status === "overdue" ? "destructive" : "secondary"}
                                data-testid={`badge-status-${invoice.id}`}
                              >
                                {invoice.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {invoice.student ? `${invoice.student.firstName} ${invoice.student.lastName}` : 'Unknown'} - {invoice.feePlan ? invoice.feePlan.name : 'Unknown'}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Period: {invoice.billingPeriodStart ? format(new Date(invoice.billingPeriodStart), "MMM dd") : "N/A"} - {invoice.billingPeriodEnd ? format(new Date(invoice.billingPeriodEnd), "MMM dd, yyyy") : "N/A"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Due: {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM dd, yyyy") : "N/A"}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold">${parseFloat(invoice.total).toFixed(2)}</div>
                              {invoice.status !== "paid" && remaining < parseFloat(invoice.total) && (
                                <div className="text-sm text-muted-foreground">${remaining.toFixed(2)} remaining</div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {invoice.status !== "paid" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePayInvoice(invoice)}
                                  data-testid={`button-pay-${invoice.id}`}
                                >
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Pay
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-view-${invoice.id}`}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Invoices Yet</h3>
                  <p className="text-muted-foreground">
                    Invoices will appear here once they are generated for your students.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <div className="space-y-3">
                  {payments
                    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border rounded-lg ${
                          payment.status === 'pending' ? 'border-amber-300 dark:border-amber-700' : ''
                        }`}
                        data-testid={`payment-${payment.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">Invoice #{payment.invoice?.invoiceNumber || 'N/A'}</span>
                            <Badge 
                              variant={payment.status === 'completed' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}
                              className={payment.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : ''}
                              data-testid={`badge-payment-status-${payment.id}`}
                            >
                              {payment.status === 'pending' ? 'Pending Verification' : payment.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.invoice?.student ? `${payment.invoice.student.firstName} ${payment.invoice.student.lastName}` : 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Submitted: {payment.paymentDate ? format(new Date(payment.paymentDate), "MMM dd, yyyy") : "N/A"}
                          </div>
                          {payment.verifiedAt && (
                            <div className="text-sm text-muted-foreground">
                              Verified: {format(new Date(payment.verifiedAt), "MMM dd, yyyy")}
                            </div>
                          )}
                          {payment.paymentMethod && (
                            <div className="text-sm text-muted-foreground">
                              Method: {payment.paymentMethod.replace("_", " ").toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`text-2xl font-bold ${payment.status === 'completed' ? 'text-primary' : 'text-amber-600 dark:text-amber-400'}`}>
                            ${parseFloat(payment.amount).toFixed(2)}
                          </div>
                          {payment.status === 'completed' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-receipt-${payment.id}`}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Receipt
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Payments Yet</h3>
                  <p className="text-muted-foreground">
                    Your payment history will appear here once you make payments.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedInvoiceForDetails} onOpenChange={(open) => !open && setSelectedInvoiceForDetails(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Invoice #{selectedInvoiceForDetails?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoiceForDetails && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Student:</span>
                  <span className="font-semibold">
                    {selectedInvoiceForDetails.student ? `${selectedInvoiceForDetails.student.firstName} ${selectedInvoiceForDetails.student.lastName}` : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fee Plan:</span>
                  <span className="font-semibold">{selectedInvoiceForDetails.feePlan ? selectedInvoiceForDetails.feePlan.name : 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={selectedInvoiceForDetails.status === "paid" ? "default" : selectedInvoiceForDetails.status === "overdue" ? "destructive" : "secondary"}>
                    {selectedInvoiceForDetails.status}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold">Billing Period</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span>{selectedInvoiceForDetails.billingPeriodStart ? format(new Date(selectedInvoiceForDetails.billingPeriodStart), "MMM dd, yyyy") : "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">End Date:</span>
                  <span>{selectedInvoiceForDetails.billingPeriodEnd ? format(new Date(selectedInvoiceForDetails.billingPeriodEnd), "MMM dd, yyyy") : "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className={selectedInvoiceForDetails.status === "overdue" ? "text-destructive font-semibold" : ""}>{selectedInvoiceForDetails.dueDate ? format(new Date(selectedInvoiceForDetails.dueDate), "MMM dd, yyyy") : "N/A"}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3 bg-muted/30 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${parseFloat(selectedInvoiceForDetails.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>${parseFloat(selectedInvoiceForDetails.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total:</span>
                  <span>${parseFloat(selectedInvoiceForDetails.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="text-secondary">${(parseFloat(selectedInvoiceForDetails.total) - calculateRemainingBalance(selectedInvoiceForDetails)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Remaining:</span>
                  <span className="text-primary font-semibold">${calculateRemainingBalance(selectedInvoiceForDetails).toFixed(2)}</span>
                </div>
              </div>

              {selectedInvoiceForDetails.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedInvoiceForDetails.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedInvoiceForDetails(null)}>
              Close
            </Button>
            {selectedInvoiceForDetails && selectedInvoiceForDetails.status !== "paid" && (
              <Button onClick={() => {
                handlePayInvoice(selectedInvoiceForDetails);
                setSelectedInvoiceForDetails(null);
              }}>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Payment</DialogTitle>
            <DialogDescription>
              Make a payment for Invoice #{selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Student:</span>
                  <span className="font-semibold">
                    {selectedInvoice.student ? `${selectedInvoice.student.firstName} ${selectedInvoice.student.lastName}` : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fee Plan:</span>
                  <span className="font-semibold">{selectedInvoice.feePlan ? selectedInvoice.feePlan.name : 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount:</span>
                  <span className="font-semibold">${parseFloat(selectedInvoice.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount Remaining:</span>
                  <span className="font-semibold text-primary">
                    ${calculateRemainingBalance(selectedInvoice).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Payment Amount</Label>
                <Input
                  id="payment-amount"
                  data-testid="input-payment-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <select
                  id="payment-method"
                  data-testid="select-payment-method"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="online">Online Payment</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm text-amber-900 dark:text-amber-200">
                <strong>Note:</strong> After submitting, your payment will be reviewed and verified by our finance team. You will receive a notification once the payment is confirmed.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedInvoice(null)}
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={paymentMutation.isPending}
              data-testid="button-submit-payment"
            >
              {paymentMutation.isPending ? "Processing..." : "Submit Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
