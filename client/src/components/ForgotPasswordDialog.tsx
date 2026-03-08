import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Mail, KeyRound, Shield } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleForgotPassword = async (data: ForgotPasswordForm) => {
    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit password reset request");
      }
      
      setSuccess(true);
      form.reset();
      
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 5000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to submit password reset request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError("");
      setSuccess(false);
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl" data-testid="dialog-forgot-password">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-[#1F3A5F] via-[#2a4a75] to-[#1F3A5F] px-6 py-8 text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2FBF71]/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#2FBF71]/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              {success ? (
                <CheckCircle className="w-8 h-8 text-[#2FBF71]" />
              ) : (
                <KeyRound className="w-8 h-8 text-[#2FBF71]" />
              )}
            </div>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-bold text-white" data-testid="text-forgot-title">
                {success ? "Request Submitted!" : "Reset Password"}
              </DialogTitle>
              <DialogDescription className="text-white/70" data-testid="text-forgot-subtitle">
                {success 
                  ? "We've received your request successfully."
                  : "Enter your email to request a password reset."
                }
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {success ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-full bg-[#2FBF71]/10 border border-[#2FBF71]/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#2FBF71] flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm text-slate-700 font-medium mb-1">
                      What happens next?
                    </p>
                    <p className="text-xs text-slate-500">
                      An administrator will review your request and reset your password if approved. You'll be notified once processed.
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => onOpenChange(false)}
                className="w-full h-11 rounded-xl bg-[#1F3A5F] hover:bg-[#2a4a75] font-semibold"
              >
                Got it, thanks!
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleForgotPassword)} className="space-y-5">
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
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="you@example.com"
                            className="h-12 pl-12 rounded-xl border-slate-200 focus:border-[#2FBF71] focus:ring-[#2FBF71]/20"
                            data-testid="input-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#2FBF71] to-[#25a060] hover:from-[#25a060] hover:to-[#1f8a50] font-semibold shadow-lg shadow-[#2FBF71]/25"
                    data-testid="button-send-reset"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending...
                      </span>
                    ) : (
                      "Send Request"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
