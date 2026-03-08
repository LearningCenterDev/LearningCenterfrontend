import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, Users, Plus, ArrowLeft, MessageSquare, Paperclip, X, FileText, Image as ImageIcon, Download, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Message, User, MessageAttachment } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

interface PendingFile {
  file: File;
  id: string;
}

interface MessagingInterfaceProps {
  currentUserId: string;
}

function MessageBubble({ 
  message, 
  isSent, 
  getFileIcon, 
  formatFileSize 
}: { 
  message: Message; 
  isSent: boolean;
  getFileIcon: (fileType: string) => JSX.Element;
  formatFileSize: (bytes: number) => string;
}) {
  const { data: attachments = [] } = useQuery<MessageAttachment[]>({
    queryKey: [`/api/messages/${message.id}/attachments`],
    staleTime: 60000,
  });

  const handleDownload = (attachmentId: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `/api/message-attachments/${attachmentId}/download`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${message.id}`}
    >
      <div
        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 ${
          isSent
            ? 'bg-[#1F3A5F] text-white rounded-br-md'
            : 'bg-slate-100 dark:bg-slate-800 rounded-bl-md'
        }`}
      >
        {message.content && message.content !== "[Attachment]" && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
        {attachments.length > 0 && (
          <div className={`space-y-2 ${message.content && message.content !== "[Attachment]" ? 'mt-2' : ''}`}>
            {attachments.map((att) => (
              <div 
                key={att.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  isSent 
                    ? 'bg-white/10 hover:bg-white/20' 
                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
                onClick={() => handleDownload(att.id, att.fileName)}
              >
                {getFileIcon(att.fileType)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{att.fileName}</p>
                  <p className={`text-xs ${isSent ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {formatFileSize(att.fileSize)}
                  </p>
                </div>
                <Download className="w-4 h-4 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
        <p
          className={`text-xs mt-1 ${
            isSent ? 'text-white/60' : 'text-muted-foreground'
          }`}
        >
          {message.sentAt ? format(new Date(message.sentAt), 'MMM d, h:mm a') : 'Just now'}
        </p>
      </div>
    </div>
  );
}

interface Conversation {
  userId: string;
  userName: string;
  userRole: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export default function MessagingInterface({ currentUserId }: MessagingInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [location] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user');
    if (userId) {
      setSelectedUserId(userId);
      setMobileShowChat(true);
    }
  }, [location]);

  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users/available-for-messaging", currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/users/available-for-messaging/${currentUserId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch available users");
      }
      return response.json();
    },
  });

  const { data: messagesData, isLoading: isLoadingMessages } = useQuery<{ sent: Message[]; received: Message[] }>({
    queryKey: ["/api/users", currentUserId, "messages"],
    refetchInterval: 5000,
    staleTime: 0,
  });

  const sentMessages = messagesData?.sent || [];
  const receivedMessages = messagesData?.received || [];
  const allMessages = [...sentMessages, ...receivedMessages];

  const conversations: Conversation[] = [];
  const userMap = new Map<string, Conversation>();

  allMessages.forEach(msg => {
    const otherUserId = msg.senderId === currentUserId ? msg.recipientId : msg.senderId;
    if (!otherUserId) return;
    
    if (!userMap.has(otherUserId)) {
      const otherUser = allUsers.find(u => u.id === otherUserId);
      if (otherUser && msg.sentAt) {
        userMap.set(otherUserId, {
          userId: otherUserId,
          userName: otherUser.name || otherUser.email || 'Unknown User',
          userRole: otherUser.role,
          avatarUrl: otherUser.avatarUrl || undefined,
          lastMessage: msg.content.substring(0, 50),
          lastMessageTime: new Date(msg.sentAt),
          unreadCount: 0,
        });
      }
    }

    const conversation = userMap.get(otherUserId);
    if (conversation && msg.sentAt) {
      if (new Date(msg.sentAt) > conversation.lastMessageTime) {
        conversation.lastMessage = msg.content.substring(0, 50);
        conversation.lastMessageTime = new Date(msg.sentAt);
      }
      if (msg.recipientId === currentUserId && !msg.isRead) {
        conversation.unreadCount++;
      }
    }
  });

  userMap.forEach(conv => conversations.push(conv));
  conversations.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const conversationMessages = selectedUserId
    ? allMessages
        .filter(msg => 
          (msg.senderId === currentUserId && msg.recipientId === selectedUserId) ||
          (msg.senderId === selectedUserId && msg.recipientId === currentUserId)
        )
        .sort((a, b) => {
          const aTime = a.sentAt ? new Date(a.sentAt).getTime() : 0;
          const bTime = b.sentAt ? new Date(b.sentAt).getTime() : 0;
          return aTime - bTime;
        })
    : [];

  const selectedUser = allUsers.find(u => u.id === selectedUserId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);

  useEffect(() => {
    if (selectedUserId) {
      const unreadMessages = conversationMessages.filter(
        msg => msg.recipientId === currentUserId && !msg.isRead
      );
      
      unreadMessages.forEach(msg => {
        fetch(`/api/messages/${msg.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "messages"] });
        });
      });
    }
  }, [selectedUserId, conversationMessages, currentUserId]);

  // Upload a single file and return attachment info
  const uploadFile = async (file: File): Promise<{ fileName: string; fileType: string; fileSize: number; fileUrl: string }> => {
    // Get pre-upload URL
    const uploadUrlResponse = await fetch("/api/message-attachments/pre-upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      }),
    });

    if (!uploadUrlResponse.ok) {
      const error = await uploadUrlResponse.json();
      throw new Error(error.error || "Failed to get upload URL");
    }

    const { uploadUrl, fileUrl, fileName, fileType, fileSize } = await uploadUrlResponse.json();

    // Upload file to storage
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file");
    }

    return { fileName, fileType, fileSize, fileUrl };
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { recipientId: string; content: string; files: PendingFile[] }) => {
      // Step 1: Upload all files in parallel first
      let attachments: { fileName: string; fileType: string; fileSize: number; fileUrl: string }[] = [];
      
      if (data.files.length > 0) {
        const uploadPromises = data.files.map(pf => uploadFile(pf.file));
        attachments = await Promise.all(uploadPromises);
      }
      
      // Step 2: Send message with all attachments in a single request
      const response = await fetch("/api/messages/with-attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: data.recipientId,
          subject: "Message",
          content: data.content || (attachments.length > 0 ? "[Attachment]" : ""),
          type: "general",
          attachments,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || "Failed to send message");
      }
      
      const messageResult = await response.json();
      // Response includes message with attachments array embedded
      return messageResult;
    },
    onSuccess: (result, variables) => {
      const { attachments: createdAttachments, ...message } = result;
      
      // Pre-populate attachment cache immediately so they appear without delay
      if (createdAttachments && createdAttachments.length > 0) {
        queryClient.setQueryData(
          [`/api/messages/${message.id}/attachments`],
          createdAttachments
        );
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", variables.recipientId, "messages"] });
      setMessageText("");
      setPendingFiles([]);
      setIsUploading(false);
      toast({
        title: "Message sent",
        description: "Your message has been delivered successfully.",
      });
    },
    onError: (error: Error) => {
      setIsUploading(false);
      toast({
        title: "Failed to send message",
        description: error.message || "An error occurred while sending the message.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!selectedUserId || (!messageText.trim() && pendingFiles.length === 0)) return;
    setIsUploading(pendingFiles.length > 0);
    sendMessageMutation.mutate({
      recipientId: selectedUserId,
      content: messageText.trim(),
      files: pendingFiles,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    const maxSize = 10 * 1024 * 1024;

    const newFiles: PendingFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type. Supported: PDF, DOCX, JPEG, PNG, GIF, WEBP`,
          variant: "destructive",
        });
        continue;
      }
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit.`,
          variant: "destructive",
        });
        continue;
      }
      newFiles.push({ file, id: `${Date.now()}-${Math.random().toString(36).substring(7)}` });
    }

    setPendingFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectConversation = (userId: string) => {
    setSelectedUserId(userId);
    setShowNewMessage(false);
    setMobileShowChat(true);
  };

  const handleBackToList = () => {
    setMobileShowChat(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'teacher': return 'default';
      case 'parent': return 'outline';
      case 'student': return 'secondary';
      default: return 'default';
    }
  };

  if (isLoadingUsers || isLoadingMessages) {
    return (
      <div className="h-[calc(100vh-14rem)] md:h-[calc(100vh-12rem)] flex flex-col md:flex-row gap-4 md:gap-6" data-testid="messaging-interface-loading">
        <Card className="w-full md:w-80 flex flex-col flex-shrink-0">
          <CardHeader className="pb-3 px-4">
            <div className="h-6 bg-muted rounded animate-pulse mb-2" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="space-y-2 pt-0 px-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-3 space-y-2">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-14rem)] md:h-[calc(100vh-12rem)] flex flex-col md:flex-row gap-4 md:gap-6" data-testid="messaging-interface">
      {/* Conversations List */}
      <Card className={`w-full md:w-80 flex flex-col flex-shrink-0 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        <CardHeader className="pb-3 px-4">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-base md:text-lg">Messages</CardTitle>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setShowNewMessage(true);
                setMobileShowChat(true);
              }}
              data-testid="button-new-message"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
              data-testid="input-search-conversations"
            />
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <CardContent className="space-y-2 pt-0 px-3 pb-4">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <div className="w-14 h-14 bg-[#1F3A5F]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-[#1F3A5F]/50" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {searchQuery ? "No conversations found" : "No messages yet"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNewMessage(true);
                    setMobileShowChat(true);
                  }}
                  className="border-[#2FBF71]/30 text-[#2FBF71]"
                  data-testid="button-start-conversation"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start a Conversation
                </Button>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.userId}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    selectedUserId === conv.userId 
                      ? 'bg-[#1F3A5F]/10 border border-[#1F3A5F]/20' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                  onClick={() => handleSelectConversation(conv.userId)}
                  data-testid={`conversation-${conv.userId}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-11 h-11 shrink-0 border-2 border-white shadow-sm">
                      <AvatarImage src={conv.avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] text-white text-sm">
                        {conv.userName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="font-medium text-sm truncate">{conv.userName}</h4>
                        {conv.unreadCount > 0 && (
                          <Badge className="min-w-[20px] h-5 text-xs bg-[#2FBF71] hover:bg-[#2FBF71]">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-1">
                        {conv.lastMessage}
                      </p>
                      <span className="text-xs text-muted-foreground/70">
                        {formatDistanceToNow(conv.lastMessageTime)} ago
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className={`flex-1 flex flex-col min-w-0 ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {showNewMessage ? (
          <>
            <CardHeader className="pb-3 border-b px-4">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setShowNewMessage(false);
                    setMobileShowChat(false);
                  }}
                  className="md:hidden"
                  data-testid="button-back-mobile"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <CardTitle className="text-base md:text-lg flex-1">New Message</CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowNewMessage(false)}
                  className="hidden md:flex"
                  data-testid="button-close-new-message"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1">
              <CardContent className="p-4 md:p-6">
                <h3 className="text-sm font-medium mb-4 text-muted-foreground">Select a recipient</h3>
                <div className="space-y-2">
                  {allUsers
                    .filter(u => u.id !== currentUserId)
                    .sort((a, b) => {
                      if (a.role === 'admin' && b.role !== 'admin') return -1;
                      if (a.role !== 'admin' && b.role === 'admin') return 1;
                      return (a.name || a.email || '').localeCompare(b.name || b.email || '');
                    })
                    .map(user => (
                      <div
                        key={user.id}
                        className="p-3 rounded-xl cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200"
                        onClick={() => handleSelectConversation(user.id)}
                        data-testid={`select-user-${user.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-11 h-11 border-2 border-white shadow-sm">
                            <AvatarImage src={user.avatarUrl || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] text-white text-sm">
                              {user.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-sm">{user.name || user.email}</h4>
                              <Badge variant={getRoleColor(user.role)} className="text-xs">
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </ScrollArea>
          </>
        ) : selectedUser ? (
          <>
            <CardHeader className="pb-3 border-b px-4">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleBackToList}
                  className="md:hidden flex-shrink-0"
                  data-testid="button-back-mobile"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-10 h-10 border-2 border-white shadow-sm flex-shrink-0">
                  <AvatarImage src={selectedUser.avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] text-white text-sm">
                    {selectedUser.name?.split(' ').map(n => n[0]).join('') || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm md:text-base truncate">{selectedUser.name || selectedUser.email}</h3>
                    <Badge variant={getRoleColor(selectedUser.role)} className="text-xs hidden sm:inline-flex">
                      {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate hidden sm:block">{selectedUser.email}</p>
                </div>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4 md:p-6">
              <div className="space-y-3">
                {conversationMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-[#2FBF71]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-[#2FBF71]" />
                    </div>
                    <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  conversationMessages.map((msg) => {
                    const isSent = msg.senderId === currentUserId;
                    return (
                      <MessageBubble 
                        key={msg.id} 
                        message={msg} 
                        isSent={isSent}
                        getFileIcon={getFileIcon}
                        formatFileSize={formatFileSize}
                      />
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <CardContent className="border-t p-3 md:p-4">
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {pendingFiles.map((pf) => (
                    <div 
                      key={pf.id}
                      className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm"
                    >
                      {getFileIcon(pf.file.type)}
                      <span className="max-w-[120px] truncate">{pf.file.name}</span>
                      <span className="text-xs text-muted-foreground">({formatFileSize(pf.file.size)})</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() => removePendingFile(pf.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept=".pdf,.doc,.docx,image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 w-11 rounded-xl flex-shrink-0"
                  disabled={sendMessageMutation.isPending || isUploading}
                  data-testid="button-attach-file"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Textarea
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="resize-none min-h-[44px] max-h-[120px] text-sm rounded-xl"
                  rows={1}
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={(!messageText.trim() && pendingFiles.length === 0) || sendMessageMutation.isPending || isUploading}
                  className="h-11 w-11 rounded-xl bg-[#2FBF71] hover:bg-[#25a060] flex-shrink-0"
                  size="icon"
                  data-testid="button-send-message"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#1F3A5F]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-[#1F3A5F]/50" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-[#1F3A5F]">No Conversation Selected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose a conversation from the list or start a new one
              </p>
              <Button 
                onClick={() => setShowNewMessage(true)} 
                className="bg-[#2FBF71] hover:bg-[#25a060]"
                data-testid="button-new-conversation"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Message
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
