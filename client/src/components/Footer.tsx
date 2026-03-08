import { useLocation } from "wouter";
import { useState } from "react";
import { X, Mail, Phone, MapPin, ArrowRight, GraduationCap, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";

import logoImage from "@assets/Favicon.png";

export default function Footer() {
  const [, navigate] = useLocation();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <>
      <footer className="bg-[#1F3A5F] relative overflow-hidden">
        {/* Decorative top border */}
        <div className="h-1 bg-gradient-to-r from-[#2FBF71] via-[#3dd485] to-[#2FBF71]"></div>
        
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
              
              {/* Brand Section */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-3 mb-5 group">
                  <div className="relative p-1 bg-white rounded-xl shadow-lg shadow-white/10 group-hover:shadow-white/20 transition-all">
                    <img 
                      src={logoImage} 
                      alt="Alloria Learning Center logo" 
                      className="w-10 h-10 relative z-10 transition-transform group-hover:scale-105" 
                    />
                  </div>
                  <h3 className="font-bold text-white text-lg">Alloria Learning Center</h3>
                </div>
                <p className="text-sm text-white/70 mb-6 leading-relaxed">
                  Inspiring young minds with engaging courses in Nepali, Math,
                  Science, Arts & Music from KG to Middle School.
                </p>
                
                {/* Social Links */}
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.facebook.com/profile.php?id=61567503912462"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 hover:bg-[#2FBF71] rounded-lg flex items-center justify-center text-white transition-all duration-300"
                    data-testid="link-facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">
                  Quick Links
                </h4>
                <ul className="space-y-3">
                  <li>
                    <button
                      onClick={() => navigate("/courses")}
                      className="text-white/70 hover:text-[#2FBF71] transition-colors text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      Browse Courses
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/about")}
                      className="text-white/70 hover:text-[#2FBF71] transition-colors text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      About Us
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/contact")}
                      className="text-white/70 hover:text-[#2FBF71] transition-colors text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      Contact Us
                    </button>
                  </li>
                </ul>
              </div>

              {/* Popular Subjects */}
              <div>
                <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">
                  Popular Subjects
                </h4>
                <ul className="space-y-3">
                  <li>
                    <button
                      onClick={() => navigate("/courses")}
                      className="text-white/70 hover:text-[#2FBF71] transition-colors text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      Nepali Language
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/courses")}
                      className="text-white/70 hover:text-[#2FBF71] transition-colors text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      Mathematics
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/courses")}
                      className="text-white/70 hover:text-[#2FBF71] transition-colors text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      Science
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/courses")}
                      className="text-white/70 hover:text-[#2FBF71] transition-colors text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      Arts & Music
                    </button>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">
                  Get in Touch
                </h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#2FBF71]/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-[#2FBF71]" />
                    </div>
                    <div>
                      <span className="text-white/50 text-xs block">Call us</span>
                      <span className="text-white text-sm font-medium">+1 (720) 243-6452</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#2FBF71]/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-[#2FBF71]" />
                    </div>
                    <div>
                      <span className="text-white/50 text-xs block">Email us</span>
                      <span className="text-white text-sm font-medium">hello@allorialearning.com</span>
                    </div>
                  </li>
                </ul>
                
                {/* Legal Links */}
                <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-white/50 hover:text-[#2FBF71] transition-colors text-xs"
                  >
                    Privacy Policy
                  </button>
                  <button
                    onClick={() => setShowTermsModal(true)}
                    className="text-white/50 hover:text-[#2FBF71] transition-colors text-xs"
                  >
                    Terms of Service
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-white/10 bg-[#1a3352]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-white/60">
                © 2025 Alloria Learning Center. All rights reserved.
              </p>
              <p className="text-sm text-white/40">
                Empowering young minds worldwide.
              </p>
            </div>
          </div>
        </div>
      </footer>
      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl max-h-[90vh] overflow-hidden w-full shadow-2xl">
            {/* Premium Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#1F3A5F] to-[#2a4a75] flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2FBF71]/20 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-[#2FBF71]" />
                </div>
                <h2 className="text-xl font-bold text-white">Terms of Service</h2>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-slate-700 overflow-y-auto max-h-[60vh]">
              <div className="bg-[#2FBF71]/10 border border-[#2FBF71]/20 rounded-xl p-4">
                <p className="font-medium text-[#1F3A5F]">By joining our tutoring service, you agree to the following terms:</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-[#1F3A5F] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full"></span>
                    1. Class Timings
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1 pl-4">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Students must join classes on time</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Inform us in advance for rescheduling</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#1F3A5F] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full"></span>
                    2. Behaviour & Respect
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1 pl-4">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Maintain polite and respectful environment</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>No abuse or rude language allowed</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#1F3A5F] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full"></span>
                    3. Devices & Internet
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1 pl-4">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Join using device with Zoom, microphone & stable internet</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#1F3A5F] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full"></span>
                    4. Demo Class
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1 pl-4">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Demo classes are free</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Timings based on discussion with our team</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#1F3A5F] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full"></span>
                    5. Safety & Privacy
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1 pl-4">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Zoom links are private</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Student details kept confidential</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#1F3A5F] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full"></span>
                    6. Teacher Changes & Cancellation
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1 pl-4">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Parents can request teacher change anytime</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Stop classes anytime by informing us</li>
                  </ul>
                </div>
              </div>

              <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">Last updated: December 2025</p>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 flex gap-3 p-4 justify-end">
              <Button
                onClick={() => setShowTermsModal(false)}
                className="bg-[#1F3A5F] hover:bg-[#2a4a75] text-white px-6"
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl max-h-[90vh] overflow-hidden w-full shadow-2xl">
            {/* Premium Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#1F3A5F] to-[#2a4a75] flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2FBF71]/20 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-[#2FBF71]" />
                </div>
                <h2 className="text-xl font-bold text-white">Privacy Policy</h2>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-slate-700 overflow-y-auto max-h-[60vh]">
              <div className="bg-[#2FBF71]/10 border border-[#2FBF71]/20 rounded-xl p-4">
                <p className="font-medium text-[#1F3A5F]">We respect your privacy. Any information you share with us is safe and used only for our tutoring service.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold text-[#1F3A5F] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full"></span>
                    What Information We Collect
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">We collect basic details like:</p>
                  <ul className="text-sm text-slate-600 space-y-1 pl-4">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Name, Email, Phone number</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Grade/subjects, Preferred class time</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#1F3A5F] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full"></span>
                    How We Use Your Information
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1 pl-4">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Contact you & schedule classes</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Assign teachers & send Zoom links</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Share class updates</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#1F3A5F] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full"></span>
                    How We Keep Your Data Safe
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1 pl-4">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Your information is kept private and secure</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Only our team can access it</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>We never sell or share your data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#1F3A5F] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full"></span>
                    Zoom & Classes
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1 pl-4">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Zoom links are sent only to you</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-400 rounded-full"></span>Classes are private & not recorded without permission</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#1F3A5F] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2FBF71] rounded-full"></span>
                    Your Rights
                  </h3>
                  <p className="text-sm text-slate-600">You can ask us anytime to update your details, delete your data, or know how your information is used.</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">Last updated: December 2025</p>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 flex gap-3 p-4 justify-end">
              <Button
                onClick={() => setShowPrivacyModal(false)}
                className="bg-[#1F3A5F] hover:bg-[#2a4a75] text-white px-6"
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
