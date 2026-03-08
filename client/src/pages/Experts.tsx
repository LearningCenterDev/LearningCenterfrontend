import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, ArrowLeft, Search, Award, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Teacher = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  education?: string | null;
  certifications?: string | null;
  subject?: string | null;
};

export default function Experts() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers/all"],
  });

  const filteredTeachers = teachers.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.education?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f8fafb]">
      <Navbar />

      <section className="pt-28 pb-16 bg-gradient-to-br from-[#1F3A5F] via-[#2a4a75] to-[#1F3A5F] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#2FBF71]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Award className="w-4 h-4 text-[#2FBF71]" />
            Our Team
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Meet Our Experts
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm sm:text-base">
            Passionate educators dedicated to nurturing every student's potential with personalized attention and proven expertise.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="self-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#1F3A5F] animate-spin" />
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">No experts found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="group cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/experts/${teacher.id}`)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(`/experts/${teacher.id}`); } }}
              >
                <Card className="overflow-visible border-slate-200/80 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="p-6 flex flex-col items-center text-center h-full">
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

                    {teacher.bio && (
                      <p className="text-xs text-slate-500 leading-relaxed mt-3 line-clamp-2">
                        {teacher.bio}
                      </p>
                    )}

                    <p className="text-[11px] text-center text-[#2FBF71] font-medium mt-auto pt-3 group-hover:underline">
                      View Profile
                    </p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
