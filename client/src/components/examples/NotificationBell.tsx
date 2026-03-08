import NotificationBell from '../NotificationBell';

export default function NotificationBellExample() {
  // todo: remove mock functionality
  const mockNotifications = [
    {
      id: '1',
      type: 'assignment' as const,
      title: 'New Assignment Posted',
      description: 'Mathematics: Calculus Problem Set #3 is now available. Due in 3 days.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isRead: false
    },
    {
      id: '2', 
      type: 'grade' as const,
      title: 'Grade Received',
      description: 'Your Physics Lab Report has been graded. Score: 85/100',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: false
    },
    {
      id: '3',
      type: 'message' as const, 
      title: 'New Message from Dr. Wilson',
      description: 'Regarding your progress in the advanced mathematics course...',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isRead: true
    },
    {
      id: '4',
      type: 'schedule' as const,
      title: 'Schedule Update',
      description: 'Chemistry class moved to Room 301 for tomorrow\'s session.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isRead: true
    }
  ];

  const handleMarkAsRead = (id: string) => {
    console.log(`Mark notification ${id} as read`);
  };

  const handleMarkAllAsRead = () => {
    console.log('Mark all notifications as read');
  };

  return (
    <div className="p-4">
      <NotificationBell 
        notifications={mockNotifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </div>
  );
}