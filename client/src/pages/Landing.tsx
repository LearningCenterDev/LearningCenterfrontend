import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/landing/Hero";
import PopularCourses from "@/components/sections/landing/PopularCourses";
import ExpertsSection from "@/components/sections/landing/ExpertsSection";
import FAQSection from "@/components/sections/landing/FAQSection";
import ChildSafetySection from "@/components/sections/landing/ChildSafetySection";
import { motion } from "framer-motion";
import { Sparkles, MessageCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="text-slate-800 bg-gradient-to-b from-white to-[#f8fafb]">
      <Navbar />

      <main>
        <Hero />

        <PopularCourses />

        <ExpertsSection />

        <ChildSafetySection />

        <FAQSection />

        {/* Global CTA Section */}
        <section className="py-20 bg-white relative">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] p-8 md:p-16 rounded-[40px] shadow-2xl relative overflow-hidden text-center"
            >
              {/* Background Decorative Pattern */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              
              <div className="relative z-10 max-w-3xl mx-auto">
                <div className="flex justify-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-[#2FBF71]/20 border border-[#2FBF71]/30 text-[#2FBF71] px-4 py-2 rounded-full text-sm font-bold">
                    <Sparkles className="w-4 h-4" />
                    Join 100+ Happy Families
                  </div>
                </div>
                
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  Ready to Unlock Your Child's <span className="text-[#2FBF71]">Full Potential?</span>
                </h2>
                
                <p className="text-white/80 text-lg md:text-xl mb-10 leading-relaxed">
                  Book your free demo session today and experience why parents trust us for their child's learning journey.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                  <Button 
                    onClick={() => navigate("/contact")}
                    size="lg"
                    className="w-full sm:w-auto bg-[#2FBF71] hover:bg-[#25a060] text-white px-8 h-14 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
                    data-testid="button-enroll-cta"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Book Free Demo Now
                  </Button>
                  <Button 
                    onClick={() => navigate("/courses")}
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border-white/20 text-white px-8 h-14 rounded-full font-bold text-lg backdrop-blur-sm"
                  >
                    Browse Our Courses
                  </Button>
                </div>
                
                {/* Contact Info in CTA */}
                <div className="mt-12 pt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                  <div className="flex items-center gap-4 text-white/90">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                      <Phone className="w-6 h-6 text-[#2FBF71]" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">Call or WhatsApp</p>
                      <p className="text-lg font-bold">+1 (720) 243-6452</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-white/90">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                      <Mail className="w-6 h-6 text-[#2FBF71]" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">Email Us</p>
                      <p className="text-lg font-bold">poudel@magical-edu.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
