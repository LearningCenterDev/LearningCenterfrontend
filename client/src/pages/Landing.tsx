import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  Plus,
  MessageCircle,
  Users,
  BookOpen,
  Phone,
  Star,
  Calculator,
  FlaskConical,
  Monitor,
  Languages,
  BookText,
  Music,
  Sparkles,
  Play,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  HelpCircle,
  Heart,
  Zap,
  Award,
  Shield,
  FileText,
  ExternalLink,
  Download,
  Lock,
  Brain,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import logoImage from "@assets/Favicon.png";
import sajanImage from "@assets/sajan_1768460469797.jpeg";
import sandipImage from "@assets/image_1768460673012.png";
import friendlySupport1 from "@assets/stock_images/friendly_customer_su_913e9b1a.jpg";
import knowledgeImage from "@assets/Knowledge_1764229471006.png";
import nepaliImage from "@assets/nepali-consonants_1767084064077.png";
import mathImage from "@assets/stock_images/mathematics_learning_e6bbcfef.jpg";
import scienceImage from "@assets/stock_images/science_lab_class_wi_a4acb6ba.jpg";
import artsImage from "@assets/Music_class_1767084337444.png";
import studentsImage from "@assets/stock_images/students_learning_to_0c3504aa.jpg";
import heroImage1 from "@assets/WhatsApp_Image_2026-02-02_at_12.24.06_1770093951729.jpeg";
import heroImage2 from "@assets/hero-image-2_1764757919151.jpg";
import artsColoringImage from "@assets/stock_images/child_doing_arts_and_3bdb245e.jpg";
import computerImage from "@assets/stock_images/child_using_laptop_c_8ead0965.jpg";
import englishImage from "@assets/englishImage_1767084544521.jpg";
import excitedKidImage from "@assets/stock_images/excited_kid_studying_14e22fda.jpg";
import aiImage from "@assets/stock_images/child_learning_ai_te_c57ea010.jpg";

import { useQuery } from "@tanstack/react-query";

type FeaturedTeacher = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  education?: string | null;
  certifications?: string | null;
  subject?: string | null;
};

function TeacherProfileModal({ teacher, open, onClose }: { teacher: FeaturedTeacher | null; open: boolean; onClose: () => void }) {
  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Teacher Profile</DialogTitle>
          <DialogDescription className="sr-only">Details about {teacher.name}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center text-center pt-2">
          <Avatar className="w-28 h-28 ring-[3px] ring-[#2FBF71] ring-offset-[3px] ring-offset-white shadow-lg mb-4">
            <AvatarImage src={teacher.avatarUrl || undefined} alt={teacher.name} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] text-white text-3xl font-bold">
              {teacher.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-bold text-[#1F3A5F]">{teacher.name}</h3>
          {teacher.education && (
            <p className="text-sm text-[#2FBF71] font-semibold mt-1">{teacher.education}</p>
          )}
          {teacher.subject && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F3A5F] bg-[#1F3A5F]/8 px-3 py-1 rounded-full mt-2">
              <BookOpen className="w-3.5 h-3.5" />
              {teacher.subject}
            </span>
          )}
        </div>

        {teacher.bio && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-[#1F3A5F] mb-2">About</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{teacher.bio}</p>
          </div>
        )}

        {teacher.certifications && (
          <div className="mt-3 bg-gradient-to-r from-[#f0faf4] to-[#f8fafb] border border-[#2FBF71]/15 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Award className="w-3.5 h-3.5 text-[#2FBF71] shrink-0" />
              <span className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider">Certifications</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{teacher.certifications}</p>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}

function ExpertsSection() {
  const [, navigate] = useLocation();
  const { data: teachers = [], isLoading } = useQuery<FeaturedTeacher[]>({
    queryKey: ["/api/teachers/featured"],
  });
  const [selectedTeacher, setSelectedTeacher] = useState<FeaturedTeacher | null>(null);

  if (isLoading || teachers.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-[#f8fafb] to-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#2FBF71]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#1F3A5F]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 bg-[#1F3A5F]/10 text-[#1F3A5F] px-4 py-2 rounded-full text-sm font-medium">
              <Award className="w-4 h-4" />
              Meet Our Team
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1F3A5F] mb-3 sm:mb-4">
            Our Expert Teachers
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base px-2 sm:px-0">
            Passionate educators dedicated to nurturing every student's potential with personalized attention and proven expertise.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {teachers.map((teacher, index) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="group cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedTeacher(teacher)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedTeacher(teacher); } }}
            >
              <Card className="overflow-visible border-slate-200/80 hover:shadow-xl transition-all duration-500 h-full">
                <div className="p-5 flex flex-col items-center text-center h-full">
                  <Avatar className="w-24 h-24 ring-[3px] ring-[#2FBF71] ring-offset-[3px] ring-offset-white shadow-lg mb-4">
                    <AvatarImage src={teacher.avatarUrl || undefined} alt={teacher.name} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] text-white text-2xl font-bold">
                      {teacher.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <h3 className="text-lg font-bold text-[#1F3A5F] group-hover:text-[#2FBF71] transition-colors">
                    {teacher.name}
                  </h3>

                  {teacher.subject && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1F3A5F] bg-[#1F3A5F]/8 px-2.5 py-1 rounded-full mt-2">
                      <BookOpen className="w-3 h-3" />
                      {teacher.subject}
                    </span>
                  )}

                  <p className="text-[11px] text-center text-[#2FBF71] font-medium mt-auto pt-3 group-hover:underline">
                    View Profile
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Button
            onClick={() => navigate("/experts")}
            size="lg"
            className="px-8 bg-[#1F3A5F] text-white font-semibold shadow-lg border-0"
          >
            View All Experts
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <TeacherProfileModal
        teacher={selectedTeacher}
        open={!!selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
      />
    </section>
  );
}

const speechMessages = [
  { text: "Learning is fun!", icon: Star },
  { text: "I love math!", icon: Calculator },
  { text: "Science rocks!", icon: FlaskConical },
  { text: "Let's explore!", icon: Sparkles },
  { text: "I got this!", icon: Award },
];

function SpeechBubble() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % speechMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentMessage = speechMessages[currentIndex];
  const IconComponent = currentMessage.icon;

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.8, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -5 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-2xl px-4 py-3 shadow-xl relative"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <IconComponent className="w-4 h-4 text-[#2FBF71]" />
            </motion.div>
            <span className="text-sm font-semibold text-[#1F3A5F] whitespace-nowrap">
              {currentMessage.text}
            </span>
          </div>
          {/* Speech bubble tail */}
          <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white rotate-45 shadow-lg" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} />
        </motion.div>
      </AnimatePresence>
      
      {/* Typing indicator dots */}
      <motion.div
        className="absolute -bottom-6 left-8 flex gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-white/60 rounded-full"
            animate={{ y: [0, -3, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'pdf' | 'video'>('pdf');
  const blurTimeoutRef = useRef<number | null>(null);

  const pdfUrl = "/Protecting-Our-Children-Guide.pdf";
  const videoEmbedUrl = "https://drive.google.com/file/d/1b9heXm5K21ByTkffvUuUzqDGl2XtwcZK/preview";

  const suggestions = [
    "Design",
    "Development",
    "Business",
    "Marketing",
    "Data Science",
    "Lifestyle",
  ];

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(searchQuery.toLowerCase()) &&
      searchQuery.trim() !== "",
  );

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/courses");
    }
  };

  const categories = [
    { name: "Mathematics", icon: "🔢" },
    { name: "English", icon: "📖" },
    { name: "Science", icon: "🔬" },
    { name: "History", icon: "📜" },
    { name: "Geography", icon: "🌍" },
    { name: "Dance", icon: "💃" },
    { name: "Art", icon: "🎨" },
    { name: "Music", icon: "🎵" },
  ];

  const courses: { title: string; description: string; icon: LucideIcon; grade: string; color: string; image: string; loading?: "lazy" | "eager" }[] = [
    {
      title: "Math",
      description: "Clear explanations, concept understanding, and guided practice.",
      icon: Calculator,
      grade: "Grades 1-10",
      color: "from-[#1F3A5F] to-[#2a4a75]",
      image: mathImage,
      loading: "lazy" as const,
    },
    {
      title: "Science",
      description: "Helping students make sense of science instead of memorizing it.",
      icon: FlaskConical,
      grade: "Grades 1-10",
      color: "from-[#2FBF71] to-[#25a060]",
      image: scienceImage,
      loading: "lazy" as const,
    },
    {
      title: "Computer Science",
      description: "Learn coding, digital literacy, and computer fundamentals.",
      icon: Monitor,
      grade: "Beginner to Advanced",
      color: "from-[#1F3A5F] to-[#3a5a7f]",
      image: computerImage,
      loading: "lazy" as const,
    },
    {
      title: "AI & Technology",
      description: "Discover artificial intelligence, robotics, and future tech skills.",
      icon: Brain,
      grade: "Beginner to Advanced",
      color: "from-[#2FBF71] to-[#1F3A5F]",
      image: aiImage,
      loading: "lazy" as const,
    },
    {
      title: "English Language Arts",
      description: "Reading, writing, grammar, comprehension, and communication skills.",
      icon: BookText,
      grade: "Beginner to Advanced",
      color: "from-[#2FBF71] to-[#3dd88a]",
      image: englishImage,
      loading: "lazy" as const,
    },
    {
      title: "Nepali Language",
      description: "Learn or improve reading, writing, and speaking in Nepali.",
      icon: Languages,
      grade: "Beginner to Advanced",
      color: "from-[#1F3A5F] to-[#2FBF71]",
      image: nepaliImage,
      loading: "lazy" as const,
    },
    {
      title: "Music & Dance",
      description: "Learn rhythm, steps, and basics.",
      icon: Music,
      grade: "Beginner to Intermediate",
      color: "from-[#2a4a75] to-[#1F3A5F]",
      image: artsImage,
      loading: "lazy" as const,
    },
    {
      title: "On-Demand Subjects",
      description: "Support for any extra subject.",
      icon: Sparkles,
      grade: "Based on Request",
      color: "from-[#25a060] to-[#2FBF71]",
      image: excitedKidImage,
      loading: "lazy" as const,
    },
  ];

  const partners = [
    { name: "Sarah Johnson", role: "Instructor" },
    { name: "David Martinez", role: "Instructor" },
    { name: "Emily Watson", role: "Instructor" },
    { name: "Victoria Clark", role: "Instructor" },
  ];

  const faqs = [
    {
      q: "How do I get started?",
      a: "Step 1: Fill out our online registration form. Step 2: Wait for our team to contact you. Step 3: We will fix a suitable time for your demo class. Step 4: A Zoom link will be sent to the student's email.",
    },
    {
      q: "What do I need for the demo class?",
      a: "You need: A device (laptop, tablet, or phone), Zoom installed, Working microphone, and a Stable internet connection.",
    },
    {
      q: "When will I get the Zoom link?",
      a: "The Zoom link will be shared through email once the demo timing is fixed.",
    },
    {
      q: "How long do I have to wait after filling the form?",
      a: "Our team generally contacts you within 24 hours.",
    },
    {
      q: "How are class timings decided?",
      a: "Timings are finalized based on discussion with the parent/student and teacher availability.",
    },
    {
      q: "How long is the class?",
      a: "The demo class usually lasts 45-60 minutes, depending on the subject and level.",
    },
    {
      q: "Is the demo class free?",
      a: "Yes, the demo class is completely free.",
    },
    {
      q: "Which subjects do you teach?",
      a: "We offer one-on-one classes for: Math, Science, English, Computer Science, and more (based on demand and level).",
    },
    {
      q: "How many students are in one class?",
      a: "Our classes are always 100% one-on-one.",
    },
    {
      q: "When do classes start after the demo?",
      a: "Classes start as soon as you confirm and the schedule is finalized.",
    },
    {
      q: "How do payments work?",
      a: "After the demo, we discuss packages and payment options. You can choose the plan that suits you.",
    },
    {
      q: "Can I change the class timings later?",
      a: "Yes, you can request a timing adjustment, and we will coordinate with the teacher.",
    },
    {
      q: "What if I miss a class?",
      a: "Missed classes can be rescheduled based on teacher availability.",
    },
  ];

  return (
    <div className="text-slate-800 bg-gradient-to-b from-white to-[#f8fafb]">
      <Navbar />
      {/* ============ HERO SECTION ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1F3A5F] via-[#2a4a75] to-[#1F3A5F]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 pt-28 pb-24 lg:pt-32 lg:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center w-full">
            {/* Left Side - Content */}
            <div className="space-y-5 text-center lg:text-left order-2 lg:order-1">
              {/* Premium Badge */}
              <div className="flex justify-center lg:justify-start">
                <div className="inline-flex items-center gap-2 bg-[#2FBF71]/15 border border-[#2FBF71]/30 text-white px-4 py-2 rounded-full text-sm font-medium">
                  <GraduationCap className="w-4 h-4 text-[#2FBF71]" />
                  <span>Trusted by 75+ Families</span>
                  <Star className="w-4 h-4 text-[#2FBF71] fill-[#2FBF71]" />
                </div>
              </div>
              
              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight text-white font-bold">
                Unlock Your Child's
                <span className="block text-[#2FBF71] mt-2">Brilliance!</span>
              </h1>
              
              {/* Description */}
              <p className="text-white/80 text-base lg:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0 px-2 sm:px-0">Nepali, Math, Science, Computer Science, Coding, Arts & Music Made Magical. From KG to Middle School - Where Learning Feels Like Play!</p>
              
              {/* Feature highlights */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-center lg:justify-start text-sm">
                <div className="flex items-center gap-2 text-white/90">
                  <CheckCircle2 className="w-4 h-4 text-[#2FBF71]" />
                  <span>1-on-1 Classes</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <CheckCircle2 className="w-4 h-4 text-[#2FBF71]" />
                  <span>Expert Teachers</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <CheckCircle2 className="w-4 h-4 text-[#2FBF71]" />
                  <span>Free Demo Class</span>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 pt-2 justify-center lg:justify-start">
                <Button
                  onClick={() => navigate("/contact")}
                  size="lg"
                  className="w-full sm:w-auto px-8 bg-[#2FBF71] text-white font-semibold shadow-lg border-0"
                  data-testid="button-enroll-hero"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  onClick={() => navigate("/courses")}
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto px-8 bg-white/5 backdrop-blur-sm border-2 border-white/40 text-white font-semibold"
                  data-testid="button-explore-hero"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Explore Courses
                </Button>
              </div>
              
              {/* Phone Numbers */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start pt-2">
                {/* Number 1 */}
                <a href="tel:+17202436452" className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 w-full sm:w-auto no-underline transition-all duration-200 hover:bg-white/20 active:scale-[0.97]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-[#2FBF71] shadow-lg flex-shrink-0">
                    <img src={sandipImage} alt="Sandip Poudel" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white/80 text-xs sm:text-sm font-medium">Sandip Poudel</span>
                    <span className="text-white font-bold text-base sm:text-lg tracking-wide">+1 (720) 243-6452</span>
                  </div>
                </a>

                {/* Number 2 */}
                <a href="tel:+16464366275" className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 w-full sm:w-auto no-underline transition-all duration-200 hover:bg-white/20 active:scale-[0.97]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-[#2FBF71] shadow-lg flex-shrink-0">
                    <img src={sajanImage} alt="Sajan Poudel" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white/80 text-xs sm:text-sm font-medium">Sajan Poudel</span>
                    <span className="text-white font-bold text-base sm:text-lg tracking-wide">+1 (646) 436-6275</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Right Side - Animated Hero with Speaking Character */}
            <div className="relative order-1 lg:order-2 flex items-center justify-center px-4 sm:px-0">
              <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-lg mx-auto">
                {/* Animated glow effect behind image */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#2FBF71]/30 to-[#1F3A5F]/30 rounded-3xl blur-3xl"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                
                {/* Main Image with subtle animation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="relative z-10"
                >
                  <img 
                    src={heroImage1} 
                    alt="Child learning and having fun" 
                    className="w-full h-auto object-cover rounded-3xl shadow-2xl ring-4 ring-white/20"
                    loading="eager"
                    width="600"
                    height="400"
                  />
                </motion.div>
                
                {/* Animated Speech Bubble - Top */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
                  className="absolute -top-4 left-2 sm:-top-8 sm:left-8 z-30 scale-75 sm:scale-100"
                >
                  <SpeechBubble />
                </motion.div>
                
                {/* Floating Reaction Bubbles - Hidden on small screens */}
                <motion.div
                  className="absolute top-1/4 right-0 sm:-right-6 z-20 hidden sm:block"
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="bg-white rounded-full p-2.5 shadow-lg">
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  </div>
                </motion.div>
                
                <motion.div
                  className="absolute top-1/2 left-0 sm:-left-5 z-20 hidden sm:block"
                  animate={{
                    y: [0, -6, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                >
                  <div className="bg-white rounded-full p-2.5 shadow-lg">
                    <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </div>
                </motion.div>
                
                {/* Floating stats card with animation */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute -bottom-2 left-0 sm:-bottom-6 sm:-left-6 z-20 bg-white rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-xl scale-75 sm:scale-100 origin-bottom-left"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <motion.div 
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-[#2FBF71] rounded-lg flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </motion.div>
                    <div>
                      <div className="text-[#1F3A5F] font-bold text-base sm:text-lg">95%</div>
                      <div className="text-slate-500 text-[10px] sm:text-xs">Success Rate</div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Floating badge - top right with animation */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="absolute -top-2 right-0 sm:-top-4 sm:-right-4 z-20 scale-75 sm:scale-100 origin-top-right"
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="bg-[#2FBF71] text-white rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">30+ Courses</span>
                    </div>
                  </motion.div>
                </motion.div>
                
                {/* Award badge - bottom right */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute bottom-6 sm:bottom-8 right-0 sm:-right-4 z-20 scale-75 sm:scale-100 origin-bottom-right"
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-2 sm:p-3 shadow-lg"
                  >
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom wave transition */}
        <div className="absolute -bottom-px left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 36C840 40 960 48 1080 52C1200 56 1320 56 1380 56L1440 56V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V80Z" fill="white"/>
          </svg>
        </div>
      </section>
      {/* ============ POPULAR COURSES ============ */}
      <section className="-mt-px py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 bg-[#2FBF71]/10 text-[#2FBF71] px-4 py-2 rounded-full text-sm font-medium">
                <BookOpen className="w-4 h-4" />
                What We Offer
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1F3A5F] mb-3 sm:mb-4 px-2 sm:px-0">Our Popular Courses</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base px-2 sm:px-0">Explore our carefully designed courses that make learning fun and effective for students of all levels.</p>
          </div>
          
          {/* Course Cards Grid - Premium Image-based Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {courses.map((course, index) => {
              const IconComponent = course.icon;
              return (
                <motion.div
                  key={course.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative bg-white rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500"
                  onClick={() => navigate("/courses")}
                  data-testid={`course-${course.title}`}
                >
                  {/* Image Container with Overlay */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={course.image} 
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading={course.loading || "eager"}
                    />
                    {/* Floating Icon Badge */}
                    <motion.div 
                      className="absolute top-4 right-4 z-10"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        <IconComponent className="w-6 h-6 text-[#1F3A5F]" />
                      </div>
                    </motion.div>
                    
                    {/* Grade Badge on Image */}
                    <div className="absolute bottom-4 left-4 z-10">
                      <span className="text-xs font-bold text-[#1F3A5F] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-white">
                        {course.grade}
                      </span>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-5 relative">
                    {/* Decorative accent line */}
                    <div className={`absolute top-0 left-5 right-5 h-1 bg-gradient-to-r ${course.color} rounded-full -translate-y-1/2`} />
                    
                    {/* Title */}
                    <h3 className="text-lg font-bold text-[#1F3A5F] mb-2 group-hover:text-[#2FBF71] transition-colors duration-300">
                      {course.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                    
                    {/* CTA Row */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <span className="text-sm font-semibold text-[#2FBF71]">Learn More</span>
                      <motion.div
                        className="w-8 h-8 rounded-full bg-[#2FBF71]/10 flex items-center justify-center group-hover:bg-[#2FBF71] transition-colors duration-300"
                        whileHover={{ x: 3 }}
                      >
                        <ArrowRight className="w-4 h-4 text-[#2FBF71] group-hover:text-white transition-colors duration-300" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* View All Button */}
          <div className="text-center mt-8 sm:mt-12 mb-16 sm:mb-20">
            <Button
              onClick={() => navigate("/courses")}
              variant="outline"
              size="lg"
              className="border-2 border-[#1F3A5F] text-[#1F3A5F] font-semibold px-8"
              data-testid="button-view-all-courses"
            >
              View All Courses
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ============ OUR EXPERTS ============ */}
      <ExpertsSection />

      {/* ============ CHILD SAFETY & MORE ============ */}
      <section className="py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Child Safety CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-6xl mx-auto mb-24"
          >
            <div className="relative overflow-hidden group py-12">
              <div className="relative z-10 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div className="space-y-6 text-center md:text-left">
                  <div className="flex justify-center md:justify-start">
                    <div className="inline-flex items-center gap-2 text-[#2FBF71] text-sm font-bold tracking-wide uppercase">
                      <Shield className="w-4 h-4" />
                      Premium Safety Standard
                    </div>
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold text-[#1F3A5F] leading-tight">
                    Protecting Our <span className="text-[#2FBF71]">Children</span>
                  </h3>
                  
                  <p className="text-slate-600 text-base sm:text-lg md:text-xl leading-relaxed px-2 sm:px-0">
                    Safety isn't just a feature; it's our foundational promise. We've built a world-class environment where your child's well-being is guarded by expert protocols and constant care.
                  </p>

                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4 py-4">
                    <div className="flex items-center justify-center md:justify-start gap-3 text-[#1F3A5F] font-medium">
                      <CheckCircle2 className="w-5 h-5 text-[#2FBF71] flex-shrink-0" />
                      <span>Vetted Educators</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-3 text-[#1F3A5F] font-medium">
                      <CheckCircle2 className="w-5 h-5 text-[#2FBF71] flex-shrink-0" />
                      <span>Secure Platforms</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-4 justify-center md:justify-start">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setViewMode('pdf');
                        setPdfModalOpen(true);
                      }}
                      className="border-2 border-[#1F3A5F] text-[#1F3A5F] font-semibold px-6 sm:px-8 rounded-xl flex items-center justify-center w-full sm:w-auto"
                      data-testid="button-protecting-pdf"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      View Safety Guide
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setViewMode('video');
                        setPdfModalOpen(true);
                      }}
                      className="border-2 border-[#1F3A5F] text-[#1F3A5F] font-semibold px-6 sm:px-8 rounded-xl flex items-center justify-center w-full sm:w-auto"
                      data-testid="button-protecting-video"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Watch Video
                    </Button>
                  </div>
                </div>

                <div className="relative flex justify-center order-first md:order-last mt-4 md:mt-0">
                  <motion.div 
                    className="relative"
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-[#2FBF71]/10 rounded-[2rem] sm:rounded-[3rem] rotate-12 absolute inset-0 blur-2xl" />
                    <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] rounded-[2rem] sm:rounded-[3rem] flex items-center justify-center shadow-2xl relative z-10 border-4 border-white">
                      <Shield className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 text-white drop-shadow-lg" />
                    </div>

                    {/* Floating Protection Elements */}
                    <motion.div 
                      className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 bg-white rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-xl z-20"
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: [0, 5, 0]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-[#2FBF71] fill-[#2FBF71]" />
                    </motion.div>

                    <motion.div 
                      className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-xl z-20"
                      animate={{ 
                        y: [0, 10, 0],
                        rotate: [0, -5, 0]
                      }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    >
                      <Star className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 fill-yellow-400" />
                    </motion.div>

                    <motion.div 
                      className="absolute top-1/2 -left-8 sm:-left-12 -translate-y-1/2 bg-[#2FBF71] rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-xl z-20"
                      animate={{ 
                        x: [0, -10, 0],
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    >
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Child Safety Dialog */}
      <Dialog open={pdfModalOpen} onOpenChange={(open) => {
        setPdfModalOpen(open);
        if (!open) setViewMode('pdf');
      }}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-6" data-testid="dialog-protecting-guide">
          <DialogHeader className="flex-shrink-0 pb-4 pr-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-[#1F3A5F]">Protecting Our Children: A Parent's Guide</DialogTitle>
                <DialogDescription>
                  Essential guidance on child safety and well-being
                </DialogDescription>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-shrink-0">
                <Button
                  variant={viewMode === 'pdf' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('pdf')}
                  className={`gap-2 rounded-lg ${viewMode === 'pdf' ? 'bg-[#1F3A5F]' : ''}`}
                  data-testid="button-view-pdf"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </Button>
                <Button
                  variant={viewMode === 'video' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('video')}
                  className={`gap-2 rounded-lg ${viewMode === 'video' ? 'bg-[#2FBF71]' : ''}`}
                  data-testid="button-view-video"
                >
                  <Play className="w-4 h-4" />
                  Video
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {viewMode === 'pdf' ? (
            <div className="flex-1 overflow-hidden rounded-xl border bg-white">
              <object
                data={pdfUrl}
                type="application/pdf"
                width="100%"
                height="100%"
                data-testid="pdf-viewer-protecting-guide"
              >
                <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
                  <p className="text-slate-500">Unable to display PDF inline.</p>
                  <div className="flex gap-3 flex-wrap justify-center">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F3A5F] text-white rounded-xl font-medium hover:bg-[#2a4a75] transition-colors"
                      data-testid="button-pdf-open-new-tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in New Tab
                    </a>
                    <a
                      href={pdfUrl}
                      download="Protecting-Our-Children-Guide.pdf"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2FBF71] text-white rounded-xl font-medium hover:bg-[#25a060] transition-colors"
                      data-testid="button-pdf-download"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </div>
              </object>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden rounded-xl border bg-black">
              <iframe
                src={videoEmbedUrl}
                width="100%"
                height="100%"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-full"
                data-testid="video-viewer-protecting-guide"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* ============ CTA SECTION ============ */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-[#f8fafb] to-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="bg-[#1F3A5F] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 relative overflow-hidden">
            {/* Grid pattern overlay */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
              }}
            ></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
              {/* Left Content */}
              <div className="text-center lg:text-left max-w-xl">
                <div className="flex justify-center lg:justify-start mb-4">
                  <div className="inline-flex items-center gap-2 bg-[#2FBF71]/15 text-[#2FBF71] px-4 py-2 rounded-full text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Get Started Today
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 px-2 sm:px-0">
                  Ready to Unlock Your Child's Potential?
                </h3>
                <p className="text-white/70 text-sm sm:text-base lg:text-lg px-2 sm:px-0">
                  Join hundreds of families who trust Alloria Learning Center for their children's education journey.
                </p>
              </div>
              
              {/* Right - CTA Button */}
              <div className="flex flex-col items-center lg:items-end gap-3 sm:gap-4 w-full sm:w-auto">
                <Button
                  onClick={() => navigate("/contact")}
                  size="lg"
                  className="bg-[#2FBF71] text-white px-6 sm:px-10 text-base sm:text-lg font-bold rounded-xl shadow-xl shadow-[#2FBF71]/25 w-full sm:w-auto"
                  data-testid="button-join-now"
                >
                  <span className="flex items-center justify-center gap-2 sm:gap-3">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Contact Us
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                </Button>
                <div className="flex items-center gap-2 text-white/60 text-xs sm:text-sm">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Or call: +1 (720) 243-6452</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ============ FAQ SECTION ============ */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-white to-[#f8fafb]">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 bg-[#1F3A5F]/5 text-[#1F3A5F] px-4 py-2 rounded-full text-sm font-medium">
                <HelpCircle className="w-4 h-4" />
                Got Questions?
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1F3A5F] mb-3 sm:mb-4 px-2 sm:px-0">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base px-2 sm:px-0">
              Find answers to common questions about our courses, enrollment, and learning experience.
            </p>
          </div>
          
          {/* FAQ Accordion */}
          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-[#2FBF71]/20"
                data-testid={`faq-${i}`}
              >
                <summary className="font-semibold text-[#1F3A5F] cursor-pointer flex items-center justify-between p-4 sm:p-6 gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#2FBF71]/10 flex items-center justify-center flex-shrink-0 group-open:bg-[#2FBF71] transition-colors">
                      <span className="text-[#2FBF71] font-bold text-xs sm:text-sm group-open:text-white transition-colors">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-left text-sm sm:text-base">{faq.q}</span>
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1F3A5F]/5 flex items-center justify-center flex-shrink-0 group-open:bg-[#2FBF71]/10 transition-colors">
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#1F3A5F] group-open:text-[#2FBF71] group-open:rotate-180 transition-all" />
                  </div>
                </summary>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                  <div className="pl-11 sm:pl-14 border-l-2 border-[#2FBF71]/20 ml-4 sm:ml-5">
                    <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{faq.a}</p>
                  </div>
                </div>
              </details>
            ))}
          </div>
          
          {/* Still have questions */}
          <div className="mt-8 sm:mt-12 text-center">
            <p className="text-slate-600 mb-3 sm:mb-4 text-sm sm:text-base">Still have questions?</p>
            <Button
              onClick={() => navigate("/contact")}
              variant="outline"
              className="border-2 border-[#2FBF71] text-[#2FBF71] font-semibold px-5 sm:px-6"
              data-testid="button-faq-contact"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Us
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
