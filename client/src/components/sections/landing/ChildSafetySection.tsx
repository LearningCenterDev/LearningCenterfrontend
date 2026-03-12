import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, FileText, Play, ExternalLink, Download, CheckCircle2, Heart, Star, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ChildSafetySection() {
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'pdf' | 'video'>('pdf');

    const pdfUrl = "/Protecting-Our-Children-Guide.pdf";
    const videoEmbedUrl = "https://drive.google.com/file/d/1b9heXm5K21ByTkffvUuUzqDGl2XtwcZK/preview";

    return (
        <section className="py-12 sm:py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
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
                                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F3A5F] text-white rounded-xl font-medium">
                                            <ExternalLink className="w-4 h-4" /> Open in New Tab
                                        </a>
                                        <a href={pdfUrl} download="Protecting-Our-Children-Guide.pdf" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2FBF71] text-white rounded-xl font-medium">
                                            <Download className="w-4 h-4" /> Download
                                        </a>
                                    </div>
                                </div>
                            </object>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-hidden rounded-xl border bg-black">
                            <iframe src={videoEmbedUrl} width="100%" height="100%" allow="autoplay; encrypted-media" allowFullScreen className="w-full h-full" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}
