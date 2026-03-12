import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Phone, Globe, Send, MessageCircle, Clock, ChevronDown, Loader2,
  GraduationCap, Laptop, Music2, Palette, Sparkles, Star, CheckCircle2,
  ArrowRight, HelpCircle, Users, Zap, Shield, BookOpen, User, Calendar,
  MapPin, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type ProgramType = 'academics' | 'computer' | 'dance' | 'arts' | '';

export default function ContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        programType: '' as ProgramType,
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
        if (!formData.programType) {
            toast({ title: "Program Required", description: "Please select a program.", variant: "destructive" });
            setCurrentStep(1);
            return;
        }
        setIsSubmitting(true);
        try {
            await apiRequest("POST", "/api/prospect-students", { ...formData, formType: formData.programType });
            toast({ title: "Registration Submitted!", description: "We'll contact you within 24-48 hours." });
            
            // Reset form
            setFormData({
                programType: '', parentName: '', parentEmail: '', parentPhone: '',
                studentName: '', studentDOB: '', studentAge: '', studentGrade: '',
                location: '', country: '', state: '', zipCode: '', zoomEmail: '',
                previousOnlineClass: '', demoTime: '', additionalInfo: '',
                strongPoints: '', weakPoints: '', expectations: '',
                computerComfort: '', topicInterest: '', toolToLearn: '',
                heardProgramming: '', learningPace: '', deviceUsing: '',
                enjoyDesigning: '', wantApps: '', interestedAI: '', softwareUsed: '',
                danceStyle: '', artForm: '', learningNeeds: '', heardAbout: '',
            });
            setCurrentStep(1);
        } catch (error) {
            toast({ title: "Submission Failed", description: "Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const programs = [
        { id: 'academics' as ProgramType, icon: GraduationCap, title: 'Academics', desc: 'Math, Science & more', color: 'from-[#1F3A5F] to-[#2a4a75]', shadow: 'shadow-[#1F3A5F]/20' },
        { id: 'computer' as ProgramType, icon: Laptop, title: 'Computer', desc: 'Coding & Tech', color: 'from-[#2FBF71] to-[#25a060]', shadow: 'shadow-[#2FBF71]/20' },
        { id: 'dance' as ProgramType, icon: Music2, title: 'Dance', desc: 'Classical & Modern', color: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/20' },
        { id: 'arts' as ProgramType, icon: Palette, title: 'Arts & Music', desc: 'Drawing & Music', color: 'from-purple-500 to-indigo-500', shadow: 'shadow-purple-500/20' },
    ];

    const selectedProgram = programs.find(p => p.id === formData.programType);
    const inputClassName = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2FBF71] focus:border-transparent transition-all bg-white";
    const labelClassName = "block text-sm font-medium text-slate-700 mb-2";

    return (
        <div className="max-w-4xl mx-auto">
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

            <AnimatePresence mode="wait">
                {currentStep === 1 ? (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#1F3A5F] mb-2">Choose Your Program</h2>
                            <p className="text-slate-600">Select interest for a free demo class</p>
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
                    </motion.div>
                ) : (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                            <div className={`bg-gradient-to-r ${selectedProgram?.color} p-6 text-white`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {selectedProgram && <selectedProgram.icon className="w-8 h-8" />}
                                        <div>
                                            <h2 className="text-xl font-bold">{selectedProgram?.title} Program Registration</h2>
                                            <p className="text-white/80 text-sm">Fill in the details below to book your free demo</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setCurrentStep(1)} className="text-sm text-white/80 hover:text-white underline">Change</button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
                                {/* Parent Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <User className="w-5 h-5 text-[#1F3A5F]" />
                                        <h3 className="text-lg font-semibold text-[#1F3A5F]">Parent Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClassName}>Parent's Full Name</label>
                                            <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} className={inputClassName} placeholder="Full Name" data-testid="input-parent-name" />
                                        </div>
                                        <div>
                                            <label className={labelClassName}>Parent's Email {formData.programType !== 'academics' && "*"}</label>
                                            <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} required={formData.programType !== 'academics'} className={inputClassName} placeholder="email@example.com" data-testid="input-parent-email" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className={labelClassName}>Phone (WhatsApp preferred)</label>
                                            <input type="tel" name="parentPhone" value={formData.parentPhone} onChange={handleChange} className={inputClassName} placeholder="+1 234 567 890" data-testid="input-parent-phone" />
                                        </div>
                                    </div>
                                </div>

                                {/* Student Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <GraduationCap className="w-5 h-5 text-[#1F3A5F]" />
                                        <h3 className="text-lg font-semibold text-[#1F3A5F]">Student Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className={labelClassName}>Student's Full Name *</label>
                                            <input type="text" name="studentName" value={formData.studentName} onChange={handleChange} required className={inputClassName} placeholder="Student Name" data-testid="input-student-name" />
                                        </div>
                                        <div>
                                            <label className={labelClassName}>Date of Birth *</label>
                                            <input type="date" name="studentDOB" value={formData.studentDOB} onChange={handleChange} required className={inputClassName} data-testid="input-student-dob" />
                                        </div>
                                        <div>
                                            <label className={labelClassName}>Age *</label>
                                            <input type="number" name="studentAge" value={formData.studentAge} onChange={handleChange} required className={inputClassName} placeholder="e.g. 10" data-testid="input-student-age" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className={labelClassName}>Current Grade *</label>
                                            <input type="text" name="studentGrade" value={formData.studentGrade} onChange={handleChange} required className={inputClassName} placeholder="e.g. Grade 5" data-testid="input-student-grade" />
                                        </div>
                                    </div>
                                </div>

                                {/* Class Details */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Calendar className="w-5 h-5 text-[#1F3A5F]" />
                                        <h3 className="text-lg font-semibold text-[#1F3A5F]">Class Details</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClassName}>Country *</label>
                                            <input type="text" name="country" value={formData.country} onChange={handleChange} required className={inputClassName} placeholder="e.g. USA" />
                                        </div>
                                        <div>
                                            <label className={labelClassName}>State/Province *</label>
                                            <input type="text" name="state" value={formData.state} onChange={handleChange} required className={inputClassName} placeholder="e.g. CA" />
                                        </div>
                                        <div>
                                            <label className={labelClassName}>Preferred Demo Time *</label>
                                            <input type="text" name="demoTime" value={formData.demoTime} onChange={handleChange} required className={inputClassName} placeholder="e.g. Monday 4 PM" />
                                        </div>
                                        <div>
                                            <label className={labelClassName}>Zoom Email {formData.programType !== 'computer' && "*"}</label>
                                            <input type="email" name="zoomEmail" value={formData.zoomEmail} onChange={handleChange} required={formData.programType !== 'computer'} className={inputClassName} placeholder="Zoom Email" />
                                        </div>
                                    </div>
                                </div>

                                {/* Program Specifics */}
                                {formData.programType === 'academics' && (
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-[#1F3A5F]">Academic Details</h3>
                                        <div>
                                            <label className={labelClassName}>Strong Points *</label>
                                            <textarea name="strongPoints" value={formData.strongPoints} onChange={handleChange} required rows={2} className={inputClassName} placeholder="Describe strengths..." />
                                        </div>
                                        <div>
                                            <label className={labelClassName}>Areas for Improvement *</label>
                                            <textarea name="weakPoints" value={formData.weakPoints} onChange={handleChange} required rows={2} className={inputClassName} placeholder="Describe weaknesses..." />
                                        </div>
                                    </div>
                                )}

                                {formData.programType === 'computer' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2"><h3 className="font-bold text-[#1F3A5F]">Computer Program Details</h3></div>
                                        <div>
                                            <label className={labelClassName}>Computer Comfort Level</label>
                                            <select name="computerComfort" value={formData.computerComfort} onChange={handleChange} className={inputClassName}>
                                                <option value="">Select level</option>
                                                <option value="beginner">Beginner</option>
                                                <option value="intermediate">Intermediate</option>
                                                <option value="advanced">Advanced</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClassName}>Topic of Interest</label>
                                            <input name="topicInterest" value={formData.topicInterest} onChange={handleChange} className={inputClassName} placeholder="e.g. Coding" />
                                        </div>
                                    </div>
                                )}

                                {formData.programType === 'dance' && (
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-[#1F3A5F]">Dance Details</h3>
                                        <div>
                                            <label className={labelClassName}>Preferred Dance Style</label>
                                            <select name="danceStyle" value={formData.danceStyle} onChange={handleChange} className={inputClassName}>
                                                <option value="">Select style</option>
                                                <option value="classical">Classical</option>
                                                <option value="bollywood">Bollywood</option>
                                                <option value="hiphop">Hip Hop</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {formData.programType === 'arts' && (
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-[#1F3A5F]">Arts Details</h3>
                                        <div>
                                            <label className={labelClassName}>Art Form of Interest</label>
                                            <input name="artForm" value={formData.artForm} onChange={handleChange} className={inputClassName} placeholder="e.g. Painting" />
                                        </div>
                                    </div>
                                )}

                                <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-[#2FBF71] text-white text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all">
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Registration"}
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
