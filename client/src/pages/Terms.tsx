import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import { FileText, GraduationCap } from "lucide-react";

const FadeInWhenVisible = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <Navbar />
      
      {/* Hero Header */}
      <section className="relative pt-28 pb-16 bg-gradient-to-b from-[#1F3A5F] via-[#1F3A5F] to-[#2a4a75] overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#2FBF71]/10 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10">
          <FadeInWhenVisible>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#2FBF71]/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#2FBF71]" />
              </div>
              <span className="text-[#2FBF71] font-medium">Legal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms of Service</h1>
            <p className="text-white/60">Last updated: December 2025</p>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <FadeInWhenVisible>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
              {/* Intro Box */}
              <div className="bg-[#2FBF71]/10 border border-[#2FBF71]/20 rounded-xl p-5 mb-10">
                <p className="text-[#1F3A5F] font-medium">
                  By joining our tutoring service, you agree to the following terms and conditions. Please read them carefully.
                </p>
              </div>

              <div className="space-y-10">
                <div>
                  <h2 className="text-xl font-bold text-[#1F3A5F] mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#1F3A5F] text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                    Class Timings
                  </h2>
                  <ul className="text-slate-600 space-y-2 pl-11">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Students must join classes on time
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      If you need to reschedule, please inform us in advance
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Frequent delays may affect class quality
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1F3A5F] mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#1F3A5F] text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                    Behaviour & Respect
                  </h2>
                  <ul className="text-slate-600 space-y-2 pl-11">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      No abuse, rude language, or disrespectful behavior is allowed
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Students, parents, and teachers must maintain a polite environment
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Any form of harassment will lead to removal from the class
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1F3A5F] mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#1F3A5F] text-white rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                    Devices & Internet
                  </h2>
                  <ul className="text-slate-600 space-y-2 pl-11">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Students must join using a device with Zoom installed
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Working microphone and stable internet required
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Technical issues are the student's responsibility
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1F3A5F] mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#1F3A5F] text-white rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                    Demo Class
                  </h2>
                  <ul className="text-slate-600 space-y-2 pl-11">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Demo classes are completely free
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Timings are based on discussion between parent/student and our team
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1F3A5F] mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#1F3A5F] text-white rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                    Class Recordings
                  </h2>
                  <ul className="text-slate-600 space-y-2 pl-11">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Classes are not recorded unless parent and teacher agree
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Recordings cannot be shared outside the family
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1F3A5F] mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#1F3A5F] text-white rounded-lg flex items-center justify-center text-sm font-bold">6</span>
                    Safety & Privacy
                  </h2>
                  <ul className="text-slate-600 space-y-2 pl-11">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Zoom links are private and should not be shared
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Student details are kept confidential
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1F3A5F] mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#1F3A5F] text-white rounded-lg flex items-center justify-center text-sm font-bold">7</span>
                    Teacher Changes
                  </h2>
                  <ul className="text-slate-600 space-y-2 pl-11">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Teachers may be changed based on availability or performance
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      Parents can request a teacher change anytime
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1F3A5F] mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#1F3A5F] text-white rounded-lg flex items-center justify-center text-sm font-bold">8</span>
                    Cancellation
                  </h2>
                  <ul className="text-slate-600 space-y-2 pl-11">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full mt-2 flex-shrink-0"></span>
                      You may stop classes anytime by informing us
                    </li>
                  </ul>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-12 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                  <GraduationCap className="w-5 h-5 text-[#2FBF71]" />
                  <span>Alloria Learning Center - Empowering young minds</span>
                </div>
              </div>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>

      <Footer />
    </div>
  );
}
