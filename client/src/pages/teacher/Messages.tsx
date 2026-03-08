import MessagingInterface from "@/components/MessagingInterface";
import { MessageCircle } from "lucide-react";

interface TeacherMessagesProps {
  teacherId: string;
}

export default function TeacherMessages({ teacherId }: TeacherMessagesProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" data-testid="teacher-messages-page">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#1F3A5F] via-[#1F3A5F] to-[#2a4a75] relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#2FBF71]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
              <MessageCircle className="w-5 h-5 text-[#2FBF71]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Messages</h1>
          </div>
          <p className="text-white/60 text-sm sm:text-base">Communicate with students, parents, and administrators</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#1F3A5F]/5 via-transparent to-[#2FBF71]/5 rounded-2xl blur-xl opacity-60 pointer-events-none" />
          <div className="relative bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-800/95 dark:via-slate-800 dark:to-slate-900/95 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#1F3A5F] via-[#2FBF71]/50 to-[#1F3A5F]" />
            <div className="p-3 sm:p-4 md:p-5">
              <MessagingInterface currentUserId={teacherId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
