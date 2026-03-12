import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    Play,
    CheckCircle2,
    GraduationCap,
    Star,
    Heart,
    Zap,
    Award,
    BookOpen,
    Calculator,
    FlaskConical,
    Sparkles,
    Users,
    type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import sandipImage from "@assets/image_1768460673012.png";
import sajanImage from "@assets/sajan_1768460469797.jpeg";
import heroImage1 from "@assets/WhatsApp_Image_2026-02-02_at_12.24.06_1770093951729.jpeg";

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

export default function Hero() {
    const [, navigate] = useLocation();

    return (
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
    );
}
