import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import logoImage from "@assets/Favicon.png";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [email, setEmail] = useState("");
  const [, navigate] = useLocation();
  
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Get token from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Invalid reset link");
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-reset-token/${token}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Invalid or expired reset link");
        }
        const data = await response.json();
        setEmail(data.email);
        setIsVerifying(false);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Invalid or expired reset link");
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleResetPassword = async (data: ResetPasswordForm) => {
    if (!token) {
      setError("Invalid reset link");
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/reset-password-with-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reset password");
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-secondary flex items-center justify-center p-4">
      <Link href="/login" className="absolute top-6 left-6 text-white hover:text-white/80 transition-colors flex items-center gap-2" data-testid="link-back-login">
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </Link>

      <div className="max-w-md w-full space-y-8">
        <div className="flex items-center justify-center gap-4">
          <div className="p-2 bg-white rounded-2xl shadow-lg">
            <img src={logoImage} alt="Learning Center logo" className="w-16 h-16" data-testid="icon-logo" />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-bold text-white" data-testid="text-brand">Learning Center</span>
          </div>
        </div>

        <Card className="w-full" data-testid="card-reset-password">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" data-testid="text-reset-title">
              {success ? "Password Reset Successful" : "Reset Your Password"}
            </CardTitle>
            <CardDescription data-testid="text-reset-subtitle">
              {success 
                ? "Redirecting you to login..." 
                : isVerifying 
                  ? "Verifying reset link..." 
                  : email 
                    ? `Enter a new password for ${email}` 
                    : "Invalid reset link"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isVerifying ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <p className="text-center text-muted-foreground">
                  Your password has been reset successfully. You will be redirected to the login page shortly.
                </p>
              </div>
            ) : error && !email ? (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-md text-center">
                <p className="font-medium">{error}</p>
                <p className="text-sm mt-2">Please request a new password reset link.</p>
                <Link href="/login">
                  <Button className="mt-4" data-testid="button-back-login">
                    Back to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-4">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-md text-sm" data-testid="text-error">
                      {error}
                    </div>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="At least 6 characters"
                            data-testid="input-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Re-enter your new password"
                            data-testid="input-confirm-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit"
                    size="lg" 
                    disabled={isSubmitting}
                    className="w-full"
                    data-testid="button-reset-password"
                  >
                    {isSubmitting ? "Resetting Password..." : "Reset Password"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
