import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar, Clock, User, Check, X, RefreshCw, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Schedule, RescheduleProposalWithRelations } from "@shared/schema";

interface RescheduleProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  currentUserId: string;
  currentUserRole: "teacher" | "parent";
  invalidateQueries: () => void;
}

const proposalSchema = z.object({
  proposedTo: z.string().min(1, "Please select a recipient"),
  proposedStartTime: z.string().min(1, "Start time is required"),
  proposedEndTime: z.string().min(1, "End time is required"),
  message: z.string().optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

export function RescheduleProposalModal({
  isOpen,
  onClose,
  schedule,
  currentUserId,
  currentUserRole,
  invalidateQueries,
}: RescheduleProposalModalProps) {
  const { toast } = useToast();

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: parentChildren = [] } = useQuery<any[]>({
    queryKey: ["/api/parent-children"],
  });

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      proposedTo: "",
      proposedStartTime: "",
      proposedEndTime: "",
      message: "",
    },
  });

  const getRecipients = () => {
    if (!schedule) return [];

    const result: { id: string; name: string; role: string }[] = [];

    if (currentUserRole === "teacher") {
      const courseEnrollments = enrollments.filter(
        (e: any) => e.courseId === schedule.courseId && e.approvalStatus === 'approved'
      );
      
      const parentIds = new Set<string>();
      courseEnrollments.forEach((enrollment: any) => {
        // Find parents via parent_children junction table
        const parentRelations = parentChildren.filter(
          (pc: any) => pc.childId === enrollment.studentId
        );
        parentRelations.forEach((rel: any) => {
          parentIds.add(rel.parentId);
        });
      });

      parentIds.forEach(parentId => {
        const parent = users.find((u: any) => u.id === parentId);
        if (parent) {
          result.push({
            id: parent.id,
            name: `${parent.firstName || ''} ${parent.lastName || ''}`.trim() || parent.email || 'Parent',
            role: 'Parent'
          });
        }
      });
    } else if (currentUserRole === "parent") {
      if (schedule.teacherId) {
        const teacher = users.find((u: any) => u.id === schedule.teacherId);
        if (teacher) {
          result.push({
            id: teacher.id,
            name: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.email || 'Teacher',
            role: 'Teacher'
          });
        }
      }
    }

    return result;
  };

  const recipients = getRecipients();

  useEffect(() => {
    if (isOpen && schedule) {
      const autoRecipient = recipients.length === 1 ? recipients[0].id : "";
      form.reset({
        proposedTo: autoRecipient,
        proposedStartTime: format(new Date(schedule.startTime), "yyyy-MM-dd'T'HH:mm"),
        proposedEndTime: format(new Date(schedule.endTime), "yyyy-MM-dd'T'HH:mm"),
        message: "",
      });
    }
  }, [isOpen, schedule, form, recipients.length]);

  const createProposalMutation = useMutation({
    mutationFn: async (data: ProposalFormData) => {
      return await apiRequest("POST", `/api/schedules/${schedule?.id}/reschedule-proposal`, {
        proposedTo: data.proposedTo,
        proposedStartTime: new Date(data.proposedStartTime).toISOString(),
        proposedEndTime: new Date(data.proposedEndTime).toISOString(),
        message: data.message || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reschedule-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reschedule-proposals/pending"] });
      invalidateQueries();
      onClose();
      form.reset();
      toast({ title: "Reschedule proposal sent", description: "Waiting for acknowledgement" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: ProposalFormData) => {
    createProposalMutation.mutate(data);
  };

  if (!schedule) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Propose Reschedule</DialogTitle>
          <DialogDescription>
            Propose a new time for "{schedule.title}". The other party will be notified and can accept, reject, or propose an alternative time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Current Schedule</p>
          </div>
          <div className="space-y-2 ml-6">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">
                {format(new Date(schedule.startTime), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium">
                {format(new Date(schedule.startTime), 'h:mm a')} - {format(new Date(schedule.endTime), 'h:mm a')}
              </span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Show recipient as read-only when auto-selected (single recipient) */}
            {recipients.length === 1 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Send Proposal To</p>
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-medium">{recipients[0].name}</span>
                  <Badge variant="secondary">{recipients[0].role}</Badge>
                </div>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="proposedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Send Proposal To</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-proposal-recipient">
                          <SelectValue placeholder="Select recipient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recipients.map((recipient) => (
                          <SelectItem key={recipient.id} value={recipient.id}>
                            {recipient.name} ({recipient.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="proposedStartTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposed Start Time</FormLabel>
                  <FormControl>
                    <Input {...field} type="datetime-local" data-testid="input-proposal-start-time" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proposedEndTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposed End Time</FormLabel>
                  <FormControl>
                    <Input {...field} type="datetime-local" data-testid="input-proposal-end-time" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Explain why you need to reschedule..."
                      className="resize-none"
                      data-testid="input-proposal-message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-proposal">
                Cancel
              </Button>
              <Button type="submit" disabled={createProposalMutation.isPending} data-testid="button-submit-proposal">
                {createProposalMutation.isPending ? "Sending..." : "Send Proposal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface PendingProposalsProps {
  userId: string;
  invalidateQueries: () => void;
}

export function PendingProposals({ userId, invalidateQueries, proposals }: PendingProposalsProps & { proposals?: RescheduleProposalWithRelations[] }) {
  const { toast } = useToast();
  const [counterProposalId, setCounterProposalId] = useState<string | null>(null);
  const [counterStartTime, setCounterStartTime] = useState("");
  const [counterEndTime, setCounterEndTime] = useState("");
  const [counterMessage, setCounterMessage] = useState("");

  const { data: pendingProposalsFetched = [], isLoading } = useQuery<RescheduleProposalWithRelations[]>({
    queryKey: ["/api/reschedule-proposals/pending"],
    enabled: !proposals,
  });

  const pendingProposals = proposals || pendingProposalsFetched;

  const respondMutation = useMutation({
    mutationFn: async ({ proposalId, action, message, proposedStartTime, proposedEndTime }: {
      proposalId: string;
      action: 'accept' | 'reject' | 'counter_propose';
      message?: string;
      proposedStartTime?: string;
      proposedEndTime?: string;
    }) => {
      return await apiRequest("POST", `/api/reschedule-proposals/${proposalId}/respond`, {
        action,
        message,
        proposedStartTime,
        proposedEndTime,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reschedule-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reschedule-proposals/pending"] });
      invalidateQueries();
      setCounterProposalId(null);
      setCounterStartTime("");
      setCounterEndTime("");
      setCounterMessage("");
      
      const messages = {
        accept: "Reschedule accepted and schedule updated",
        reject: "Reschedule proposal rejected",
        counter_propose: "Counter proposal sent",
      };
      toast({ title: messages[variables.action] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAccept = (proposalId: string) => {
    respondMutation.mutate({ proposalId, action: 'accept' });
  };

  const handleReject = (proposalId: string) => {
    if (window.confirm("Are you sure you want to reject this reschedule proposal?")) {
      respondMutation.mutate({ proposalId, action: 'reject' });
    }
  };

  const handleCounterPropose = (proposalId: string) => {
    if (!counterStartTime || !counterEndTime) {
      toast({ title: "Error", description: "Please provide both start and end times", variant: "destructive" });
      return;
    }
    respondMutation.mutate({
      proposalId,
      action: 'counter_propose',
      proposedStartTime: new Date(counterStartTime).toISOString(),
      proposedEndTime: new Date(counterEndTime).toISOString(),
      message: counterMessage || undefined,
    });
  };

  if (isLoading || pendingProposals.length === 0) return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-100/50 dark:bg-amber-900/30 border-b border-amber-200/50 dark:border-amber-800/30">
        <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Reschedule Requests</span>
        <Badge variant="secondary" className="h-4 px-1 text-[9px] ml-auto">{pendingProposals.length}</Badge>
      </div>
      <div className="divide-y divide-amber-200/50 dark:divide-amber-800/30">
        {pendingProposals.map((proposal) => (
          <div key={proposal.id} className="px-3 py-2">
            {counterProposalId === proposal.id ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium truncate">{proposal.schedule.title}</span>
                  <span className="text-muted-foreground">from {proposal.proposer.firstName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="datetime-local"
                    value={counterStartTime}
                    onChange={(e) => setCounterStartTime(e.target.value)}
                    className="h-7 text-[10px] px-2"
                    data-testid="input-counter-start-time"
                  />
                  <Input
                    type="datetime-local"
                    value={counterEndTime}
                    onChange={(e) => setCounterEndTime(e.target.value)}
                    className="h-7 text-[10px] px-2"
                    data-testid="input-counter-end-time"
                  />
                </div>
                <Textarea
                  placeholder="Message (optional)..."
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  className="resize-none min-h-[40px] text-[11px] p-2"
                />
                <div className="flex gap-1.5 justify-end">
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setCounterProposalId(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => handleCounterPropose(proposal.id)} disabled={respondMutation.isPending}>
                    Send
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold truncate max-w-[120px]">{proposal.schedule.title}</span>
                    <span className="text-[10px] text-muted-foreground">from {proposal.proposer.firstName}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground line-through opacity-60">
                      <span>{format(new Date(proposal.schedule.startTime), 'MMM d, h:mm a')}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">→</span>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{format(new Date(proposal.proposedStartTime), 'MMM d, h:mm a')}</span>
                    </div>
                  </div>
                  {proposal.message && (
                    <p className="text-[10px] text-muted-foreground italic mt-0.5 line-clamp-1">"{proposal.message}"</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleAccept(proposal.id)}
                    disabled={respondMutation.isPending}
                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                    data-testid="button-accept-proposal"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setCounterProposalId(proposal.id);
                      setCounterStartTime(format(new Date(proposal.proposedStartTime), "yyyy-MM-dd'T'HH:mm"));
                      setCounterEndTime(format(new Date(proposal.proposedEndTime), "yyyy-MM-dd'T'HH:mm"));
                    }}
                    disabled={respondMutation.isPending}
                    className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    data-testid="button-counter-proposal"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleReject(proposal.id)}
                    disabled={respondMutation.isPending}
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    data-testid="button-reject-proposal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
