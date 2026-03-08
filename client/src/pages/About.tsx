import { motion } from "framer-motion";
import { Users, Target, Award, Heart, GraduationCap, Trophy, Rocket, Lightbulb, TrendingUp, Brain, Sparkles, ArrowRight, CheckCircle2, BookOpen, Video, Clock, Star, MessageCircle, Play } from "lucide-react";
import { useState } from "react";
import FadeInWhenVisible from "../components/FadeInWhenVisible";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import heroImage1 from "@assets/stock_images/child_using_laptop_c_4377a7df.jpg";
import heroImage2 from "@assets/stock_images/excited_kid_studying_14e22fda.jpg";
import teacherImage from "@assets/Music_class_1767084337444.png";
import studentsImage from "@assets/stock_images/students_learning_to_0c3504aa.jpg";
import founderImage from "@assets/sandip_1769325921117.jpeg";

export default function About() {
  const [, navigate] = useLocation();

  return (
    <div className="bg-white text-slate-800 min-h-screen">
      <Navbar />
      
      {/* Hero Header Section */}
      <section className="pt-28 pb-20 lg:pt-32 lg:pb-24 bg-[#1F3A5F] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-[#2FBF71]/15 border border-[#2FBF71]/30 text-[#2FBF71] px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <Heart className="w-4 h-4" />
              Our Story & Mission
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white mb-6"
            >
              About <span className="text-[#2FBF71]">Alloria</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-base md:text-lg text-white/80 max-w-2xl mx-auto"
            >
              Where learning feels like play. Empowering young minds from PG to Middle School with personalized online education.
            </motion.p>
          </div>
        </div>
        
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 36C840 40 960 48 1080 52C1200 56 1320 56 1380 56L1440 56V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V80Z" fill="white"/>
          </svg>
        </div>
      </section>
      
      {/* What Makes Us Different - Premium Visual Section */}
      <section className="-mt-px py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <FadeInWhenVisible>
            <div className="text-center mb-12 lg:mb-16">
              <div className="inline-flex items-center gap-2 bg-[#1F3A5F]/5 text-[#1F3A5F] px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Star className="w-4 h-4" />
                What Sets Us Apart
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1F3A5F] mb-4">Why Parents Choose Us</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                We've designed our platform with your child's success in mind.
              </p>
            </div>
          </FadeInWhenVisible>

          {/* Premium Visual Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Side - Feature Image with Floating Elements */}
            <FadeInWhenVisible>
              <div className="relative">
                {/* Main Image Container */}
                <motion.div
                  className="relative rounded-3xl overflow-hidden shadow-2xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                >
                  <img 
                    src={teacherImage} 
                    alt="Online learning session" 
                    className="w-full h-[400px] lg:h-[500px] object-cover"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1F3A5F]/80 via-transparent to-transparent" />
                  
                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 bg-[#2FBF71] rounded-full"
                      />
                      <span className="text-white/90 text-sm font-medium">Live 1-on-1 Sessions</span>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                      Personal Attention, Real Results
                    </h3>
                    <p className="text-white/80 text-sm lg:text-base max-w-md">
                      Every class is dedicated to just your child with a caring teacher.
                    </p>
                  </div>
                </motion.div>
                
                {/* Floating Badge - Top Left */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="absolute -top-4 -left-4 lg:-top-6 lg:-left-6 z-20"
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="bg-white rounded-2xl p-4 shadow-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#2FBF71] to-[#25a060] rounded-xl flex items-center justify-center">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-[#1F3A5F] font-bold text-lg">Zoom</div>
                        <div className="text-slate-500 text-xs">Live Classes</div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
                
                {/* Floating Stats - Bottom Right */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-4 -right-4 lg:-bottom-6 lg:-right-6 z-20"
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="bg-[#2FBF71] rounded-2xl p-4 shadow-xl text-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-xl">95%</div>
                        <div className="text-white/80 text-xs">Success Rate</div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </FadeInWhenVisible>
            
            {/* Right Side - Feature Cards */}
            <div className="space-y-5 lg:space-y-6">
              {[
                { 
                  icon: Video, 
                  title: "Live 1-on-1 Classes", 
                  desc: "Personal attention with dedicated teachers via Zoom. Your child gets the full focus they deserve.", 
                  color: "from-[#1F3A5F] to-[#2a4a75]",
                  highlight: "100% Personalized"
                },
                { 
                  icon: Clock, 
                  title: "Flexible Scheduling", 
                  desc: "Classes at times that work for your family. No more rushing - learn when it's convenient.", 
                  color: "from-[#2FBF71] to-[#25a060]",
                  highlight: "Your Schedule"
                },
                { 
                  icon: BookOpen, 
                  title: "Custom Curriculum", 
                  desc: "Lessons tailored to your child's learning pace. We adapt to how they learn best.", 
                  color: "from-[#1F3A5F] to-[#2FBF71]",
                  highlight: "Adaptive Learning"
                },
                { 
                  icon: Heart, 
                  title: "Caring Teachers", 
                  desc: "Patient instructors who make learning fun. Building confidence one lesson at a time.", 
                  color: "from-[#2FBF71] to-[#3dd88a]",
                  highlight: "Fun & Engaging"
                },
              ].map((item, i) => (
                <FadeInWhenVisible key={item.title} delay={0.1 * i}>
                  <motion.div 
                    whileHover={{ x: 8, scale: 1.01 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl p-5 lg:p-6 shadow-lg border border-slate-100 group hover:shadow-xl hover:border-[#2FBF71]/20 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-start gap-4 lg:gap-5">
                      {/* Icon */}
                      <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="w-7 h-7 text-white" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-[#1F3A5F] group-hover:text-[#2FBF71] transition-colors">{item.title}</h3>
                        </div>
                        <p className="text-slate-600 text-sm mb-3 leading-relaxed">{item.desc}</p>
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2FBF71] bg-[#2FBF71]/10 px-3 py-1.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {item.highlight}
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#2FBF71] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </div>
                  </motion.div>
                </FadeInWhenVisible>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Story Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-b from-[#f8fafb] to-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <FadeInWhenVisible>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#2FBF71]/10 text-[#2FBF71] px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  How It All Started
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1F3A5F] mb-6">Our Story</h2>
                
                <div className="space-y-4 text-slate-600">
                  <p className="leading-relaxed">
                    Learning Center began with the story of a father and son: Mr. Sandip Poudel and his son, Samagra Poudel.
                  </p>
                  <p className="leading-relaxed">
                    Mr. Poudel wanted to ensure his son received a strong educational foundation. He enrolled Samagra in traditional tutoring programs, but the experience was frustrating - hours of repetitive homework, parents grading assignments, and endless driving to centers.
                  </p>
                  <p className="leading-relaxed">
                    That's when Mr. Poudel created Alloria Learning Center - hiring dedicated teachers to provide personalized online classes that children actually enjoy. Other parents noticed the difference, and that's how we grew into what we are today.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-4 mt-8">
                  <div className="flex items-center gap-2 text-[#1F3A5F]">
                    <CheckCircle2 className="w-5 h-5 text-[#2FBF71]" />
                    <span className="font-medium">No More Driving</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#1F3A5F]">
                    <CheckCircle2 className="w-5 h-5 text-[#2FBF71]" />
                    <span className="font-medium">Fun Learning</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#1F3A5F]">
                    <CheckCircle2 className="w-5 h-5 text-[#2FBF71]" />
                    <span className="font-medium">Personal Attention</span>
                  </div>
                </div>
              </div>
              
              {/* Founder Image - Premium Display */}
              <div className="relative">
                <motion.div
                  className="relative rounded-3xl overflow-hidden shadow-2xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                >
                  <img 
                    src={founderImage} 
                    alt="Sandip Poudel with his son Samagra - Founders of Alloria Learning Center" 
                    className="w-full h-[450px] lg:h-[520px] object-cover object-top"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1F3A5F]/90 via-[#1F3A5F]/20 to-transparent" />
                  
                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 bg-[#2FBF71] rounded-full"
                      />
                      <span className="text-white/90 text-sm font-medium">Where It All Began</span>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                      Sandip & Samagra Poudel
                    </h3>
                    <p className="text-white/80 text-sm lg:text-base max-w-md">
                      A father's vision to give his son the best education became a mission to help every child succeed.
                    </p>
                  </div>
                </motion.div>
                
                {/* Floating Badge - Top Right */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="absolute -top-4 -right-4 lg:-top-6 lg:-right-6 z-20"
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="bg-white rounded-2xl p-4 shadow-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#2FBF71] to-[#25a060] rounded-xl flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-[#1F3A5F] font-bold text-lg">Founder</div>
                        <div className="text-slate-500 text-xs">& Inspiration</div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
                
                {/* Floating Stats - Bottom Left */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-4 -left-4 lg:-bottom-6 lg:-left-6 z-20"
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="bg-[#2FBF71] rounded-2xl p-4 shadow-xl text-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-xl">75+</div>
                        <div className="text-white/80 text-xs">Happy Families</div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
            
            {/* Compact Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100 text-center">
                <div className="text-2xl lg:text-3xl font-bold text-[#2FBF71] mb-1">75+</div>
                <div className="text-slate-600 text-xs font-medium">Happy Students</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100 text-center">
                <div className="text-2xl lg:text-3xl font-bold text-[#1F3A5F] mb-1">30+</div>
                <div className="text-slate-600 text-xs font-medium">Active Courses</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100 text-center">
                <div className="text-2xl lg:text-3xl font-bold text-[#1F3A5F] mb-1">15+</div>
                <div className="text-slate-600 text-xs font-medium">Expert Teachers</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100 text-center">
                <div className="text-2xl lg:text-3xl font-bold text-[#2FBF71] mb-1">95%</div>
                <div className="text-slate-600 text-xs font-medium">Success Rate</div>
              </div>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>
      
      {/* Our Values Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <FadeInWhenVisible>
            <div className="text-center mb-12 lg:mb-16">
              <div className="inline-flex items-center gap-2 bg-[#2FBF71]/10 text-[#2FBF71] px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Heart className="w-4 h-4" />
                What We Believe In
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1F3A5F] mb-4">Our Core Values</h2>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Brain, title: "Personalized Learning", desc: "Every child learns differently. We adapt our teaching to match each student's unique pace and style.", color: "from-[#1F3A5F] to-[#2a4a75]" },
              { icon: Target, title: "Excellence", desc: "We maintain the highest standards in our curriculum, instruction, and student support.", color: "from-[#2FBF71] to-[#25a060]" },
              { icon: Users, title: "Family Partnership", desc: "We work closely with parents to ensure every child gets the support they need to succeed.", color: "from-[#1F3A5F] to-[#2FBF71]" },
              { icon: TrendingUp, title: "Continuous Growth", desc: "We stay up-to-date with the latest teaching methods and continuously improve our courses.", color: "from-[#2FBF71] to-[#3dd88a]" },
            ].map((item, i) => (
              <FadeInWhenVisible key={item.title} delay={0.1 * i}>
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 h-full group hover:shadow-xl transition-all">
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1F3A5F] mb-2">{item.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-[#f8fafb]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <FadeInWhenVisible>
            <div className="bg-[#1F3A5F] rounded-3xl p-8 sm:p-12 md:p-16 relative overflow-hidden">
              {/* Dot pattern */}
              <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px'
                }}
              ></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="text-center lg:text-left max-w-xl">
                  <div className="inline-flex items-center gap-2 bg-[#2FBF71]/15 text-[#2FBF71] px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <Sparkles className="w-4 h-4" />
                    Start Today
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                    Ready to Transform Your Child's Learning?
                  </h3>
                  <p className="text-white/70 text-base lg:text-lg">
                    Book a free demo class and see the difference personalized online tutoring can make.
                  </p>
                </div>
                
                <div className="flex flex-col items-center lg:items-end gap-4">
                  <Button
                    onClick={() => navigate("/contact")}
                    size="lg"
                    className="group bg-[#2FBF71] hover:bg-[#25a060] text-white px-10 py-6 h-auto text-lg font-bold rounded-xl shadow-xl shadow-[#2FBF71]/25 transition-all hover:shadow-2xl hover:scale-105"
                    data-testid="button-book-demo"
                  >
                    <span className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5" />
                      Book Free Demo
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                  <Button
                    onClick={() => navigate("/courses")}
                    variant="outline"
                    className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-6"
                    data-testid="button-explore-courses"
                  >
                    Explore Courses
                  </Button>
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
