import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, XCircle, ShieldCheck, Mail, List, Grid3x3, ArrowUpDown, ArrowUp, ArrowDown, Table as TableIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { PasswordResetRequest } from "@shared/schema";

interface PasswordResetRequestWithUser extends PasswordResetRequest {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
  } | null;
}

export default function PasswordResetRequests() {
  const { toast } = useToast();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequestWithUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid" | "table">("list");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc" | null>(null);

  const { data: requests, isLoading } = useQuery<PasswordResetRequestWithUser[]>({
    queryKey: ["/api/admin/password-reset-requests"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      return await apiRequest("POST", `/api/admin/password-reset-requests/${id}/approve`, { newPassword });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/password-reset-requests"] });
      toast({
        title: "Password Reset Approved",
        description: "The user's password has been reset successfully.",
      });
      setApproveDialogOpen(false);
      setSelectedRequest(null);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: string; rejectionReason: string }) => {
      return await apiRequest("POST", `/api/admin/password-reset-requests/${id}/reject`, { rejectionReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/password-reset-requests"] });
      toast({
        title: "Request Rejected",
        description: "The password reset request has been rejected.",
      });
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (request: PasswordResetRequestWithUser) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const handleReject = (request: PasswordResetRequestWithUser) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const handleConfirmApprove = () => {
    if (!selectedRequest || !newPassword || newPassword.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    approveMutation.mutate({ id: selectedRequest.id, newPassword });
  };

  const handleConfirmReject = () => {
    if (!selectedRequest) return;
    rejectMutation.mutate({ id: selectedRequest.id, rejectionReason });
  };

  const pendingRequests = requests?.filter((r) => r.status === "pending") || [];
  const processedRequests = (() => {
    const filtered = requests?.filter((r) => r.status !== "pending") || [];
    if (!sortOrder) return filtered;
    return filtered.sort((a, b) => {
      const dateA = new Date(a.handledAt || 0).getTime();
      const dateB = new Date(b.handledAt || 0).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  })();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-3 h-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading password reset requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-[#1F3A5F]/10 backdrop-blur-sm">
                  <ShieldCheck className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white" data-testid="text-page-title">Password Reset Requests</h1>
              </div>
              <p className="text-[#1F3A5F]/60 dark:text-white/60 text-sm sm:text-base font-medium">Review and manage password reset requests from users</p>
            </div>
            <div className="flex items-center gap-2 bg-[#1F3A5F]/10 dark:bg-white/10 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-[#1F3A5F] dark:text-[#2FBF71]" />
              <span className="text-sm font-medium text-[#1F3A5F] dark:text-white">{pendingRequests.length} Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {pendingRequests.length === 0 && processedRequests.length === 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1F3A5F]/10 to-[#2FBF71]/10 rounded-2xl flex items-center justify-center mb-5">
              <Mail className="w-10 h-10 text-[#1F3A5F] dark:text-[#2FBF71]" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">No Password Reset Requests</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              There are currently no password reset requests to review.
            </p>
          </CardContent>
        </Card>
      )}

      {pendingRequests.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Pending Requests</CardTitle>
                <CardDescription className="text-sm">
                  Review and approve or reject these password reset requests
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm transition-all hover:shadow-md hover:border-[#1F3A5F]/30 dark:hover:border-[#2FBF71]/30"
                data-testid={`card-request-${request.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                      {request.user?.firstName} {request.user?.lastName}
                    </h4>
                    <Badge variant="outline" className="text-xs">{request.user?.role}</Badge>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#1F3A5F] dark:text-[#2FBF71]" />
                    <span className="truncate">{request.user?.email}</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#1F3A5F] dark:text-[#2FBF71]" />
                    Requested {request.requestedAt ? formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true }) : 'Unknown'}
                  </p>
                  {request.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                      Note: {request.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(request)}
                    className="flex-1 sm:flex-none bg-[#2FBF71] hover:bg-[#25a060] text-white"
                    data-testid={`button-approve-${request.id}`}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(request)}
                    className="flex-1 sm:flex-none"
                    data-testid={`button-reject-${request.id}`}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {processedRequests.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] shadow-md">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Processed Requests</CardTitle>
                  <CardDescription className="text-sm">
                    History of approved and rejected password reset requests
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <Button
                  size="icon"
                  variant={sortOrder ? "default" : "ghost"}
                  onClick={() => setSortOrder(sortOrder === null ? "desc" : sortOrder === "desc" ? "asc" : null)}
                  className={`h-8 w-8 ${sortOrder ? 'bg-[#1F3A5F] hover:bg-[#1F3A5F]/90' : ''}`}
                  data-testid="button-sort-date"
                  title={sortOrder === "desc" ? "Newest first" : sortOrder === "asc" ? "Oldest first" : "Default order"}
                >
                  {sortOrder === "desc" ? <ArrowDown className="w-4 h-4" /> : sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowUpDown className="w-4 h-4" />}
                </Button>
                <div className="w-px h-5 bg-slate-300 dark:bg-slate-600" />
                <Button
                  size="icon"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  onClick={() => setViewMode("list")}
                  className={`h-8 w-8 ${viewMode === 'list' ? 'bg-[#1F3A5F] hover:bg-[#1F3A5F]/90' : ''}`}
                  data-testid="button-view-list"
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  onClick={() => setViewMode("grid")}
                  className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-[#1F3A5F] hover:bg-[#1F3A5F]/90' : ''}`}
                  data-testid="button-view-grid"
                  title="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant={viewMode === "table" ? "default" : "ghost"}
                  onClick={() => setViewMode("table")}
                  className={`h-8 w-8 hidden sm:flex ${viewMode === 'table' ? 'bg-[#1F3A5F] hover:bg-[#1F3A5F]/90' : ''}`}
                  data-testid="button-view-table"
                  title="Table view"
                >
                  <TableIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {viewMode === "table" ? (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left p-3 font-medium text-sm text-slate-600 dark:text-slate-300">Name</th>
                      <th className="text-left p-3 font-medium text-sm text-slate-600 dark:text-slate-300">Email</th>
                      <th className="text-left p-3 font-medium text-sm text-slate-600 dark:text-slate-300">Role</th>
                      <th className="text-left p-3 font-medium text-sm text-slate-600 dark:text-slate-300">Status</th>
                      <th className="text-left p-3 font-medium text-sm text-slate-600 dark:text-slate-300">Processed Date</th>
                      <th className="text-left p-3 font-medium text-sm text-slate-600 dark:text-slate-300">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedRequests.map((request, idx) => (
                      <tr
                        key={request.id}
                        className={`border-b border-slate-100 dark:border-slate-700/50 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}
                        data-testid={`card-processed-request-${request.id}`}
                      >
                        <td className="p-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                          {request.user?.firstName} {request.user?.lastName}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {request.user?.email}
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant="outline" className="text-xs">{request.user?.role}</Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {request.handledAt ? formatDistanceToNow(new Date(request.handledAt), { addSuffix: true }) : "N/A"}
                        </td>
                        <td className="p-3 text-sm">
                          <span className={request.rejectionReason ? 'text-destructive' : 'text-[#2FBF71]'}>
                            {request.rejectionReason ? `Rejected: ${request.rejectionReason}` : "Approved"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
                {processedRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl transition-all hover:shadow-md ${viewMode === "grid" ? "" : "flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3"}`}
                    data-testid={`card-processed-request-${request.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200">
                          {request.user?.firstName} {request.user?.lastName}
                        </h4>
                        <Badge variant="outline" className="text-xs">{request.user?.role}</Badge>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#1F3A5F] dark:text-[#2FBF71]" />
                        <span className="truncate">{request.user?.email}</span>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#1F3A5F] dark:text-[#2FBF71]" />
                        Processed {request.handledAt ? formatDistanceToNow(new Date(request.handledAt), { addSuffix: true }) : "N/A"}
                      </p>
                      {request.rejectionReason && (
                        <p className="text-sm text-destructive mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                          Reason: {request.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent data-testid="dialog-approve-reset">
          <DialogHeader>
            <DialogTitle>Approve Password Reset</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedRequest?.user?.firstName} {selectedRequest?.user?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-new-password"
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApproveDialogOpen(false);
                setNewPassword("");
              }}
              data-testid="button-cancel-approve"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={approveMutation.isPending || newPassword.length < 6}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent data-testid="dialog-reject-reset">
          <DialogHeader>
            <DialogTitle>Reject Password Reset</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this password reset request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                data-testid="input-rejection-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
              data-testid="button-cancel-reject"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
