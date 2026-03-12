import { motion } from "framer-motion";
import { BookOpen, ArrowRight, Calculator, FlaskConical, Monitor, Brain, BookText, Languages, Music, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

import mathImage from "@assets/stock_images/mathematics_learning_e6bbcfef.jpg";
import scienceImage from "@assets/stock_images/science_lab_class_wi_a4acb6ba.jpg";
import computerImage from "@assets/stock_images/child_using_laptop_c_8ead0965.jpg";
import aiImage from "@assets/stock_images/child_learning_ai_te_c57ea010.jpg";
import englishImage from "@assets/englishImage_1767084544521.jpg";
import nepaliImage from "@assets/nepali-consonants_1767084064077.png";
import artsImage from "@assets/Music_class_1767084337444.png";
import excitedKidImage from "@assets/stock_images/excited_kid_studying_14e22fda.jpg";

const courses = [
    { title: "Math", description: "Clear explanations, concept understanding, and guided practice.", icon: Calculator, grade: "Grades 1-10", color: "from-[#1F3A5F] to-[#2a4a75]", image: mathImage },
    { title: "Science", description: "Helping students make sense of science instead of memorizing it.", icon: FlaskConical, grade: "Grades 1-10", color: "from-[#2FBF71] to-[#25a060]", image: scienceImage },
    { title: "Computer Science", description: "Learn coding, digital literacy, and computer fundamentals.", icon: Monitor, grade: "Beginner to Advanced", color: "from-[#1F3A5F] to-[#3a5a7f]", image: computerImage },
    { title: "AI & Technology", description: "Discover artificial intelligence, robotics, and future tech skills.", icon: Brain, grade: "Beginner to Advanced", color: "from-[#2FBF71] to-[#1F3A5F]", image: aiImage },
    { title: "English Language Arts", description: "Reading, writing, grammar, comprehension, and communication skills.", icon: BookText, grade: "Beginner to Advanced", color: "from-[#2FBF71] to-[#3dd88a]", image: englishImage },
    { title: "Nepali Language", description: "Learn or improve reading, writing, and speaking in Nepali.", icon: Languages, grade: "Beginner to Advanced", color: "from-[#1F3A5F] to-[#2FBF71]", image: nepaliImage },
    { title: "Music & Dance", description: "Learn rhythm, steps, and basics.", icon: Music, grade: "Beginner to Intermediate", color: "from-[#2a4a75] to-[#1F3A5F]", image: artsImage },
    { title: "On-Demand Subjects", description: "Support for any extra subject.", icon: Sparkles, grade: "Based on Request", color: "from-[#25a060] to-[#2FBF71]", image: excitedKidImage },
];

export default function PopularCourses() {
    const [, navigate] = useLocation();

    return (
        <section className="-mt-px py-12 sm:py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                    <div className="flex justify-center mb-4">
                        <div className="inline-flex items-center gap-2 bg-[#2FBF71]/10 text-[#2FBF71] px-4 py-2 rounded-full text-sm font-medium">
                            <BookOpen className="w-4 h-4" />
                            What We Offer
                        </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1F3A5F] mb-3 sm:mb-4 px-2 sm:px-0">Our Popular Courses</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base px-2 sm:px-0">Explore our carefully designed courses that make learning fun and effective for students of all levels.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {courses.map((course, index) => {
                        const IconComponent = course.icon;
                        return (
                            <motion.div
                                key={course.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="group relative bg-white rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500"
                                onClick={() => navigate("/courses")}
                            >
                                <div className="relative h-48 overflow-hidden">
                                    <img 
                                        src={course.image} 
                                        alt={course.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <motion.div 
                                        className="absolute top-4 right-4 z-10"
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                            <IconComponent className="w-6 h-6 text-[#1F3A5F]" />
                                        </div>
                                    </motion.div>
                                    
                                    <div className="absolute bottom-4 left-4 z-10">
                                        <span className="text-xs font-bold text-[#1F3A5F] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-white">
                                            {course.grade}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="p-5 relative">
                                    <div className={`absolute top-0 left-5 right-5 h-1 bg-gradient-to-r ${course.color} rounded-full -translate-y-1/2`} />
                                    <h3 className="text-lg font-bold text-[#1F3A5F] mb-2 group-hover:text-[#2FBF71] transition-colors duration-300">
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                                        {course.description}
                                    </p>
                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                        <span className="text-sm font-semibold text-[#2FBF71]">Learn More</span>
                                        <motion.div
                                            className="w-8 h-8 rounded-full bg-[#2FBF71]/10 flex items-center justify-center group-hover:bg-[#2FBF71] transition-colors duration-300"
                                            whileHover={{ x: 3 }}
                                        >
                                            <ArrowRight className="w-4 h-4 text-[#2FBF71] group-hover:text-white transition-colors duration-300" />
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="text-center mt-12">
                    <Button
                        onClick={() => navigate("/courses")}
                        variant="outline"
                        size="lg"
                        className="border-2 border-[#1F3A5F] text-[#1F3A5F] font-semibold px-8"
                    >
                        View All Courses
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
