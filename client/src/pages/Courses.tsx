import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  Search, 
  SlidersHorizontal,
  BookOpen, 
  Clock, 
  Loader2,
  Calculator,
  Atom,
  Laptop,
  Globe2,
  PenLine,
  Palette,
  Sparkles,
  GraduationCap,
  Users,
  ArrowRight,
  ChevronDown,
  X,
  Star,
  Trophy,
  Zap,
  RotateCcw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import FadeInWhenVisible from "../components/FadeInWhenVisible";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course } from "@shared/schema";

const getSubjectIcon = (subject: string) => {
  const subjectLower = subject.toLowerCase();
  if (subjectLower.includes('math')) return Calculator;
  if (subjectLower.includes('science') || subjectLower.includes('physics') || subjectLower.includes('chemistry') || subjectLower.includes('biology')) return Atom;
  if (subjectLower.includes('computer') || subjectLower.includes('coding') || subjectLower.includes('programming')) return Laptop;
  if (subjectLower.includes('nepali') || subjectLower.includes('language')) return Globe2;
  if (subjectLower.includes('english') || subjectLower.includes('ela') || subjectLower.includes('reading') || subjectLower.includes('writing')) return PenLine;
  if (subjectLower.includes('music') || subjectLower.includes('dance') || subjectLower.includes('art')) return Palette;
  return Sparkles;
};

const getSubjectGradient = (subject: string) => {
  const subjectLower = subject.toLowerCase();
  if (subjectLower.includes('math')) return 'from-[#1F3A5F] to-[#2a4a75]';
  if (subjectLower.includes('science') || subjectLower.includes('physics') || subjectLower.includes('chemistry') || subjectLower.includes('biology')) return 'from-[#2FBF71] to-[#25a060]';
  if (subjectLower.includes('computer') || subjectLower.includes('coding') || subjectLower.includes('programming')) return 'from-[#1F3A5F] to-[#3a5a7f]';
  if (subjectLower.includes('nepali') || subjectLower.includes('language')) return 'from-[#2FBF71] to-[#3dd88a]';
  if (subjectLower.includes('english') || subjectLower.includes('ela') || subjectLower.includes('reading') || subjectLower.includes('writing')) return 'from-[#1F3A5F] to-[#2FBF71]';
  if (subjectLower.includes('music') || subjectLower.includes('dance') || subjectLower.includes('art')) return 'from-[#2a4a75] to-[#1F3A5F]';
  return 'from-[#25a060] to-[#2FBF71]';
};

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const { data: backendCourses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses", { active: true }],
    queryFn: async () => {
      const res = await fetch("/api/courses?active=true");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchFromUrl = params.get('search');
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, []);

  const subjects = ["all", ...Array.from(new Set(backendCourses.map(c => c.subject)))];
  const gradeLevels = ["all", "KG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

  const filteredCourses = backendCourses.filter((course) => {
    const matchesSearch = searchQuery === "" ||
                         course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         course.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesGrade = selectedGrade === "all";
    if (!matchesGrade) {
      const courseGrade = course.grade?.toLowerCase() || '';
      const selectedGradeLower = selectedGrade.toLowerCase();
      if (selectedGradeLower === 'kg') {
        matchesGrade = courseGrade === 'kg' || courseGrade === 'kindergarten';
      } else if (selectedGradeLower.startsWith('grade ')) {
        const gradeNumber = selectedGradeLower.replace('grade ', '');
        matchesGrade = courseGrade === gradeNumber || courseGrade === selectedGradeLower;
      } else {
        matchesGrade = courseGrade === selectedGradeLower;
      }
    }
    
    const matchesSubject = selectedSubject === "all" || course.subject === selectedSubject;
    
    return matchesSearch && matchesGrade && matchesSubject;
  });

  const hasActiveFilters = searchQuery !== "" || selectedGrade !== "all" || selectedSubject !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedGrade("all");
    setSelectedSubject("all");
  };

  return (
    <div className="bg-gradient-to-b from-white to-[#f8fafb] text-slate-800 min-h-screen">
      <Navbar />
      
      {/* Header Section */}
      <section className="pt-28 pb-8 lg:pt-32 lg:pb-12 bg-[#1F3A5F] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#2FBF71]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-10 w-56 h-56 bg-[#2FBF71]/5 rounded-full blur-2xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-[#2FBF71]/15 border border-[#2FBF71]/30 text-[#2FBF71] px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <GraduationCap className="w-4 h-4" />
              Quality Education for Every Student
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white mb-6"
            >
              Explore Our <span className="text-[#2FBF71]">Courses</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-8"
            >
              Discover comprehensive learning paths designed for students of all ages.
            </motion.p>
          </div>
        </div>
        
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 36C840 40 960 48 1080 52C1200 56 1320 56 1380 56L1440 56V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V80Z" fill="white"/>
          </svg>
        </div>
      </section>
      
      {/* Search and Filter Section - Premium Design */}
      <section className="-mt-px py-10 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Premium Dark Glass Filter Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="relative rounded-xl overflow-hidden"
          >
            {/* Outer gradient shell */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1F3A5F] via-[#1F3A5F]/90 to-[#142540] shadow-[0_24px_80px_-20px_rgba(15,29,52,0.5)]"></div>
            
            {/* Decorative glow accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#2FBF71]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#2FBF71]/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
            
            {/* Inner glass panel */}
            <div className="relative backdrop-blur-3xl p-6 md:p-8 lg:p-10">
              {/* Floating Headline */}
              <div className="flex flex-col mb-6">
                <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.4em]">Alloria Course Explorer</span>
                <h3 className="text-white text-2xl font-bold tracking-tight">Find Your <span className="text-white/90 underline decoration-[#2FBF71] underline-offset-4">Future.</span></h3>
              </div>

              {/* Asymmetric Composition */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-end">
                
                {/* Search - Primary Focus */}
                <div className="lg:col-span-6 group">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2">
                        <Search className="text-white/40 group-focus-within:text-white transition-colors" size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder="Search by topic, skill, or keyword..."
                        className="w-full pl-14 pr-10 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl focus:ring-0 focus:border-white/30 text-white placeholder:text-white/20 transition-all text-base font-medium shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="lg:col-span-6 grid grid-cols-2 gap-3">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors"></div>
                    <div className="relative p-0.5">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <GraduationCap className="text-white/30 group-hover:text-white transition-colors" size={16} />
                      </div>
                      <select
                        className="w-full pl-10 pr-8 py-4 bg-transparent appearance-none text-white text-xs font-semibold cursor-pointer focus:outline-none"
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                      >
                        {gradeLevels.map((grade) => (
                          <option key={grade} value={grade} className="bg-[#0f1d34] text-white">
                            {grade === "all" ? "All Grades" : grade}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" size={14} />
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors"></div>
                    <div className="relative p-0.5">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <BookOpen className="text-white/30 group-hover:text-white transition-colors" size={16} />
                      </div>
                      <select
                        className="w-full pl-10 pr-8 py-4 bg-transparent appearance-none text-white text-xs font-semibold cursor-pointer focus:outline-none"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                      >
                        {subjects.map((subject) => (
                          <option key={subject} value={subject} className="bg-[#0f1d34] text-white">
                            {subject === "all" ? "All Subjects" : subject}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" size={14} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Active Filters */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {hasActiveFilters ? (
                    <>
                      <div className="px-2.5 py-0.5 bg-white/10 rounded-full border border-white/20 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>
                        <span className="text-[9px] font-bold text-white uppercase tracking-widest">Active</span>
                      </div>
                      <div className="h-3 w-px bg-white/10"></div>
                      <div className="flex items-center gap-2">
                        {searchQuery && (
                          <span className="text-[10px] text-white/70 italic">"{searchQuery}"</span>
                        )}
                        {selectedGrade !== "all" && (
                          <span className="text-[10px] text-white/50">{selectedGrade}</span>
                        )}
                        {selectedSubject !== "all" && (
                          <span className="text-[10px] text-white/50">{selectedSubject}</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em]">Curriculum 2026</span>
                  )}
                </div>

                {hasActiveFilters && (
                  <button 
                    onClick={clearAllFilters}
                    className="text-[9px] font-black text-white/40 hover:text-white uppercase tracking-[0.2em] transition-all flex items-center gap-2 group"
                  >
                    Reset Experience
                    <RotateCcw size={10} className="group-hover:rotate-180 transition-transform duration-700" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-12 lg:py-16 bg-gradient-to-b from-white to-[#f8fafb]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Results Header */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1F3A5F] mb-1 flex items-center gap-3">
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-[#2FBF71]" />
                    Loading Courses...
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-[#2FBF71]/10 rounded-xl">
                      <BookOpen className="w-5 h-5 text-[#2FBF71]" />
                    </span>
                    {filteredCourses.length} Course{filteredCourses.length !== 1 ? 's' : ''} Available
                  </>
                )}
              </h2>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-[#1F3A5F]/10 to-[#2FBF71]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-[#1F3A5F]/40" />
              </div>
              <h3 className="text-2xl font-bold text-[#1F3A5F] mb-3">No courses found</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                We couldn't find any courses matching your criteria. Try adjusting your filters.
              </p>
              <Button 
                onClick={clearAllFilters}
                className="bg-[#2FBF71] hover:bg-[#25a060] text-white px-8 rounded-xl"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All Filters
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredCourses.map((course, index) => {
                const SubjectIcon = getSubjectIcon(course.subject);
                const gradientClass = getSubjectGradient(course.subject);
                
                return (
                  <FadeInWhenVisible key={course.id} delay={index * 0.08}>
                    <motion.div
                      whileHover={{ y: -8, scale: 1.01 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="bg-white rounded-3xl shadow-lg hover:shadow-2xl border border-slate-100 hover:border-[#2FBF71]/20 overflow-hidden h-full flex flex-col group transition-all duration-300"
                    >
                      {/* Course Header with Gradient */}
                      <div className={`h-48 bg-gradient-to-br ${gradientClass} relative overflow-hidden`}>
                        {course.coverImageUrl ? (
                          <>
                            <img 
                              src={course.coverImageUrl} 
                              alt={course.title}
                              loading="lazy"
                              className="w-full h-full object-cover absolute inset-0 group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center relative">
                            {/* Abstract pattern */}
                            <div className="absolute inset-0 opacity-20">
                              <div className="absolute top-4 right-4 w-20 h-20 border-2 border-white/30 rounded-full"></div>
                              <div className="absolute bottom-8 left-8 w-12 h-12 border-2 border-white/20 rounded-lg rotate-12"></div>
                              <div className="absolute top-1/2 left-1/4 w-6 h-6 bg-white/20 rounded-full"></div>
                            </div>
                            <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <SubjectIcon className="w-10 h-10 text-white" />
                            </div>
                          </div>
                        )}
                        
                        {/* Subject Badge - Top Right */}
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                          <div className="flex items-center gap-1.5">
                            <SubjectIcon className="w-3.5 h-3.5 text-[#1F3A5F]" />
                            <span className="text-xs font-semibold text-[#1F3A5F]">{course.subject}</span>
                          </div>
                        </div>
                        
                        {/* Grade Badge - Bottom Left */}
                        <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">
                          <div className="flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-white" />
                            <span className="text-xs font-medium text-white">{course.grade}</span>
                          </div>
                        </div>
                      </div>

                      {/* Course Content */}
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex-grow">
                          <h3 className="text-lg font-bold text-[#1F3A5F] mb-3 line-clamp-2 group-hover:text-[#2FBF71] transition-colors duration-300">
                            {course.title}
                          </h3>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-5 leading-relaxed">
                            {course.description || "Explore this comprehensive course designed to help you master new skills."}
                          </p>

                          {/* Course Features */}
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            {course.duration && (
                              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full">
                                <Clock className="w-3.5 h-3.5 text-[#2FBF71]" />
                                <span className="text-slate-600 font-medium">{course.duration}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full">
                              <Users className="w-3.5 h-3.5 text-[#2FBF71]" />
                              <span className="text-slate-600 font-medium">1-on-1</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full">
                              <Zap className="w-3.5 h-3.5 text-[#2FBF71]" />
                              <span className="text-slate-600 font-medium">Live</span>
                            </div>
                          </div>
                        </div>

                        {/* View Details Button */}
                        <div className="pt-6 mt-6 border-t border-slate-100">
                          <Link href={`/course/${course.id}`}>
                            <Button 
                              className="w-full bg-[#1F3A5F] hover:bg-[#2FBF71] text-white rounded-xl h-12 font-semibold group/btn transition-all duration-300"
                              data-testid={`button-view-${course.id}`}
                            >
                              <span>View Course Details</span>
                              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  </FadeInWhenVisible>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-[#1F3A5F] via-[#2a4a75] to-[#1F3A5F] rounded-3xl p-8 md:p-14 text-center relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#2FBF71]/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#2FBF71]/15 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-5 py-2.5 rounded-full text-sm font-medium mb-6 border border-white/20">
                <Star className="w-4 h-4 text-[#2FBF71] fill-[#2FBF71]" />
                Start Your Journey
              </div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-white">
                Ready to Start <span className="text-[#2FBF71]">Learning?</span>
              </h3>
              <p className="text-white/80 text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                Join hundreds of students who are already advancing their skills with our expert-led courses.
              </p>
              <Link href="/contact">
                <Button 
                  size="lg"
                  className="bg-[#2FBF71] hover:bg-[#25a060] text-white py-4 px-10 font-semibold rounded-xl shadow-xl shadow-[#2FBF71]/30 transition-all hover:shadow-2xl hover:scale-105 h-auto text-base"
                  data-testid="button-get-started"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Started Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
