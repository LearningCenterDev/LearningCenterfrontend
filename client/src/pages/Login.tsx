import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff, Download, ExternalLink, FileText, Play, Sparkles, BookOpen, Users, Award, Shield, GraduationCap, Phone } from "lucide-react";
import { motion } from "framer-motion";
import logoImage from "@assets/Favicon.png";
import { ForgotPasswordDialog } from "@/components/ForgotPasswordDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [error, setError] = useState("");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'pdf' | 'video'>('pdf');
  const [, navigate] = useLocation();
  
  const pdfUrl = "/Protecting-Our-Children-Guide.pdf";
  const videoEmbedUrl = "https://drive.google.com/file/d/1b9heXm5K21ByTkffvUuUzqDGl2XtwcZK/preview";
  
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const handleLogin = async (data: LoginForm) => {
    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid email or password");
      }
      
      const loginData = await response.json();
      
      // Update local cache immediately with the user data returned from login
      queryClient.setQueryData(["/api/auth/user"], loginData.user);
      
      // Navigate using wouter's client-side navigation instead of full page reload
      // to avoid re-downloading all assets
      navigate("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid email or password. Please try again.");
      setIsSubmitting(false);
    }
    // Don't reset isSubmitting on success - keep showing loader until redirect completes
  };

  const features = [
    { icon: BookOpen, text: "Expert-Led Courses" },
    { icon: Users, text: "1-on-1 Sessions" },
    { icon: Award, text: "Certified Teachers" },
    { icon: Shield, text: "Safe Learning" },
  ];

  // Show full-screen loader after successful login
  if (loginSuccess) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1F3A5F] via-[#2a4a75] to-[#1F3A5F] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2FBF71]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#2FBF71]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/5 rounded-full"></div>
        
        {/* Back Button */}
        <motion.button 
          type="button"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate("/")}
          className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all z-20 group cursor-pointer border border-white/10" 
          data-testid="link-back-home"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </motion.button>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Logo */}
            <div className="mb-8">
              <div className="relative inline-block p-2 bg-white rounded-full shadow-xl">
                <img 
                  src={logoImage} 
                  alt="Alloria Learning Center" 
                  className="w-20 h-20 relative z-10"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Welcome Text */}
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome Back!
            </h1>
            <p className="text-white/70 text-lg mb-12 max-w-md">
              Continue your child's learning journey with personalized courses designed for success.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4"
                >
                  <div className="w-10 h-10 bg-[#2FBF71] rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex items-center justify-center gap-8"
            >
              <div className="text-center">
                <p className="text-3xl font-bold text-[#2FBF71]">50+</p>
                <p className="text-white/60 text-sm">Students</p>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#2FBF71]">50+</p>
                <p className="text-white/60 text-sm">Courses</p>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#2FBF71]">98%</p>
                <p className="text-white/60 text-sm">Satisfaction</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-b from-white to-[#f8fafb]">
        {/* Mobile Back Link */}
        <button 
          onClick={() => navigate("/")}
          className="lg:hidden absolute top-6 left-6 text-[#1F3A5F] hover:text-[#1F3A5F]/80 transition-colors flex items-center gap-2 z-50" 
          data-testid="link-back-home-mobile"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-[#2FBF71]/20 rounded-full blur-lg"></div>
                <img src={logoImage} alt="Alloria Learning Center" className="w-16 h-16 relative z-10" loading="lazy" />
              </div>
              <span className="text-xl font-bold text-[#1F3A5F]">Alloria Learning Center</span>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-[#2FBF71]/10 text-[#2FBF71] px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Your Portal
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1F3A5F] mb-2" data-testid="text-login-title">
                Sign In to Continue
              </h1>
              <p className="text-slate-500" data-testid="text-login-subtitle">
                Access your courses and learning materials
              </p>
            </div>

            {/* Login Form Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-5">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3" data-testid="text-error">
                      <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1F3A5F] font-medium">Email Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="you@example.com"
                            data-testid="input-email"
                            className="h-12 rounded-xl border-slate-200 focus:border-[#2FBF71] focus:ring-[#2FBF71]/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-[#1F3A5F] font-medium">Password</FormLabel>
                          <button
                            type="button"
                            onClick={() => setForgotPasswordOpen(true)}
                            className="text-sm text-[#2FBF71] hover:text-[#25a060] font-medium transition-colors"
                            data-testid="button-forgot-password"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              data-testid="input-password"
                              className="h-12 rounded-xl border-slate-200 focus:border-[#2FBF71] focus:ring-[#2FBF71]/20 pr-12"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-remember-me"
                            className="border-slate-300 data-[state=checked]:bg-[#2FBF71] data-[state=checked]:border-[#2FBF71]"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal text-slate-600 cursor-pointer">
                          Remember me for 30 days
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit"
                    size="lg" 
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-[#2FBF71] to-[#25a060] hover:from-[#25a060] hover:to-[#1f8a50] shadow-lg shadow-[#2FBF71]/25"
                    data-testid="button-login"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Signing In...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-slate-500 mt-6">
              Need help? Call <a href="tel:+17202426452" className="text-[#2FBF71] hover:underline font-bold">+1 (720) 243-6452</a>
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-6">
          <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2FBF71]/10 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-[#2FBF71]" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#1F3A5F]">Trusted by 50+ Families</p>
                <p className="text-xs text-slate-500">Quality education for every child</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['S', 'A', 'M'].map((letter, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] border-2 border-white flex items-center justify-center text-white text-xs font-medium">
                    {letter}
                  </div>
                ))}
              </div>
              <div className="bg-[#2FBF71] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                +500
              </div>
            </div>
          </div>
        </div>
      </div>
      <ForgotPasswordDialog 
        open={forgotPasswordOpen} 
        onOpenChange={setForgotPasswordOpen}
      />
      <Dialog open={pdfModalOpen} onOpenChange={(open) => {
        setPdfModalOpen(open);
        if (!open) setViewMode('pdf');
      }}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-6" data-testid="dialog-protecting-guide">
          <DialogHeader className="flex-shrink-0 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-[#1F3A5F]">Protecting Our Children: A Parent's Guide</DialogTitle>
                <DialogDescription>
                  Essential guidance on child safety and well-being
                </DialogDescription>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mr-6">
                <Button
                  variant={viewMode === 'pdf' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('pdf')}
                  className={`gap-2 rounded-lg ${viewMode === 'pdf' ? 'bg-[#1F3A5F]' : ''}`}
                  data-testid="button-view-pdf"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </Button>
                <Button
                  variant={viewMode === 'video' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('video')}
                  className={`gap-2 rounded-lg ${viewMode === 'video' ? 'bg-[#2FBF71]' : ''}`}
                  data-testid="button-view-video"
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
                data-testid="pdf-viewer-protecting-guide"
              >
                <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
                  <p className="text-slate-500">Unable to display PDF inline.</p>
                  <div className="flex gap-3 flex-wrap justify-center">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F3A5F] text-white rounded-xl font-medium hover:bg-[#2a4a75] transition-colors"
                      data-testid="button-pdf-open-new-tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in New Tab
                    </a>
                    <a
                      href={pdfUrl}
                      download="Protecting-Our-Children-Guide.pdf"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2FBF71] text-white rounded-xl font-medium hover:bg-[#25a060] transition-colors"
                      data-testid="button-pdf-download"
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
                data-testid="video-viewer-protecting-guide"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
