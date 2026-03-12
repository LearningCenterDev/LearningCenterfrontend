import { useState } from "react";
import { motion } from "framer-motion";
import { Award, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

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

export default function ExpertsSection() {
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
                            onClick={() => setSelectedTeacher(teacher)}
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
