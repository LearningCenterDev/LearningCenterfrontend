import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock as ClockComponent } from "./Clock";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Invoice, Payment } from "@shared/schema";
import { 
  DollarSign,
  MessageCircle,
  Send,
  UserPlus,
  TrendingUp,
  Receipt,
  FileText,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  GraduationCap
} from "lucide-react";

interface FinanceAdminDashboardProps {
  financeAdminId: string;
  financeAdminName: string;
}

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
}

export function FinanceAdminDashboard({ financeAdminId }: FinanceAdminDashboardProps) {
  const [, navigate] = useLocation();

  const { data: financialStats, isLoading: statsLoading } = useQuery<FinancialStats>({
    queryKey: ["/api/finance-admin/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/admin/invoices"],
    refetchInterval: 30000,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
    refetchInterval: 30000,
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery<{ sent: any[]; received: any[] }>({
    queryKey: ["/api/users", financeAdminId, "messages"],
    refetchInterval: 15000, // Messages more frequent
  });

  const { data: prospectStudents = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/prospect-students"],
    refetchInterval: 60000,
  });

  const receivedMessages = messagesData?.received || [];
  const unreadMessagesCount = receivedMessages.filter(msg => !msg.isRead).length;
  const newProspects = prospectStudents.filter(p => p.status === 'new').length;

  const isLoading = statsLoading || invoicesLoading || paymentsLoading;

  const recentInvoices = invoices
    .filter(inv => inv.status !== 'cancelled')
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  const recentPayments = payments
    .filter(p => p.status === 'completed')
    .sort((a, b) => new Date(b.paidAt || b.createdAt || 0).getTime() - new Date(a.paidAt || a.createdAt || 0).getTime())
    .slice(0, 5);

  const overdueInvoices = invoices.filter(inv => 
    inv.status === 'overdue' || 
    (inv.status === 'pending' && inv.dueDate && new Date(inv.dueDate) < new Date())
  );

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numAmount);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" data-testid="finance-admin-dashboard">
      {/* Stats Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-[1fr_auto] gap-3 items-stretch">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-6 w-10" />
                </div>
              ))
            ) : (
              <>
                <div className="px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[#1F3A5F] dark:text-blue-400" />
                    <span className="text-xs text-muted-foreground">Revenue</span>
                  </div>
                  <span className="text-xl font-bold text-[#1F3A5F] dark:text-white" data-testid="stat-total-revenue">${(financialStats?.totalRevenue || 0).toLocaleString()}</span>
                </div>

                <div className="px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-[#1F3A5F] dark:text-blue-400" />
                    <span className="text-xs text-muted-foreground">Monthly</span>
                  </div>
                  <span className="text-xl font-bold text-[#1F3A5F] dark:text-white" data-testid="stat-monthly-revenue">${(financialStats?.monthlyRevenue || 0).toLocaleString()}</span>
                </div>

                <div className="px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#1F3A5F] dark:text-blue-400" />
                    <span className="text-xs text-muted-foreground">Pending</span>
                  </div>
                  <span className="text-xl font-bold text-[#1F3A5F] dark:text-white" data-testid="stat-pending-payments">${(financialStats?.pendingPayments || 0).toLocaleString()}</span>
                </div>

                <div 
                  className="px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer"
                  onClick={() => navigate('/messages')}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageCircle className="w-3.5 h-3.5 text-[#1F3A5F] dark:text-blue-400" />
                    <span className="text-xs text-muted-foreground">Messages</span>
                  </div>
                  <span className={`text-xl font-bold ${unreadMessagesCount > 0 ? 'text-destructive' : 'text-[#1F3A5F] dark:text-white'}`} data-testid="stat-unread-messages">
                    {messagesLoading ? '...' : unreadMessagesCount}
                  </span>
                </div>
              </>
            )}
          </div>
          <ClockComponent />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

      {newProspects > 0 && (
        <Card 
          className="border-primary/30 cursor-pointer transition-colors hover:bg-primary/5"
          onClick={() => navigate('/prospect-students')}
          data-testid="prospect-alert"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">New Prospect Students</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {newProspects} new {newProspects === 1 ? 'inquiry' : 'inquiries'} requiring attention
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-lg px-4 py-2">
                  {newProspects} New
                </Badge>
                <Button variant="default" data-testid="button-view-prospects">
                  View Prospects
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {overdueInvoices.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Overdue Invoices Alert
              <Badge variant="destructive" className="ml-2">{overdueInvoices.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueInvoices.slice(0, 3).map((invoice) => (
                <div 
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/20"
                >
                  <div>
                    <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">Due: {formatDate(invoice.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">{formatCurrency(Number(invoice.total))}</p>
                  </div>
                </div>
              ))}
              {overdueInvoices.length > 3 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-destructive" 
                  onClick={() => navigate('/invoices')}
                >
                  View All {overdueInvoices.length} Overdue Invoices
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Recent Invoices
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} data-testid="button-view-all-invoices">
              View All
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoicesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))
            ) : recentInvoices.length > 0 ? (
              recentInvoices.map((invoice) => (
                <div 
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                  data-testid={`invoice-${invoice.id}`}
                >
                  <div>
                    <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(Number(invoice.total))}</span>
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No invoices yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Recent Payments
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/finance-payments')} data-testid="button-view-all-payments">
              View All
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))
            ) : recentPayments.length > 0 ? (
              recentPayments.map((payment) => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                  data-testid={`payment-${payment.id}`}
                >
                  <div>
                    <p className="font-medium">{payment.paymentMethod ? payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1) : 'Unknown'} Payment</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(payment.paidAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-green-600">+{formatCurrency(Number(payment.amount))}</span>
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Received
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No payments recorded</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/finances')}
              data-testid="button-financial-reports"
            >
              <DollarSign className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Financial Reports</div>
                <div className="text-xs text-muted-foreground">View all reports</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/invoices')}
              data-testid="button-invoices"
            >
              <FileText className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Invoices</div>
                <div className="text-xs text-muted-foreground">Manage invoices</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/finance-payments')}
              data-testid="button-payments"
            >
              <CreditCard className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Payments</div>
                <div className="text-xs text-muted-foreground">Track payments</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/teacher-session-stats')}
              data-testid="button-teacher-sessions"
            >
              <GraduationCap className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Teacher Sessions</div>
                <div className="text-xs text-muted-foreground">Class counts</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/prospect-students')}
              data-testid="button-prospects"
            >
              <UserPlus className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Prospects</div>
                <div className="text-xs text-muted-foreground">View inquiries</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

export default FinanceAdminDashboard;
