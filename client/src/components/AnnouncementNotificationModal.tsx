import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Check, CheckCheck, Calendar, BookOpen, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { AnnouncementWithDetails, AnnouncementRecipient, User } from "@shared/schema";

interface AnnouncementWithRecipient extends AnnouncementWithDetails {
  recipient?: AnnouncementRecipient;
}

interface AnnouncementNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export function AnnouncementNotificationModal({ isOpen, onClose, currentUser }: AnnouncementNotificationModalProps) {
  const { toast } = useToast();
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const isStudent = currentUser.role === "student";
  const isParent = currentUser.role === "parent";

  const announcementEndpoint = isStudent 
    ? `/api/students/${currentUser.id}/announcements`
    : `/api/parents/${currentUser.id}/announcements`;
    
  const { data: announcements = [], isLoading, refetch } = useQuery<AnnouncementWithRecipient[]>({
    queryKey: isStudent 
      ? ["/api/students", currentUser.id, "announcements"]
      : ["/api/parents", currentUser.id, "announcements"],
    queryFn: async () => {
      const response = await fetch(announcementEndpoint);
      if (!response.ok) throw new Error("Failed to fetch announcements");
      return response.json();
    },
    enabled: isOpen && !!currentUser.id && (isStudent || isParent),
    refetchInterval: 30000,
  });

  const unreadAnnouncements = announcements.filter(a => {
    const recipient = a.recipient;
    if (!recipient) return false;
    if (isStudent) return !recipient.studentReadAt;
    if (isParent) return !recipient.parentReadAt;
    return false;
  });

  const readAnnouncements = announcements.filter(a => {
    const recipient = a.recipient;
    if (!recipient) return false;
    if (isStudent) return !!recipient.studentReadAt;
    if (isParent) return !!recipient.parentReadAt;
    return false;
  });

  const selectedAnnouncement = selectedAnnouncementId 
    ? announcements.find(a => a.id === selectedAnnouncementId) 
    : null;

  const markAsReadMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      const endpoint = isStudent 
        ? `/api/announcements/${announcementId}/read/student/${currentUser.id}`
        : `/api/announcements/${announcementId}/read/parent/${currentUser.id}`;
      return apiRequest("POST", endpoint);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", currentUser.id] });
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      const endpoint = isStudent 
        ? `/api/announcements/${announcementId}/acknowledge/student/${currentUser.id}`
        : `/api/announcements/${announcementId}/acknowledge/parent/${currentUser.id}`;
      return apiRequest("POST", endpoint);
    },
    onSuccess: () => {
      toast({
        title: "Announcement Acknowledged",
        description: "Your acknowledgment has been recorded.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", currentUser.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to acknowledge announcement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSelectAnnouncement = (announcement: AnnouncementWithRecipient) => {
    setSelectedAnnouncementId(announcement.id);
    const recipient = announcement.recipient;
    const isUnread = isStudent 
      ? !recipient?.studentReadAt 
      : !recipient?.parentReadAt;
    
    if (isUnread) {
      markAsReadMutation.mutate(announcement.id);
    }
  };

  const handleAcknowledge = (announcementId: string) => {
    acknowledgeMutation.mutate(announcementId);
  };

  const isAcknowledged = (announcement: AnnouncementWithRecipient) => {
    const recipient = announcement.recipient;
    if (!recipient) return false;
    return isStudent 
      ? !!recipient.studentAcknowledgedAt 
      : !!recipient.parentAcknowledgedAt;
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedAnnouncementId(null);
    }
  }, [isOpen]);

  if (!isStudent && !isParent) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0" data-testid="dialog-announcements">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Announcements
            {unreadAnnouncements.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadAnnouncements.length} New
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            View course announcements from your teachers
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-3 border-b bg-muted/30">
              <h3 className="text-sm font-medium">All Announcements</h3>
            </div>
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No announcements yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {unreadAnnouncements.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/20">
                        Unread ({unreadAnnouncements.length})
                      </div>
                      {unreadAnnouncements.map((announcement) => (
                        <button
                          key={announcement.id}
                          className={`w-full text-left p-3 hover-elevate transition-colors ${
                            selectedAnnouncementId === announcement.id ? 'bg-accent' : ''
                          }`}
                          onClick={() => handleSelectAnnouncement(announcement)}
                          data-testid={`announcement-item-${announcement.id}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{announcement.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {announcement.course?.title || "Course Announcement"}
                              </p>
                              {announcement.createdAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(announcement.createdAt), "MMM d, h:mm a")}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  
                  {readAnnouncements.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/20">
                        Read ({readAnnouncements.length})
                      </div>
                      {readAnnouncements.map((announcement) => (
                        <button
                          key={announcement.id}
                          className={`w-full text-left p-3 hover-elevate transition-colors ${
                            selectedAnnouncementId === announcement.id ? 'bg-accent' : ''
                          }`}
                          onClick={() => handleSelectAnnouncement(announcement)}
                          data-testid={`announcement-item-${announcement.id}`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-muted-foreground">{announcement.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {announcement.course?.title || "Course Announcement"}
                              </p>
                              {announcement.createdAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(announcement.createdAt), "MMM d, h:mm a")}
                                </p>
                              )}
                            </div>
                            {isAcknowledged(announcement) && (
                              <CheckCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex-1 flex flex-col">
            {selectedAnnouncement ? (
              <>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-2" data-testid="announcement-detail-title">
                        {selectedAnnouncement.title}
                      </h2>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        {selectedAnnouncement.course && (
                          <Badge variant="outline" className="gap-1">
                            <BookOpen className="w-3 h-3" />
                            {selectedAnnouncement.course.title}
                          </Badge>
                        )}
                        {selectedAnnouncement.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(selectedAnnouncement.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedAnnouncement.author && (
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={selectedAnnouncement.author.avatarUrl || undefined} />
                          <AvatarFallback>
                            {selectedAnnouncement.author.firstName?.[0] || "T"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {selectedAnnouncement.author.firstName} {selectedAnnouncement.author.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">Teacher</p>
                        </div>
                      </div>
                    )}

                    <Card className="border-0 shadow-none bg-transparent">
                      <CardContent className="p-0">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed" data-testid="announcement-detail-content">
                          {selectedAnnouncement.content}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="p-4 border-t bg-muted/20">
                  {isAcknowledged(selectedAnnouncement) ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCheck className="w-4 h-4" />
                      <span>You acknowledged this announcement</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleAcknowledge(selectedAnnouncement.id)}
                      disabled={acknowledgeMutation.isPending}
                      className="w-full"
                      data-testid="button-acknowledge"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {acknowledgeMutation.isPending ? "Acknowledging..." : "Acknowledge Receipt"}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground p-6">
                <div>
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Select an announcement to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} data-testid="button-close-announcements">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
