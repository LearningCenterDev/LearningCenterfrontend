import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Phone, Video, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import UserAvatar from "./UserAvatar";

interface MessageCardProps {
  senderName: string;
  senderRole: "teacher" | "parent" | "student";
  lastMessage: string;
  timestamp: Date;
  unreadCount?: number;
  isOnline?: boolean;
  onReply?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onClick?: () => void;
}

export function MessageCard({
  senderName,
  senderRole,
  lastMessage,
  timestamp,
  unreadCount,
  isOnline,
  onReply,
  onCall,
  onVideoCall,
  onClick
}: MessageCardProps) {
  const roleColors = {
    teacher: "default",
    parent: "outline",
    student: "secondary"
  } as const;

  return (
    <Card 
      className={`transition-colors hover:bg-accent/50 cursor-pointer ${unreadCount ? 'border-primary/50' : ''}`}
      onClick={onClick}
      data-testid={`card-message-${senderName.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <UserAvatar name={senderName} size="md" />
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{senderName}</h4>
                <Badge variant={roleColors[senderRole]} className="text-xs">
                  {senderRole.charAt(0).toUpperCase() + senderRole.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(timestamp)} ago
                </span>
              </div>
            </div>
            {unreadCount && unreadCount > 0 && (
              <Badge variant="destructive" className="min-w-[20px] h-5 text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm line-clamp-2 text-muted-foreground">{lastMessage}</p>
        
        <div className="flex gap-2">
          {onReply && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onReply(); }}
              data-testid="button-reply"
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Reply
            </Button>
          )}
          {senderRole === "teacher" && onCall && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onCall(); }}
              data-testid="button-call"
            >
              <Phone className="w-4 h-4" />
            </Button>
          )}
          {senderRole === "teacher" && onVideoCall && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onVideoCall(); }}
              data-testid="button-video-call"
            >
              <Video className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MessageCard;