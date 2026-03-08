import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Mail, Phone, Globe, Send, MessageCircle, Clock, ChevronDown, Loader2,
  GraduationCap, Laptop, Music2, Palette, Sparkles, Star, CheckCircle2,
  ArrowRight, HelpCircle, Users, Zap, Shield, BookOpen, User, Calendar,
  MapPin, Check
} from "lucide-react";
import FadeInWhenVisible from "../components/FadeInWhenVisible";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type ProgramType = 'academics' | 'computer' | 'dance' | 'arts' | '';

export default function Contact() {
  const [, navigate] = useLocation();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  // Unified form state
  const [formData, setFormData] = useState({
    // Program selection
    programType: '' as ProgramType,
    
    // Common fields - Parent Info
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    
    // Common fields - Student Info
    studentName: '',
    studentDOB: '',
    studentAge: '',
    studentGrade: '',
    
    // Common fields - Contact & Schedule
    location: '',
    country: '',
    state: '',
    zipCode: '',
    zoomEmail: '',
    previousOnlineClass: '',
    demoTime: '',
    additionalInfo: '',
    
    // Academics specific
    strongPoints: '',
    weakPoints: '',
    expectations: '',
    
    // Computer specific
    computerComfort: '',
    topicInterest: '',
    toolToLearn: '',
    heardProgramming: '',
    learningPace: '',
    deviceUsing: '',
    enjoyDesigning: '',
    wantApps: '',
    interestedAI: '',
    softwareUsed: '',
    
    // Dance specific
    danceStyle: '',
    
    // Arts specific
    artForm: '',
    learningNeeds: '',
    heardAbout: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectProgram = (program: ProgramType) => {
    setFormData(prev => ({ ...prev, programType: program }));
    setCurrentStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Guard against empty program type
    if (!formData.programType) {
      toast({
        title: "Program Required",
        description: "Please select a program before submitting.",
        variant: "destructive"
      });
      setCurrentStep(1);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submitData: any = {
        formType: formData.programType,
        studentName: formData.studentName,
        parentName: formData.parentName,
        parentEmail: formData.parentEmail,
        parentPhone: formData.parentPhone,
        zoomEmail: formData.zoomEmail,
        studentDOB: formData.studentDOB,
        studentAge: formData.studentAge,
        studentGrade: formData.studentGrade,
        location: formData.location,
        country: formData.country,
        state: formData.state,
        zipCode: formData.zipCode,
        demoTime: formData.demoTime,
        previousOnlineClass: formData.previousOnlineClass,
        additionalInfo: formData.additionalInfo,
      };

      // Add program-specific fields
      if (formData.programType === 'academics') {
        submitData.strongPoints = formData.strongPoints;
        submitData.weakPoints = formData.weakPoints;
        submitData.expectations = formData.expectations;
      } else if (formData.programType === 'computer') {
        submitData.computerComfort = formData.computerComfort;
        submitData.topicInterest = formData.topicInterest;
        submitData.toolToLearn = formData.toolToLearn;
        submitData.heardProgramming = formData.heardProgramming;
        submitData.learningPace = formData.learningPace;
        submitData.deviceUsing = formData.deviceUsing;
        submitData.enjoyDesigning = formData.enjoyDesigning;
        submitData.wantApps = formData.wantApps;
        submitData.interestedAI = formData.interestedAI;
        submitData.softwareUsed = formData.softwareUsed;
      } else if (formData.programType === 'dance') {
        submitData.danceStyle = formData.danceStyle;
      } else if (formData.programType === 'arts') {
        submitData.artForm = formData.artForm;
        submitData.learningNeeds = formData.learningNeeds;
        submitData.heardAbout = formData.heardAbout;
        submitData.expectations = formData.expectations;
      }

      await apiRequest("POST", "/api/prospect-students", submitData);
      
      toast({
        title: "Registration Submitted!",
        description: "Thank you! You'll receive a confirmation email shortly. We'll contact you within 24-48 hours to schedule your demo class.",
      });
      
      // Reset form
      setFormData({
        programType: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        studentName: '',
        studentDOB: '',
        studentAge: '',
        studentGrade: '',
        location: '',
        country: '',
        state: '',
        zipCode: '',
        zoomEmail: '',
        previousOnlineClass: '',
        demoTime: '',
        additionalInfo: '',
        strongPoints: '',
        weakPoints: '',
        expectations: '',
        computerComfort: '',
        topicInterest: '',
        toolToLearn: '',
        heardProgramming: '',
        learningPace: '',
        deviceUsing: '',
        enjoyDesigning: '',
        wantApps: '',
        interestedAI: '',
        softwareUsed: '',
        danceStyle: '',
        artForm: '',
        learningNeeds: '',
        heardAbout: '',
      });
      setCurrentStep(1);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const programs = [
    { id: 'academics' as ProgramType, icon: GraduationCap, title: 'Academics', desc: 'Math, Science, Nepali & more', color: 'from-[#1F3A5F] to-[#2a4a75]', shadow: 'shadow-[#1F3A5F]/20' },
    { id: 'computer' as ProgramType, icon: Laptop, title: 'Computer', desc: 'Coding, Programming & Tech', color: 'from-[#2FBF71] to-[#25a060]', shadow: 'shadow-[#2FBF71]/20' },
    { id: 'dance' as ProgramType, icon: Music2, title: 'Dance', desc: 'Classical & Modern Dance', color: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/20' },
    { id: 'arts' as ProgramType, icon: Palette, title: 'Arts & Music', desc: 'Drawing, Painting & Music', color: 'from-purple-500 to-indigo-500', shadow: 'shadow-purple-500/20' },
  ];

  const selectedProgram = programs.find(p => p.id === formData.programType);

  const inputClassName = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2FBF71] focus:border-transparent transition-all bg-white";
  const labelClassName = "block text-sm font-medium text-slate-700 mb-2";

  return (
    <div className="bg-gradient-to-b from-white to-[#f8fafb] text-slate-800 min-h-screen">
      <Navbar />
      {/* Header Section */}
      <section className="pt-28 pb-12 lg:pt-32 lg:pb-16 bg-[#1F3A5F] relative overflow-hidden">
        <div className="absolute top-20 right-10 w-80 h-80 bg-[#2FBF71]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-[#2FBF71]/5 rounded-full blur-2xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-[#2FBF71]/15 border border-[#2FBF71]/30 text-[#2FBF71] px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Free Demo Class Available
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white mb-6"
            >
              Start Your Child's <span className="text-[#2FBF71]">Journey</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-8"
            >
              Book a free demo class and discover how we make learning magical for your child!
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm mt-[20px] mb-[20px]"
            >
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-5 h-5 text-[#2FBF71]" />
                <span>100% Free Trial</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-5 h-5 text-[#2FBF71]" />
                <span>Expert Teachers</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle2 className="w-5 h-5 text-[#2FBF71]" />
                <span>24hr Response</span>
              </div>
            </motion.div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 36C840 40 960 48 1080 52C1200 56 1320 56 1380 56L1440 56V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V80Z" fill="white"/>
          </svg>
        </div>
      </section>
      {/* Registration Form Section */}
      <section className="-mt-px py-12 lg:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-[#2FBF71]' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 1 ? 'bg-[#2FBF71] text-white' : 'bg-slate-200 text-slate-500'}`}>
                {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Choose Program</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200">
              <div className={`h-full bg-[#2FBF71] transition-all ${currentStep >= 2 ? 'w-full' : 'w-0'}`}></div>
            </div>
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-[#2FBF71]' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 2 ? 'bg-[#2FBF71] text-white' : 'bg-slate-200 text-slate-500'}`}>
                2
              </div>
              <span className="text-sm font-medium hidden sm:inline">Fill Details</span>
            </div>
          </div>

          {/* Step 1: Program Selection */}
          {currentStep === 1 && (
            <FadeInWhenVisible>
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-[#1F3A5F] mb-2">Choose Your Program</h2>
                <p className="text-slate-600">Select the program you're interested in for a free demo class</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {programs.map((program) => (
                  <button
                    key={program.id}
                    onClick={() => selectProgram(program.id)}
                    className={`p-6 rounded-2xl border-2 transition-all hover:shadow-lg group text-left ${formData.programType === program.id ? 'border-[#2FBF71] bg-[#2FBF71]/5' : 'border-slate-100 hover:border-[#2FBF71]/50'}`}
                    data-testid={`button-select-${program.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${program.color} rounded-xl flex items-center justify-center shadow-lg ${program.shadow} group-hover:scale-105 transition-transform`}>
                        <program.icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#1F3A5F]">{program.title}</h3>
                        <p className="text-sm text-slate-500">{program.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </FadeInWhenVisible>
          )}

          {/* Step 2: Registration Form */}
          {currentStep === 2 && formData.programType && (
            <FadeInWhenVisible>
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                {/* Form Header */}
                <div className={`bg-gradient-to-r ${selectedProgram?.color} p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {selectedProgram && <selectedProgram.icon className="w-8 h-8" />}
                      <div>
                        <h2 className="text-xl font-bold">{selectedProgram?.title} Program Registration</h2>
                        <p className="text-white/80 text-sm">Fill in the details below to book your free demo</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-sm text-white/80 hover:text-white underline"
                    >
                      Change Program
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
                  {/* Parent Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-[#1F3A5F]" />
                      <h3 className="text-lg font-semibold text-[#1F3A5F]">Parent Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClassName}>Parent's Full Name</label>
                        <input
                          type="text"
                          name="parentName"
                          value={formData.parentName}
                          onChange={handleChange}
                          className={inputClassName}
                          placeholder="Enter parent's name"
                          data-testid="input-parent-name"
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>
                          Parent's Email 
                          {formData.programType !== 'academics' && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="email"
                          name="parentEmail"
                          value={formData.parentEmail}
                          onChange={handleChange}
                          required={formData.programType !== 'academics'}
                          className={inputClassName}
                          placeholder="parent@email.com"
                          data-testid="input-parent-email"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClassName}>Parent's Phone (WhatsApp preferred)</label>
                        <input
                          type="tel"
                          name="parentPhone"
                          value={formData.parentPhone}
                          onChange={handleChange}
                          className={inputClassName}
                          placeholder="+977 9XXXXXXXXX"
                          data-testid="input-parent-phone"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Student Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <GraduationCap className="w-5 h-5 text-[#1F3A5F]" />
                      <h3 className="text-lg font-semibold text-[#1F3A5F]">Student Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className={labelClassName}>Student's Full Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="studentName"
                          value={formData.studentName}
                          onChange={handleChange}
                          required
                          className={inputClassName}
                          placeholder="Enter student's name"
                          data-testid="input-student-name"
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Date of Birth <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          name="studentDOB"
                          value={formData.studentDOB}
                          onChange={handleChange}
                          required
                          className={inputClassName}
                          data-testid="input-student-dob"
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Age <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          name="studentAge"
                          value={formData.studentAge}
                          onChange={handleChange}
                          required
                          className={inputClassName}
                          placeholder="e.g., 8"
                          data-testid="input-student-age"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClassName}>Current Grade <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="studentGrade"
                          value={formData.studentGrade}
                          onChange={handleChange}
                          required
                          className={inputClassName}
                          placeholder="e.g., Grade 5"
                          data-testid="input-student-grade"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Class Details */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-[#1F3A5F]" />
                      <h3 className="text-lg font-semibold text-[#1F3A5F]">Class Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClassName}>Country <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          required
                          className={inputClassName}
                          placeholder="e.g., United States, Nepal"
                          data-testid="input-country"
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>State/Province <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          required
                          className={inputClassName}
                          placeholder="e.g., Colorado, Bagmati"
                          data-testid="input-state"
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Zip/Postal Code</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleChange}
                          className={inputClassName}
                          placeholder="e.g., 80202, 44600"
                          data-testid="input-zipcode"
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>
                          Zoom Email 
                          {formData.programType !== 'computer' && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="email"
                          name="zoomEmail"
                          value={formData.zoomEmail}
                          onChange={handleChange}
                          required={formData.programType !== 'computer'}
                          className={inputClassName}
                          placeholder="Email for Zoom class"
                          data-testid="input-zoom-email"
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Previous Online Class Experience</label>
                        <select
                          name="previousOnlineClass"
                          value={formData.previousOnlineClass}
                          onChange={handleChange}
                          className={inputClassName}
                          data-testid="select-previous-online-class"
                        >
                          <option value="">Select an option</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClassName}>Preferred Demo Time <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="demoTime"
                          value={formData.demoTime}
                          onChange={handleChange}
                          required
                          className={inputClassName}
                          placeholder="e.g., Monday 5pm"
                          data-testid="input-demo-time"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Program-Specific Fields */}
                  {formData.programType === 'academics' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Star className="w-5 h-5 text-[#1F3A5F]" />
                        <h3 className="text-lg font-semibold text-[#1F3A5F]">Academic Details</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className={labelClassName}>Child's Strong Points <span className="text-red-500">*</span></label>
                          <textarea
                            name="strongPoints"
                            value={formData.strongPoints}
                            onChange={handleChange}
                            required
                            rows={2}
                            className={`${inputClassName} resize-none`}
                            placeholder="Describe strengths..."
                            data-testid="input-strong-points"
                          />
                        </div>
                        <div>
                          <label className={labelClassName}>Areas for Improvement <span className="text-red-500">*</span></label>
                          <textarea
                            name="weakPoints"
                            value={formData.weakPoints}
                            onChange={handleChange}
                            required
                            rows={2}
                            className={`${inputClassName} resize-none`}
                            placeholder="Areas needing improvement..."
                            data-testid="input-weak-points"
                          />
                        </div>
                        <div>
                          <label className={labelClassName}>Your Expectations</label>
                          <textarea
                            name="expectations"
                            value={formData.expectations}
                            onChange={handleChange}
                            rows={2}
                            className={`${inputClassName} resize-none`}
                            placeholder="What do you expect from this class?"
                            data-testid="input-expectations"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.programType === 'computer' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Laptop className="w-5 h-5 text-[#1F3A5F]" />
                        <h3 className="text-lg font-semibold text-[#1F3A5F]">Computer Program Details</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClassName}>Computer Comfort Level</label>
                          <select
                            name="computerComfort"
                            value={formData.computerComfort}
                            onChange={handleChange}
                            className={inputClassName}
                            data-testid="select-computer-comfort"
                          >
                            <option value="">Select level</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClassName}>Topic of Interest</label>
                          <input
                            type="text"
                            name="topicInterest"
                            value={formData.topicInterest}
                            onChange={handleChange}
                            className={inputClassName}
                            placeholder="e.g., Game development, Web design"
                            data-testid="input-topic-interest"
                          />
                        </div>
                        <div>
                          <label className={labelClassName}>Tool/Language to Learn</label>
                          <input
                            type="text"
                            name="toolToLearn"
                            value={formData.toolToLearn}
                            onChange={handleChange}
                            className={inputClassName}
                            placeholder="e.g., Python, JavaScript"
                            data-testid="input-tool-to-learn"
                          />
                        </div>
                        <div>
                          <label className={labelClassName}>Have you heard of programming?</label>
                          <select
                            name="heardProgramming"
                            value={formData.heardProgramming}
                            onChange={handleChange}
                            className={inputClassName}
                            data-testid="select-heard-programming"
                          >
                            <option value="">Select an option</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClassName}>Learning Pace</label>
                          <select
                            name="learningPace"
                            value={formData.learningPace}
                            onChange={handleChange}
                            className={inputClassName}
                            data-testid="select-learning-pace"
                          >
                            <option value="">Select pace</option>
                            <option value="slow">Slow & Steady</option>
                            <option value="moderate">Moderate</option>
                            <option value="fast">Fast Learner</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClassName}>Device Being Used</label>
                          <select
                            name="deviceUsing"
                            value={formData.deviceUsing}
                            onChange={handleChange}
                            className={inputClassName}
                            data-testid="select-device-using"
                          >
                            <option value="">Select device</option>
                            <option value="laptop">Laptop</option>
                            <option value="desktop">Desktop</option>
                            <option value="tablet">Tablet</option>
                            <option value="chromebook">Chromebook</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClassName}>Do you enjoy designing?</label>
                          <select
                            name="enjoyDesigning"
                            value={formData.enjoyDesigning}
                            onChange={handleChange}
                            className={inputClassName}
                            data-testid="select-enjoy-designing"
                          >
                            <option value="">Select an option</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="maybe">Maybe</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClassName}>Want to build apps?</label>
                          <select
                            name="wantApps"
                            value={formData.wantApps}
                            onChange={handleChange}
                            className={inputClassName}
                            data-testid="select-want-apps"
                          >
                            <option value="">Select an option</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="maybe">Maybe</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClassName}>Interested in AI?</label>
                          <select
                            name="interestedAI"
                            value={formData.interestedAI}
                            onChange={handleChange}
                            className={inputClassName}
                            data-testid="select-interested-ai"
                          >
                            <option value="">Select an option</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="maybe">Maybe</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClassName}>Software Already Used</label>
                          <input
                            type="text"
                            name="softwareUsed"
                            value={formData.softwareUsed}
                            onChange={handleChange}
                            className={inputClassName}
                            placeholder="e.g., Scratch, Roblox Studio"
                            data-testid="input-software-used"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.programType === 'dance' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Music2 className="w-5 h-5 text-[#1F3A5F]" />
                        <h3 className="text-lg font-semibold text-[#1F3A5F]">Dance Program Details</h3>
                      </div>
                      <div>
                        <label className={labelClassName}>Preferred Dance Style</label>
                        <select
                          name="danceStyle"
                          value={formData.danceStyle}
                          onChange={handleChange}
                          className={inputClassName}
                          data-testid="select-dance-style"
                        >
                          <option value="">Select style</option>
                          <option value="classical">Classical</option>
                          <option value="contemporary">Contemporary</option>
                          <option value="bollywood">Bollywood</option>
                          <option value="hiphop">Hip Hop</option>
                          <option value="folk">Folk</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {formData.programType === 'arts' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Palette className="w-5 h-5 text-[#1F3A5F]" />
                        <h3 className="text-lg font-semibold text-[#1F3A5F]">Arts Program Details</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className={labelClassName}>Art Form of Interest</label>
                          <select
                            name="artForm"
                            value={formData.artForm}
                            onChange={handleChange}
                            className={inputClassName}
                            data-testid="select-art-form"
                          >
                            <option value="">Select art form</option>
                            <option value="drawing">Drawing</option>
                            <option value="painting">Painting</option>
                            <option value="sketching">Sketching</option>
                            <option value="crafts">Crafts</option>
                            <option value="music">Music</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClassName}>Special Learning Needs</label>
                          <textarea
                            name="learningNeeds"
                            value={formData.learningNeeds}
                            onChange={handleChange}
                            rows={2}
                            className={`${inputClassName} resize-none`}
                            placeholder="Any special requirements..."
                            data-testid="input-learning-needs"
                          />
                        </div>
                        <div>
                          <label className={labelClassName}>How did you hear about us?</label>
                          <input
                            type="text"
                            name="heardAbout"
                            value={formData.heardAbout}
                            onChange={handleChange}
                            className={inputClassName}
                            placeholder="e.g., Social media, friend referral"
                            data-testid="input-heard-about"
                          />
                        </div>
                        <div>
                          <label className={labelClassName}>Your Expectations</label>
                          <textarea
                            name="expectations"
                            value={formData.expectations}
                            onChange={handleChange}
                            rows={2}
                            className={`${inputClassName} resize-none`}
                            placeholder="What do you expect from this class?"
                            data-testid="input-arts-expectations"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  <div>
                    <label className={labelClassName}>Additional Information</label>
                    <textarea
                      name="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={handleChange}
                      rows={3}
                      className={`${inputClassName} resize-none`}
                      placeholder="Anything else you'd like us to know?"
                      data-testid="input-additional-info"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-[#2FBF71] hover:bg-[#25a060] text-white py-6 text-lg"
                    disabled={isSubmitting}
                    data-testid="button-submit-registration"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Demo Request
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </FadeInWhenVisible>
          )}

          {/* Contact Info Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 text-center">
              <div className="w-12 h-12 bg-[#2FBF71]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-[#2FBF71]" />
              </div>
              <h3 className="font-semibold text-[#1F3A5F] mb-1">Call Us</h3>
              <p className="text-slate-600 text-sm">+1 (720) 243-6452</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 text-center">
              <div className="w-12 h-12 bg-[#2FBF71]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-[#2FBF71]" />
              </div>
              <h3 className="font-semibold text-[#1F3A5F] mb-1">Email Us</h3>
              <p className="text-slate-600 text-sm">hello@allorialearning.com</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 text-center">
              <div className="w-12 h-12 bg-[#2FBF71]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-[#2FBF71]" />
              </div>
              <h3 className="font-semibold text-[#1F3A5F] mb-1">Response Time</h3>
              <p className="text-slate-600 text-sm">Within 24 hours</p>
            </div>
          </div>
        </div>
      </section>
      {/* FAQ Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#1F3A5F]/5 text-[#1F3A5F] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <HelpCircle className="w-4 h-4" />
              Common Questions
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1F3A5F]">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { q: "How does the free demo class work?", a: "Once you submit the form, our team will contact you within 24 hours to schedule a convenient time for your child's free demo class via Zoom." },
              { q: "What age groups do you teach?", a: "We teach children from KG to Grade 12 across all our programs - Academics, Computer Science, Dance, and Arts." },
              { q: "What do I need for online classes?", a: "A stable internet connection, a laptop/tablet/desktop with camera and microphone, and a quiet learning space." },
              { q: "Can I switch programs later?", a: "Absolutely! You can switch between programs or take multiple programs as per your child's interests." },
            ].map((faq, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
                  <h3 className="font-semibold text-[#1F3A5F] mb-2">{faq.q}</h3>
                  <p className="text-slate-600 text-sm">{faq.a}</p>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
