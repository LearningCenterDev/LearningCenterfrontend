import { useQuery } from "@tanstack/react-query";
import MessagingInterface from "@/components/MessagingInterface";
import type { User } from "@shared/schema";
import { motion } from "framer-motion";
import { MessageCircle, Sparkles } from "lucide-react";

interface MessagesProps {
  studentId: string;
}

export default function Messages({ studentId }: MessagesProps) {
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users", studentId],
    enabled: !!studentId,
  });

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 mx-auto max-w-7xl px-4 md:px-6 py-4 md:py-6 lg:py-8" data-testid="messages-page">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-r from-[#1F3A5F] to-[#2a4a75] rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 shadow-xl"
      >
        <div className="flex flex-row items-center justify-between gap-3">
          <div className="text-white">
            <div className="inline-flex items-center gap-1.5 md:gap-2 bg-[#2FBF71]/20 text-[#2FBF71] px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium mb-2 md:mb-3">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
              Communication
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-1 md:mb-2">Messages</h1>
            <p className="text-white/70 text-sm md:text-base hidden sm:block">
              Stay connected with teachers and administrators
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-[#2FBF71]" />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-[#1F3A5F]/5 via-transparent to-[#2FBF71]/5 rounded-2xl blur-xl opacity-60 pointer-events-none" />
        <div className="relative bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-800/95 dark:via-slate-800 dark:to-slate-900/95 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#1F3A5F] via-[#2FBF71]/50 to-[#1F3A5F]" />
          <div className="p-3 sm:p-4 md:p-5">
            <MessagingInterface currentUserId={studentId} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
