import { motion } from "framer-motion";
import { Sparkles, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ContactForm from "@/components/sections/contact/ContactForm";

export default function Contact() {
  return (
    <div className="bg-gradient-to-b from-white to-[#f8fafb] text-slate-800 min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="pt-28 pb-12 lg:pt-32 lg:pb-16 bg-[#1F3A5F] relative overflow-hidden text-center text-white">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-[#2FBF71]/20 p-2 px-4 rounded-full text-[#2FBF71] text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" /> Free Demo Class Available
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Start Your Child's <span className="text-[#2FBF71]">Journey</span></h1>
          <p className="text-white/80 max-w-2xl mx-auto mb-10">Discover how we make learning magical. Book your demo today!</p>

          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {['100% Free Trial', 'Expert Teachers', '24hr Response'].map((text, i) => (
              <div key={i} className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#2FBF71]" /><span>{text}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <ContactForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}
