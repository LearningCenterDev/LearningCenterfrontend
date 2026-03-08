import { useQuery, useMutation } from "@tanstack/react-query";
import { NotificationBell } from "./NotificationBell";
import { AnnouncementNotificationModal } from "./AnnouncementNotificationModal";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useState } from "react";
import type { Notification, User } from "@shared/schema";

export function NotificationBellContainer() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementNotificationId, setAnnouncementNotificationId] = useState<string | null>(null);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/notifications/${user?.id}/read-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
    },
  });

  const formattedNotifications = notifications.map(n => {
    // Map notification types to NotificationBell's expected types
    let displayType: "message" | "assignment" | "grade" | "schedule" | "system" = "system";
    
    switch (n.type) {
      case 'new_message':
        displayType = 'message';
        break;
      case 'assignment_posted':
      case 'assignment_submitted':
        displayType = 'assignment';
        break;
      case 'assignment_graded':
        displayType = 'grade';
        break;
      case 'schedule_created':
      case 'schedule_rescheduled':
        displayType = 'schedule';
        break;
      case 'enrollment_approved':
      case 'enrollment_rejected':
      case 'enrollment_request':
        displayType = 'system';
        break;
      case 'announcement':
        displayType = 'system';
        break;
      case 'prospect_student_submitted':
        displayType = 'system';
        break;
      case 'student_enrolled':
        displayType = 'system';
        break;
      default:
        displayType = 'system';
    }
    
    return {
      id: n.id,
      type: displayType,
      title: n.title,
      description: n.message,
      timestamp: new Date(n.createdAt || Date.now()),
      isRead: n.isRead,
      relatedId: n.relatedId || undefined,
      relatedType: n.relatedType || undefined,
    };
  });

  const handleNotificationClick = (notification: { 
    id: string; 
    type: "message" | "assignment" | "grade" | "schedule" | "system"; 
    relatedId?: string; 
    relatedType?: string;
  }) => {
    // Navigate based on notification type
    const userRole = user?.role;
    
    // Check if this is an announcement notification by checking the original notification
    const originalNotification = notifications.find(n => n.id === notification.id);
    if (originalNotification?.type === 'announcement') {
      setAnnouncementNotificationId(notification.id);
      setShowAnnouncementModal(true);
      return;
    }
    
    switch (notification.type) {
      case 'message':
        // Navigate to messages page - unified route for all roles
        navigate('/messages');
        break;
        
      case 'assignment':
        // Navigate to assignments page - unified route for student and teacher
        navigate('/assignments');
        break;
        
      case 'grade':
        // Navigate to progress/grades page - unified route for student and parent
        navigate('/progress');
        break;
        
      case 'schedule':
        // Navigate to schedule page - unified route for all roles
        navigate('/schedule');
        break;
        
      case 'system':
        // Check if this is a prospect student notification
        if (notification.relatedType === 'prospect' && userRole === 'admin') {
          navigate('/prospect-students');
        } else if (notification.relatedType === 'course' && userRole === 'admin') {
          // For student enrollment notifications, navigate to course management
          navigate('/courses');
        } else if (notification.relatedType === 'reschedule_proposal' || notification.relatedType === 'schedule') {
          // For reschedule proposals and schedule-related system notifications, go to schedule
          navigate('/schedule');
        } else {
          // Default to unified dashboard for all roles
          navigate('/dashboard');
        }
        break;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <NotificationBell
        notifications={formattedNotifications}
        onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
        onMarkAllAsRead={() => markAllAsReadMutation.mutate()}
        onNotificationClick={handleNotificationClick}
      />
      {user && (showAnnouncementModal) && (
        <AnnouncementNotificationModal
          isOpen={showAnnouncementModal}
          onClose={() => setShowAnnouncementModal(false)}
          currentUser={user as User}
        />
      )}
    </>
  );
}
