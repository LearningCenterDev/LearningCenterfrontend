import MessageCard from '../MessageCard';

export default function MessageCardExample() {
  // todo: remove mock functionality
  const handleReply = () => console.log('Reply clicked');
  const handleCall = () => console.log('Call clicked');
  const handleVideoCall = () => console.log('Video call clicked');
  const handleClick = () => console.log('Message clicked');
  
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return (
    <div className="p-4 space-y-4 max-w-md">
      <MessageCard
        senderName="Dr. Sarah Wilson"
        senderRole="teacher"
        lastMessage="Hi! I wanted to discuss Emma's progress in mathematics. She's been doing exceptionally well with calculus problems but could use some extra support with geometry."
        timestamp={hourAgo}
        unreadCount={2}
        isOnline={true}
        onReply={handleReply}
        onCall={handleCall}
        onVideoCall={handleVideoCall}
        onClick={handleClick}
      />
      
      <MessageCard
        senderName="Mike Johnson"
        senderRole="parent"
        lastMessage="Thank you for the detailed feedback on Alex's science project. We'll make sure he focuses more on the experimental methodology as you suggested."
        timestamp={dayAgo}
        isOnline={false}
        onReply={handleReply}
        onClick={handleClick}
      />
      
      <MessageCard
        senderName="Emma Davis"
        senderRole="student"
        lastMessage="Could you please clarify the requirements for the history essay? I want to make sure I understand the proper citation format."
        timestamp={dayAgo}
        unreadCount={1}
        isOnline={true}
        onReply={handleReply}
        onClick={handleClick}
      />
    </div>
  );
}