import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Shield, 
  Lock, 
  Globe, 
  Leaf, 
  ChevronRight, 
  ArrowLeft,
  Info,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Share2,
  Search,
  Heart,
  FileText,
  Play,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface Article {
  id: string;
  title: string;
  category: string;
  icon: any;
  color: string;
  content: JSX.Element;
}

const articles: Article[] = [
  {
    id: "online-child-safety",
    title: "Online Child Safety",
    category: "Safety",
    icon: Shield,
    color: "bg-blue-500",
    content: (
      <div className="space-y-6">
        <section>
          <h3 className="text-2xl font-bold text-[#1F3A5F] mb-4">Being Safe Online</h3>
          <p className="text-slate-600 mb-4">
            In today's digital world, safety starts with awareness. Protecting children online is our collective responsibility.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
            <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Rule: Never Use Sensitive Information
            </h4>
            <p className="text-blue-900 text-sm">
              Teach children to never share their home address, school name, phone numbers, or current location with anyone online, even if they seem friendly.
            </p>
          </div>
        </section>
        
        <section>
          <h3 className="text-xl font-bold text-[#1F3A5F] mb-3">Key Safety Practices</h3>
          <ul className="grid sm:grid-cols-2 gap-4">
            {[
              "Use strong, unique passwords",
              "Never meet online friends in person",
              "Keep social media profiles private",
              "Talk to parents about weird messages"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-[#2FBF71] flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    )
  },
  {
    id: "online-privacy",
    title: "Online Privacy & Identity",
    category: "Privacy",
    icon: Lock,
    color: "bg-purple-500",
    content: (
      <div className="space-y-6">
        <section>
          <h3 className="text-2xl font-bold text-[#1F3A5F] mb-4">Understanding Metadata</h3>
          <p className="text-slate-600 mb-4">
            Metadata is "data about data." When you take a photo, the file often stores exactly where and when it was taken.
          </p>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
            <h4 className="font-bold text-purple-800 mb-2">How to stay private:</h4>
            <ul className="list-disc pl-5 text-sm text-purple-900 space-y-1">
              <li>Disable location services for your camera app.</li>
              <li>Use privacy-focused tools to "strip" metadata before uploading photos.</li>
              <li>Be careful with screenshots that might show browser tabs or usernames.</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-[#1F3A5F] mb-3">The "Harmless Question" Trap</h3>
          <p className="text-slate-600 mb-4">
            When gaming, someone might ask: <em>"What's your name? How old are you? Are you a boy or a girl?"</em>
          </p>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
            <p className="text-red-900 font-medium">
              <strong>Rule:</strong> Never use your real name, age, or gender in public lobbies. These seemingly harmless details help strangers build a profile of your child.
            </p>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 rounded-2xl">
            <h4 className="font-bold text-[#1F3A5F] mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              Throwaway Emails
            </h4>
            <p className="text-xs text-slate-500">
              Use separate, non-identifiable email addresses for games and newsletters to keep your primary inbox safe.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <h4 className="font-bold text-[#1F3A5F] mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-500" />
              Password Managers
            </h4>
            <p className="text-xs text-slate-500">
              Tools like Bitwarden or 1Password help you maintain complex passwords without having to remember them all.
            </p>
          </div>
        </section>
      </div>
    )
  },
  {
    id: "open-source",
    title: "Open vs. Closed Source",
    category: "Technology",
    icon: Globe,
    color: "bg-orange-500",
    content: (
      <div className="space-y-6">
        <section>
          <h3 className="text-2xl font-bold text-[#1F3A5F] mb-4">Choosing the Right Software</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-2xl">
              <h4 className="font-bold text-[#1F3A5F] mb-2">Closed Source</h4>
              <p className="text-xs text-slate-500 mb-2">(Windows, Microsoft 365, Adobe)</p>
              <ul className="text-xs space-y-1 text-slate-600">
                <li>✅ Professional support</li>
                <li>✅ Industry standard</li>
                <li>❌ Expensive subscriptions</li>
                <li>❌ Privacy concerns</li>
              </ul>
            </div>
            <div className="p-4 border border-slate-200 rounded-2xl bg-green-50/50">
              <h4 className="font-bold text-green-700 mb-2">Open Source</h4>
              <p className="text-xs text-green-600/70 mb-2">(Linux, LibreOffice, GIMP)</p>
              <ul className="text-xs space-y-1 text-green-700">
                <li>✅ Completely free</li>
                <li>✅ Transparent & Private</li>
                <li>❌ Steeper learning curve</li>
                <li>❌ Limited formal support</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-[#1F3A5F] mb-3">Free Alternatives</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left p-3 font-bold text-[#1F3A5F]">Popular App</th>
                  <th className="text-left p-3 font-bold text-[#2FBF71]">Free Alternative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["Microsoft Office", "LibreOffice"],
                  ["Adobe Photoshop", "GIMP / Krita"],
                  ["Windows OS", "Linux (Ubuntu/Mint)"],
                  ["Adobe Premiere", "DaVinci Resolve / Kdenlive"]
                ].map(([old, alt], i) => (
                  <tr key={i}>
                    <td className="p-3 text-slate-500">{old}</td>
                    <td className="p-3 font-medium text-slate-800">{alt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )
  },
  {
    id: "conscious-living",
    title: "Conscious & Eco-Friendly Living",
    category: "Lifestyle",
    icon: Leaf,
    color: "bg-green-600",
    content: (
      <div className="space-y-6">
        <section>
          <h3 className="text-2xl font-bold text-[#1F3A5F] mb-4">Smart Consumer Habits</h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-[#1F3A5F]">Research Before You Buy</h4>
                <p className="text-sm text-slate-500">Check reviews, lifespan, and environmental impact of products before purchasing.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-[#1F3A5F]">New vs. Refurbished</h4>
                <p className="text-sm text-slate-500">Consider refurbished electronics to reduce e-waste and save significant money.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#1F3A5F] text-white p-6 rounded-3xl relative overflow-hidden not-prose">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <h4 className="text-lg font-bold mb-3 flex items-center gap-2 text-white">
            <Heart className="w-5 h-5 text-red-400" />
            Better Gifting
          </h4>
          <ul className="space-y-3 text-sm text-white/90 list-none p-0 m-0">
            <li className="flex items-center gap-2 text-white/90">
              <CheckCircle2 className="w-4 h-4 text-[#2FBF71] flex-shrink-0" />
              <span>Maintain a wishlist for gifts to avoid duplicate/unwanted items.</span>
            </li>
            <li className="flex items-center gap-2 text-white/90">
              <CheckCircle2 className="w-4 h-4 text-[#2FBF71] flex-shrink-0" />
              <span>The Gift of Cash: Direct, useful, and avoids processing fees.</span>
            </li>
            <li className="flex items-center gap-2 text-white/90">
              <CheckCircle2 className="w-4 h-4 text-[#2FBF71] flex-shrink-0" />
              <span><strong className="text-white">Keep it Local:</strong> Support your community businesses first!</span>
            </li>
          </ul>
        </section>
      </div>
    )
  }
];

export default function Resources() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'pdf' | 'video'>('pdf');

  const pdfUrl = "/Protecting-Our-Children-Guide.pdf";
  const videoEmbedUrl = "https://drive.google.com/file/d/1b9heXm5K21ByTkffvUuUzqDGl2XtwcZK/preview";

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-28 pb-8 lg:pt-32 lg:pb-12 bg-[#1F3A5F] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#2FBF71]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-10 w-56 h-56 bg-[#2FBF71]/5 rounded-full blur-2xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-[#2FBF71]/15 border border-[#2FBF71]/30 text-[#2FBF71] px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <BookOpen className="w-4 h-4" />
              Digital Resources
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white mb-6 lg:whitespace-nowrap"
            >
              Knowledge for <span className="text-[#2FBF71]">Better Living</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-8"
            >
              Explore our curated digital resources on safety, privacy, technology, and conscious living.
            </motion.p>
          </div>
        </div>
        
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 36C840 40 960 48 1080 52C1200 56 1320 56 1380 56L1440 56V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V80Z" fill="#f8fafb"/>
          </svg>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-px">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedArticle ? (
                <motion.article
                  key={selectedArticle.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-slate-100"
                >
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedArticle(null)}
                    className="mb-8 text-slate-400 hover:text-[#1F3A5F] p-0 h-auto"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to All Resources
                  </Button>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 ${selectedArticle.color} rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20`}>
                      <selectedArticle.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#2FBF71] uppercase tracking-wider">{selectedArticle.category}</span>
                      <h2 className="text-3xl font-bold text-[#1F3A5F]">{selectedArticle.title}</h2>
                    </div>
                  </div>
                  
                  <div className="prose prose-slate max-w-none">
                    {selectedArticle.content}
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-slate-500">Share this guide</span>
                    </div>
                    <Button className="bg-[#1F3A5F] hover:bg-[#2a4a75] rounded-xl px-6">
                      Download PDF
                    </Button>
                  </div>
                </motion.article>
              ) : (
                <div className="grid gap-6">
                  {articles.map((article, i) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => setSelectedArticle(article)}
                      className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl hover:border-[#2FBF71]/20 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 ${article.color} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <article.icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#2FBF71] uppercase tracking-widest">{article.category}</span>
                          <h3 className="text-xl font-bold text-[#1F3A5F] group-hover:text-[#2FBF71] transition-colors">{article.title}</h3>
                          <p className="text-sm text-slate-500 line-clamp-1">Explore safety, privacy and best practices.</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#2FBF71] transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-white" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#1F3A5F] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-bold text-[#1F3A5F]">Parent's Safety Guide</h4>
              </div>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                Essential guidance on protecting your children online. Available as a PDF document and an informational video.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => { setViewMode('pdf'); setPdfModalOpen(true); }}
                  className="w-full bg-[#1F3A5F] text-white justify-start gap-3"
                >
                  <FileText className="w-4 h-4" />
                  View PDF Guide
                </Button>
                <Button
                  onClick={() => { setViewMode('video'); setPdfModalOpen(true); }}
                  className="w-full bg-[#2FBF71] text-white justify-start gap-3"
                >
                  <Play className="w-4 h-4" />
                  Watch Video Guide
                </Button>
              </div>
            </div>

            <div className="bg-[#1F3A5F] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#2FBF71]/20 rounded-full blur-3xl"></div>
              <h4 className="text-xl font-bold mb-4 relative z-10">Quick Support</h4>
              <p className="text-white/70 text-sm mb-6 relative z-10">Have questions about digital safety or our platform? We're here to help.</p>
              <Button className="w-full bg-[#2FBF71] hover:bg-[#25a060] text-white rounded-xl h-12 font-bold relative z-10">
                Contact Support
              </Button>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
              <h4 className="text-lg font-bold text-[#1F3A5F] mb-6 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Featured Tip
              </h4>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                  <p className="text-sm text-yellow-800 font-medium italic">
                    "Privacy is not an option, it's a fundamental requirement for safety."
                  </p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Start by auditing your child's gaming profiles today. Check for real names and location data in profiles.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
              <h4 className="text-lg font-bold text-[#1F3A5F] mb-4">Latest Updates</h4>
              <ul className="space-y-4">
                {[
                  { date: "Jan 10", title: "New Security Protocols" },
                  { date: "Jan 05", title: "Privacy Guide Update" },
                  { date: "Dec 28", title: "Eco-Friendly Tech" }
                ].map((update, i) => (
                  <li key={i} className="flex gap-4 items-center group cursor-pointer">
                    <div className="text-[10px] font-bold text-[#2FBF71] w-10 flex-shrink-0">{update.date}</div>
                    <div className="text-sm text-slate-600 font-medium group-hover:text-[#1F3A5F] transition-colors">{update.title}</div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <Dialog open={pdfModalOpen} onOpenChange={(open) => {
        setPdfModalOpen(open);
        if (!open) setViewMode('pdf');
      }}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-6">
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
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </Button>
                <Button
                  variant={viewMode === 'video' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('video')}
                  className={`gap-2 rounded-lg ${viewMode === 'video' ? 'bg-[#2FBF71]' : ''}`}
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
              >
                <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
                  <p className="text-slate-500">Unable to display PDF inline.</p>
                  <div className="flex gap-3 flex-wrap justify-center">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F3A5F] text-white rounded-xl font-medium hover:bg-[#2a4a75] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in New Tab
                    </a>
                    <a
                      href={pdfUrl}
                      download="Protecting-Our-Children-Guide.pdf"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2FBF71] text-white rounded-xl font-medium hover:bg-[#25a060] transition-colors"
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
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
