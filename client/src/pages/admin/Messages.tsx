import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import MessagingInterface from "@/components/MessagingInterface";
import { MessageCircle, Mail, Smartphone, Send, X, Check, Users, AlertCircle, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AdminMessagesProps {
  adminId: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  phone?: string;
}

export default function AdminMessages({ adminId }: AdminMessagesProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("messages");
  
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [selectedEmailRecipients, setSelectedEmailRecipients] = useState<string[]>([]);
  const [isRecipientSelectorOpen, setIsRecipientSelectorOpen] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");

  const [smsMessage, setSmsMessage] = useState("");
  const [selectedSmsRecipients, setSelectedSmsRecipients] = useState<string[]>([]);
  const [isSmsRecipientSelectorOpen, setIsSmsRecipientSelectorOpen] = useState(false);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const usersWithEmail = users.filter(u => u.email && u.id !== adminId);
  const usersWithPhone = users.filter(u => u.phone && u.id !== adminId);

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { recipientIds: string[]; subject: string; body: string }) => {
      const response = await apiRequest("POST", "/api/admin/send-bulk-email", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Emails sent successfully",
        description: `${data.successCount} email(s) sent successfully.`,
      });
      setEmailSubject("");
      setEmailBody("");
      setSelectedEmailRecipients([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send emails",
        description: error.message || "An error occurred while sending emails.",
        variant: "destructive",
      });
    },
  });

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.name) return user.name;
    return user.email;
  };

  const toggleEmailRecipient = (userId: string) => {
    setSelectedEmailRecipients(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllEmailRecipients = () => {
    setSelectedEmailRecipients(usersWithEmail.map(u => u.id));
  };

  const clearEmailRecipients = () => {
    setSelectedEmailRecipients([]);
  };

  const selectByRole = (role: string) => {
    const roleUsers = usersWithEmail.filter(u => u.role === role).map(u => u.id);
    setSelectedEmailRecipients(prev => {
      const newSet = new Set(prev);
      roleUsers.forEach(id => newSet.add(id));
      return Array.from(newSet);
    });
  };

  const toggleSmsRecipient = (userId: string) => {
    setSelectedSmsRecipients(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendEmail = () => {
    if (selectedEmailRecipients.length === 0) {
      toast({
        title: "No recipients selected",
        description: "Please select at least one recipient.",
        variant: "destructive",
      });
      return;
    }
    if (!emailSubject.trim()) {
      toast({
        title: "Subject required",
        description: "Please enter an email subject.",
        variant: "destructive",
      });
      return;
    }
    if (!emailBody.trim()) {
      toast({
        title: "Message required",
        description: "Please enter an email message.",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate({
      recipientIds: selectedEmailRecipients,
      subject: emailSubject,
      body: emailBody,
    });
  };

  const filteredEmailUsers = usersWithEmail.filter(user => {
    const searchLower = recipientSearch.toLowerCase();
    const name = getUserDisplayName(user).toLowerCase();
    const email = user.email.toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default";
      case "finance_admin": return "secondary";
      case "teacher": return "outline";
      case "student": return "secondary";
      case "parent": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" data-testid="admin-messages-page">
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
                  <MessageCircle className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white">Communication Center</h1>
              </div>
              <p className="text-[#1F3A5F]/60 dark:text-white/60 text-sm sm:text-base font-medium">Communicate with teachers, parents, and students via messages, email, or SMS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20 flex-wrap mb-6">
            <TabsTrigger 
              value="messages" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
              data-testid="tab-messages"
            >
              <MessageCircle className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger 
              value="email" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
              data-testid="tab-email"
            >
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger 
              value="sms" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
              data-testid="tab-sms"
            >
              <Smartphone className="w-4 h-4" />
              SMS
            </TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-0">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#1F3A5F]/5 via-transparent to-[#2FBF71]/5 rounded-2xl blur-xl opacity-60 pointer-events-none" />
              <div className="relative bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-800/95 dark:via-slate-800 dark:to-slate-900/95 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#1F3A5F] via-[#2FBF71]/50 to-[#1F3A5F]" />
                <div className="p-3 sm:p-4 md:p-5">
                  <MessagingInterface currentUserId={adminId} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Send Email
                </CardTitle>
                <CardDescription>
                  Send emails to selected users. You can select individual users or send to all users at once.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recipients Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Recipients</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Button variant="outline" size="sm" onClick={selectAllEmailRecipients}>
                      <Users className="w-4 h-4 mr-1" />
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => selectByRole("teacher")}>
                      Teachers
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => selectByRole("parent")}>
                      Parents
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => selectByRole("student")}>
                      Students
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearEmailRecipients} disabled={selectedEmailRecipients.length === 0}>
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  </div>

                  <Popover open={isRecipientSelectorOpen} onOpenChange={setIsRecipientSelectorOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Users className="w-4 h-4" />
                        {selectedEmailRecipients.length === 0 
                          ? "Select recipients..." 
                          : `${selectedEmailRecipients.length} recipient(s) selected`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search users..." 
                          value={recipientSearch}
                          onValueChange={setRecipientSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No users found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-64">
                              {filteredEmailUsers.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={`${getUserDisplayName(user)} ${user.email}`}
                                  onSelect={() => toggleEmailRecipient(user.id)}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <Checkbox 
                                      checked={selectedEmailRecipients.includes(user.id)}
                                      className="pointer-events-none"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">{getUserDisplayName(user)}</div>
                                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                    </div>
                                    <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs capitalize">
                                      {user.role.replace("_", " ")}
                                    </Badge>
                                  </div>
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Selected Recipients Display */}
                  {selectedEmailRecipients.length > 0 && (
                    <div className="flex flex-wrap gap-1 p-3 bg-muted/30 rounded-lg">
                      {selectedEmailRecipients.slice(0, 10).map(id => {
                        const user = usersWithEmail.find(u => u.id === id);
                        if (!user) return null;
                        return (
                          <Badge 
                            key={id} 
                            variant="secondary" 
                            className="gap-1 cursor-pointer"
                            onClick={() => toggleEmailRecipient(id)}
                          >
                            {getUserDisplayName(user)}
                            <X className="w-3 h-3" />
                          </Badge>
                        );
                      })}
                      {selectedEmailRecipients.length > 10 && (
                        <Badge variant="outline">+{selectedEmailRecipients.length - 10} more</Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    placeholder="Enter email subject..."
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    data-testid="input-email-subject"
                  />
                </div>

                {/* Body */}
                <div className="space-y-2">
                  <Label htmlFor="email-body">Message</Label>
                  <Textarea
                    id="email-body"
                    placeholder="Write your email message here..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={8}
                    className="resize-none"
                    data-testid="input-email-body"
                  />
                </div>

                {/* Send Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSendEmail} 
                    disabled={sendEmailMutation.isPending || selectedEmailRecipients.length === 0}
                    data-testid="button-send-email"
                  >
                    {sendEmailMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Email
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  Send SMS
                </CardTitle>
                <CardDescription>
                  Send SMS messages to users with registered phone numbers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">SMS Integration Not Configured</h3>
                  <p className="text-muted-foreground max-w-md mb-4">
                    SMS messaging requires Twilio integration to be set up. Please contact your system administrator to configure Twilio for SMS capabilities.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="gap-1">
                      <Smartphone className="w-3 h-3" />
                      Twilio Required
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
