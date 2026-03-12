import { motion } from "framer-motion";
import { HelpCircle, MessageCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const faqs = [
    {
        q: "How do I get started?",
        a: "Step 1: Fill out our online registration form. Step 2: Wait for our team to contact you. Step 3: We will fix a suitable time for your demo class. Step 4: A Zoom link will be sent to the student's email.",
    },
    {
        q: "What do I need for the demo class?",
        a: "You need: A device (laptop, tablet, or phone), Zoom installed, Working microphone, and a Stable internet connection.",
    },
    {
        q: "When will I get the Zoom link?",
        a: "The Zoom link will be shared through email once the demo timing is fixed.",
    },
    {
        q: "How long do I have to wait after filling the form?",
        a: "Our team generally contacts you within 24 hours.",
    },
    {
        q: "How are class timings decided?",
        a: "Timings are finalized based on discussion with the parent/student and teacher availability.",
    },
    {
        q: "How long is the class?",
        a: "The demo class usually lasts 45-60 minutes, depending on the subject and level.",
    },
    {
        q: "Is the demo class free?",
        a: "Yes, the demo class is completely free.",
    },
    {
        q: "Which subjects do you teach?",
        a: "We offer one-on-one classes for: Math, Science, English, Computer Science, and more (based on demand and level).",
    },
    {
        q: "How many students are in one class?",
        a: "Our classes are always 100% one-on-one.",
    },
    {
        q: "When do classes start after the demo?",
        a: "Classes start as soon as you confirm and the schedule is finalized.",
    },
    {
        q: "How do payments work?",
        a: "After the demo, we discuss packages and payment options. You can choose the plan that suits you.",
    },
    {
        q: "Can I change the class timings later?",
        a: "Yes, you can request a timing adjustment, and we will coordinate with the teacher.",
    },
    {
        q: "What if I miss a class?",
        a: "Missed classes can be rescheduled based on teacher availability.",
    },
];

export default function FAQSection() {
    const [, navigate] = useLocation();

    return (
        <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-white to-[#f8fafb]">
            <div className="max-w-4xl mx-auto px-4 md:px-6">
                <div className="text-center mb-8 sm:mb-12">
                    <div className="flex justify-center mb-4">
                        <div className="inline-flex items-center gap-2 bg-[#1F3A5F]/5 text-[#1F3A5F] px-4 py-2 rounded-full text-sm font-medium">
                            <HelpCircle className="w-4 h-4" /> Got Questions?
                        </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1F3A5F] mb-4">Frequently Asked Questions</h2>
                    <p className="text-slate-600 max-w-xl mx-auto">Find answers to common questions about our courses and learning experience.</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <details
                            key={i}
                            className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-lg"
                        >
                            <summary className="font-semibold text-[#1F3A5F] cursor-pointer flex items-center justify-between p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#2FBF71]/10 flex items-center justify-center flex-shrink-0 group-open:bg-[#2FBF71] transition-colors">
                                        <span className="text-[#2FBF71] font-bold text-sm group-open:text-white">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                    </div>
                                    <span className="text-left">{faq.q}</span>
                                </div>
                                <ChevronDown className="w-5 h-5 text-[#1F3A5F] group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="px-6 pb-6 pt-0">
                                <div className="pl-14 border-l-2 border-[#2FBF71]/20">
                                    <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                                </div>
                            </div>
                        </details>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-slate-600 mb-4">Still have questions?</p>
                    <Button onClick={() => navigate("/contact")} variant="outline" className="border-2 border-[#2FBF71] text-[#2FBF71] font-semibold">
                        <MessageCircle className="w-4 h-4 mr-2" /> Contact Us
                    </Button>
                </div>
            </div>
        </section>
    );
}
