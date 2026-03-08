import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2, Home, MessageCircle, Sparkles, GraduationCap, ArrowRight, Heart } from "lucide-react";

export default function ThankYou() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1F3A5F] via-[#1F3A5F] to-[#2a4a75] flex flex-col">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#2FBF71]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#2FBF71]/5 rounded-full blur-3xl" />
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-lg"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="w-28 h-28 bg-[#2FBF71]/20 rounded-full flex items-center justify-center">
                <div className="w-20 h-20 bg-[#2FBF71] rounded-full flex items-center justify-center shadow-xl shadow-[#2FBF71]/30">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>
              {/* Animated rings */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 border-2 border-[#2FBF71]/30 rounded-full"
              />
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 bg-[#2FBF71]/15 border border-[#2FBF71]/30 text-[#2FBF71] px-4 py-2 rounded-full text-sm font-medium mb-6"
          >
            <Heart className="w-4 h-4" />
            We Appreciate You
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
          >
            Thank You for Visiting!
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-white/70 mb-3"
          >
            We appreciate your interest in Alloria Learning Center.
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="text-white/60 mb-8"
          >
            Ready to give your child the gift of personalized learning? Book a free demo class and experience the difference!
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button
              onClick={() => navigate("/contact")}
              size="lg"
              className="w-full sm:w-auto group bg-[#2FBF71] hover:bg-[#25a060] text-white px-8 py-6 h-auto text-base font-bold rounded-xl shadow-xl shadow-[#2FBF71]/25 transition-all hover:shadow-2xl hover:scale-105"
              data-testid="button-book-demo"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Book Free Demo Class
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="border-2 border-white/20 text-white hover:bg-white/10 font-medium px-6"
                data-testid="button-home"
              >
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>

              <Button
                onClick={() => navigate("/courses")}
                variant="outline"
                className="border-2 border-white/20 text-white hover:bg-white/10 font-medium px-6"
                data-testid="button-courses"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                View Courses
              </Button>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 pt-8 border-t border-white/10"
          >
            <p className="text-white/50 text-sm mb-3">Have questions? Reach out anytime</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a 
                href="tel:+17202426452" 
                className="text-[#2FBF71] hover:text-[#3dd88a] transition-colors font-medium"
              >
                +1 (720) 242-6452
              </a>
              <span className="hidden sm:block text-white/30">|</span>
              <a 
                href="mailto:info@alloria.com" 
                className="text-[#2FBF71] hover:text-[#3dd88a] transition-colors font-medium"
              >
                info@alloria.com
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="py-6 text-center border-t border-white/10 relative z-10"
      >
        <p className="text-sm text-white/40">
          © 2025 Alloria Learning Center. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
