import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, Clock, Users, ArrowLeft, CheckCircle2, 
  Play, Award, Target, Search, GraduationCap,
  Lightbulb, Calendar, Loader2, Star, Sparkles,
  ArrowRight, Shield, Zap, BookMarked, Trophy,
  MessageCircle, Phone
} from "lucide-react";
import FadeInWhenVisible from "../components/FadeInWhenVisible";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course, User } from "@shared/schema";

interface CourseWithTeacher extends Course {
  teacher?: User | null;
}

export default function CourseDetail() {
  const params = useParams();
  const id = params.id;

  const { data: course, isLoading, error } = useQuery<CourseWithTeacher>({
    queryKey: ["/api/courses", id],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Course not found");
        }
        throw new Error("Failed to fetch course");
      }
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-b from-white to-[#f8fafb] text-slate-800 min-h-screen">
        <Navbar />
        <section className="pt-28 pb-16 bg-[#1F3A5F] relative">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <Skeleton className="h-6 w-32 mb-6 bg-white/20" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex gap-3">
                  <Skeleton className="h-8 w-24 rounded-full bg-white/20" />
                  <Skeleton className="h-8 w-24 rounded-full bg-white/20" />
                </div>
                <Skeleton className="h-14 w-3/4 bg-white/20" />
                <Skeleton className="h-24 w-full bg-white/20" />
              </div>
              <div className="lg:col-span-1">
                <Skeleton className="h-80 w-full rounded-3xl bg-white/20" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none">
              <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 36C840 40 960 48 1080 52C1200 56 1320 56 1380 56L1440 56V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V80Z" fill="white"/>
            </svg>
          </div>
        </section>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="bg-gradient-to-b from-white to-[#f8fafb] text-slate-800 min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-[#1F3A5F]/10 to-[#2FBF71]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-[#1F3A5F]/40" />
            </div>
            <h2 className="text-3xl font-bold text-[#1F3A5F] mb-4">Course Not Found</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">The course you're looking for doesn't exist or has been removed.</p>
            <Link href="/courses">
              <Button className="bg-[#2FBF71] hover:bg-[#25a060] text-white px-8 rounded-xl" data-testid="button-browse-courses">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse All Courses
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const curriculum = course.curriculum || [];

  return (
    <div className="bg-gradient-to-b from-white to-[#f8fafb] text-slate-800 min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-28 pb-20 lg:pt-32 lg:pb-28 bg-[#1F3A5F] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-80 h-80 bg-[#2FBF71]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-[#2FBF71]/5 rounded-full blur-2xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors group"
              data-testid="link-back-to-courses"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ArrowLeft size={20} />
              </div>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/15 backdrop-blur-sm text-white rounded-full text-sm font-medium border border-white/20">
                    <BookOpen className="w-4 h-4" />
                    {course.subject}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2FBF71]/20 text-[#2FBF71] rounded-full text-sm font-medium border border-[#2FBF71]/30">
                    <GraduationCap className="w-4 h-4" />
                    {course.grade}
                  </span>
                  {course.isActive && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2FBF71] text-white rounded-full text-sm font-medium">
                      <Zap className="w-4 h-4" />
                      Enrolling Now
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                  {course.title}
                </h1>
                {course.description && (
                  <p className="text-lg text-white/80 leading-relaxed max-w-2xl">
                    {course.description}
                  </p>
                )}

                {/* Quick Stats */}
                <div className="flex flex-wrap items-center gap-6 pt-2">
                  {course.duration && (
                    <div className="flex items-center gap-2 text-white/90">
                      <Clock className="w-5 h-5 text-[#2FBF71]" />
                      <span className="font-medium">{course.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-white/90">
                    <Users className="w-5 h-5 text-[#2FBF71]" />
                    <span className="font-medium">1-on-1 Sessions</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <Award className="w-5 h-5 text-[#2FBF71]" />
                    <span className="font-medium">Certificate Included</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar - Enroll Card */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-white/50 relative overflow-hidden"
              >
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1F3A5F] via-[#2FBF71] to-[#1F3A5F]"></div>
                
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#2FBF71] to-[#25a060] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#2FBF71]/30">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1F3A5F] mb-2">Ready to Start?</h3>
                  <p className="text-slate-600 text-sm">Begin your learning journey today</p>
                </div>

                <Link href="/contact">
                  <Button
                    className="w-full mb-5 bg-[#2FBF71] hover:bg-[#25a060] text-white h-12 rounded-xl font-semibold shadow-lg shadow-[#2FBF71]/25 transition-all hover:shadow-xl"
                    size="lg"
                    data-testid="button-enroll-now"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Enroll Now
                  </Button>
                </Link>

                <div className="space-y-3">
                  {[
                    "Live 1-on-1 sessions",
                    "Certificate of completion",
                    "Expert instructor support",
                    "Progress tracking",
                    "Flexible scheduling"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-[#2FBF71]/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2FBF71]" />
                      </div>
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-[#2FBF71]" />
                    <span>Questions? Call +1 (720) 242-6452</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 36C840 40 960 48 1080 52C1200 56 1320 56 1380 56L1440 56V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V80Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Course Content Section */}
      <section className="-mt-px py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Course Image */}
              {course.coverImageUrl && (
                <FadeInWhenVisible>
                  <div className="rounded-3xl overflow-hidden shadow-xl ring-1 ring-slate-100">
                    <img
                      src={course.coverImageUrl}
                      alt={course.title}
                      className="w-full h-72 md:h-96 object-cover"
                    />
                  </div>
                </FadeInWhenVisible>
              )}

              {/* Philosophy */}
              {course.philosophy && (
                <FadeInWhenVisible delay={0.1}>
                  <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#2FBF71] to-[#25a060] rounded-xl flex items-center justify-center shadow-lg shadow-[#2FBF71]/20">
                        <Lightbulb className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-[#1F3A5F]">Course Philosophy</h2>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-base md:text-lg">
                      {course.philosophy}
                    </p>
                  </div>
                </FadeInWhenVisible>
              )}

              {/* Learning Objectives */}
              {course.learningObjectives && (
                <FadeInWhenVisible delay={0.15}>
                  <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] rounded-xl flex items-center justify-center shadow-lg shadow-[#1F3A5F]/20">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-[#1F3A5F]">Learning Objectives</h2>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-base md:text-lg whitespace-pre-line">
                      {course.learningObjectives}
                    </p>
                  </div>
                </FadeInWhenVisible>
              )}

              {/* Curriculum */}
              {curriculum.length > 0 && (
                <FadeInWhenVisible delay={0.2}>
                  <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#2FBF71] to-[#25a060] rounded-xl flex items-center justify-center shadow-lg shadow-[#2FBF71]/20">
                        <BookMarked className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-[#1F3A5F]">Curriculum</h2>
                        <p className="text-sm text-slate-500">{curriculum.length} modules</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {curriculum.map((section, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-[#2FBF71]/30 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] text-white rounded-xl flex items-center justify-center font-bold text-sm group-hover:from-[#2FBF71] group-hover:to-[#25a060] transition-all">
                              {String(index + 1).padStart(2, '0')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-[#1F3A5F] mb-1 group-hover:text-[#2FBF71] transition-colors">{section.heading}</h3>
                              {section.description && (
                                <p className="text-slate-600 text-sm line-clamp-2">{section.description}</p>
                              )}
                            </div>
                            <Play className="w-5 h-5 text-slate-300 group-hover:text-[#2FBF71] transition-colors flex-shrink-0" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </FadeInWhenVisible>
              )}

              {/* Practical Sessions */}
              {course.practicalSessions && (
                <FadeInWhenVisible delay={0.25}>
                  <div className="bg-gradient-to-br from-[#1F3A5F] via-[#2a4a75] to-[#1F3A5F] text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#2FBF71]/20 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-[#2FBF71]" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold">Practical Sessions</h2>
                      </div>
                      <p className="text-white/90 leading-relaxed text-base md:text-lg whitespace-pre-line">
                        {course.practicalSessions}
                      </p>
                    </div>
                  </div>
                </FadeInWhenVisible>
              )}

              {/* Prerequisites */}
              {course.prerequisites && (
                <FadeInWhenVisible delay={0.3}>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 md:p-8 border border-amber-100">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-[#1F3A5F]">Prerequisites</h2>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-base md:text-lg whitespace-pre-line">
                      {course.prerequisites}
                    </p>
                  </div>
                </FadeInWhenVisible>
              )}
            </div>

            {/* Sidebar - Course Details (Sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Course Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100"
                >
                  <h3 className="font-bold text-lg text-[#1F3A5F] mb-5 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#2FBF71]" />
                    Course Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 bg-[#1F3A5F]/10 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-[#1F3A5F]" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Subject</div>
                        <div className="font-semibold text-[#1F3A5F]">{course.subject}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 bg-[#2FBF71]/10 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-[#2FBF71]" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Grade Level</div>
                        <div className="font-semibold text-[#1F3A5F]">{course.grade}</div>
                      </div>
                    </div>
                    {course.duration && (
                      <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 bg-[#1F3A5F]/10 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-[#1F3A5F]" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Duration</div>
                          <div className="font-semibold text-[#1F3A5F]">{course.duration}</div>
                        </div>
                      </div>
                    )}
                    {course.startDate && (
                      <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 bg-[#2FBF71]/10 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-[#2FBF71]" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Start Date</div>
                          <div className="font-semibold text-[#1F3A5F]">
                            {new Date(course.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Quick Enroll CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-gradient-to-br from-[#2FBF71] to-[#25a060] rounded-3xl p-6 text-white shadow-xl shadow-[#2FBF71]/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-6 h-6" />
                    <h3 className="font-bold text-lg">Free Demo Class</h3>
                  </div>
                  <p className="text-white/90 text-sm mb-5">Try before you commit! Book a free demo session with our expert instructor.</p>
                  <Link href="/contact">
                    <Button
                      variant="secondary"
                      className="w-full bg-white text-[#2FBF71] hover:bg-white/90 font-semibold rounded-xl h-11"
                      data-testid="button-book-demo"
                    >
                      Book Free Demo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-white to-[#f8fafb]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-[#1F3A5F] via-[#2a4a75] to-[#1F3A5F] rounded-3xl p-8 md:p-12 relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#2FBF71]/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#2FBF71]/15 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
                <Star className="w-4 h-4 text-[#2FBF71] fill-[#2FBF71]" />
                Start Learning Today
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-white">
                Ready to Begin Your <span className="text-[#2FBF71]">Journey?</span>
              </h3>
              <p className="text-white/80 text-base md:text-lg mb-8 max-w-xl mx-auto">
                Join our community of learners and unlock your potential with expert-led, personalized education.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button 
                    size="lg" 
                    className="bg-[#2FBF71] hover:bg-[#25a060] text-white px-8 rounded-xl font-semibold shadow-lg shadow-[#2FBF71]/30 h-12"
                    data-testid="button-get-started-bottom"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Get Started
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-2 border-white/30 text-white hover:bg-white/10 px-8 rounded-xl font-semibold h-12"
                    data-testid="button-browse-more"
                  >
                    Browse More Courses
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
