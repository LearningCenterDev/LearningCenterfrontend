import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft, Award, GraduationCap, User, Loader2, Mail, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
type Teacher = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  coverPhotoUrl?: string | null;
  bio?: string | null;
  education?: string | null;
  certifications?: string | null;
  subject?: string | null;
};

export default function ExpertDetail({ teacherId }: { teacherId: string }) {
  const [, navigate] = useLocation();
  const { data: teacher, isLoading, error } = useQuery<Teacher>({
    queryKey: ["/api/teachers/public", teacherId],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#f8fafb]">
        <Navbar />
        <div className="flex items-center justify-center pt-40 pb-20">
          <Loader2 className="w-8 h-8 text-[#1F3A5F] animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#f8fafb]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-32 pb-20 text-center">
          <h2 className="text-2xl font-bold text-[#1F3A5F] mb-4">Expert Not Found</h2>
          <p className="text-slate-500 mb-6">The expert you are looking for does not exist or is no longer available.</p>
          <Button onClick={() => navigate("/experts")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Experts
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const initials = teacher.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "";
  const hasSections = teacher.bio || teacher.education || teacher.certifications;

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Navbar />

      <div className="pt-[72px]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 pb-16">

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => navigate("/experts")}
                className="text-[#1F3A5F] border-slate-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Experts
              </Button>
            </div>

            <Card className="overflow-hidden shadow-lg border-0">
              <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
                {teacher.coverPhotoUrl ? (
                  <>
                    <img
                      src={teacher.coverPhotoUrl}
                      alt={`${teacher.name} cover`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1F3A5F] via-[#2a4a75] to-[#1F3A5F]">
                    <div className="absolute top-6 right-8 w-40 h-40 bg-[#2FBF71]/15 rounded-full blur-3xl" />
                    <div className="absolute bottom-4 left-12 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#2FBF71]/8 rounded-full blur-[80px]" />
                    <svg className="absolute bottom-0 w-full opacity-[0.04]" viewBox="0 0 1440 200" preserveAspectRatio="none">
                      <path d="M0 100 Q360 0 720 100 T1440 100 V200 H0Z" fill="white" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="relative px-6 sm:px-8 pb-6">
                <div className="-mt-16 sm:-mt-20 relative z-10 mb-4">
                  <Avatar className="w-28 h-28 sm:w-32 sm:h-32 ring-4 ring-white shadow-xl">
                    <AvatarImage src={teacher.avatarUrl || undefined} alt={teacher.name} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] text-white text-3xl sm:text-4xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#1F3A5F] leading-tight break-words">
                      {teacher.name}
                    </h1>
                    {teacher.education && (
                      <p className="text-sm text-slate-500 mt-1">{teacher.education}</p>
                    )}
                    {teacher.subject && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F3A5F] bg-[#1F3A5F]/8 px-3 py-1 rounded-full mt-2.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        {teacher.subject}
                      </span>
                    )}
                  </div>

                  <div className="shrink-0 pt-1">
                    <Button
                      onClick={() => navigate("/contact")}
                      className="bg-[#2FBF71] text-white border-0 shadow-md"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Us
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {hasSections ? (
            <div className="mt-6 space-y-6">
              {teacher.bio && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="overflow-hidden shadow-sm border-0">
                    <div className="p-6 sm:p-8">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-md bg-[#1F3A5F]/8 flex items-center justify-center">
                          <User className="w-4 h-4 text-[#1F3A5F]" />
                        </div>
                        <h2 className="text-lg font-semibold text-[#1F3A5F]">About</h2>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                        {teacher.bio}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}

              {teacher.education && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="overflow-hidden shadow-sm border-0">
                    <div className="p-6 sm:p-8">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-md bg-[#2FBF71]/10 flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-[#2FBF71]" />
                        </div>
                        <h2 className="text-lg font-semibold text-[#1F3A5F]">Education</h2>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {teacher.education}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}

              {teacher.certifications && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card className="overflow-hidden shadow-sm border-0">
                    <div className="p-6 sm:p-8">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-md bg-[#2FBF71]/10 flex items-center justify-center">
                          <Award className="w-4 h-4 text-[#2FBF71]" />
                        </div>
                        <h2 className="text-lg font-semibold text-[#1F3A5F]">Certifications</h2>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {teacher.certifications}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6"
            >
              <Card className="overflow-hidden shadow-sm border-0">
                <div className="p-8 text-center">
                  <p className="text-slate-400 text-sm">No additional details available for this expert yet.</p>
                </div>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6"
          >
            <Card className="overflow-hidden shadow-sm border-0 bg-gradient-to-r from-[#1F3A5F] to-[#2a4a75]">
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Interested in learning?</h3>
                  <p className="text-sm text-white/70">Book a free demo class and experience personalized education.</p>
                </div>
                <Button
                  onClick={() => navigate("/contact")}
                  size="lg"
                  className="bg-[#2FBF71] text-white font-semibold border-0 shadow-lg whitespace-nowrap"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </motion.div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
