import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ActivationPage() {
  const { token } = useParams<{ token: string }>();
  const [isActivated, setIsActivated] = useState(false);

  // Validate token and get activation data
  const { data: activationData, isLoading, error, refetch } = useQuery<{
    parentName: string;
    parentEmail: string;
    parentPhone: string;
    studentName: string;
  }>({
    queryKey: ["/api/activate", token],
    enabled: !!token,
    retry: false,
  });

  // Form setup
  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Activate account mutation
  const activateMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      return await apiRequest({
        method: "POST",
        url: `/api/activate/${token}/password`,
        body: { password: data.password },
      });
    },
    onSuccess: () => {
      setIsActivated(true);
    },
  });

  const onSubmit = (data: PasswordFormData) => {
    activateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validating activation link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || (!isLoading && !activationData)) {
    const errorMessage = error 
      ? (error as any)?.message || "An error occurred while validating the activation link."
      : "This activation link is invalid or has expired.";
    
    const isExpired = errorMessage.toLowerCase().includes('expired');
    const isInvalid = errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('not found');
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>
                {isExpired ? "Activation Link Expired" : "Invalid Activation Link"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to Activate Account</AlertTitle>
              <AlertDescription className="mt-2">
                {errorMessage}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {isExpired && "Your activation link has expired. Please contact the administrator to request a new activation link."}
                {isInvalid && "The activation link you're trying to use is not valid. Please check the link or contact the administrator for assistance."}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => refetch()}
                variant="outline"
                data-testid="button-retry"
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = "/"}
                variant="default"
                data-testid="button-back-to-login"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isActivated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle>Account Activated Successfully!</CardTitle>
            </div>
            <CardDescription>
              Welcome to the eLearning platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">Success!</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                Your parent account and your child's account ({activationData?.studentName}) have been successfully activated.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2 p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">Next Steps:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>You can now log in to access your dashboard</li>
                <li>Monitor your child's progress and course enrollment</li>
                <li>Communicate with teachers through the messaging system</li>
              </ul>
            </div>

            <Button
              onClick={() => window.location.href = "/"}
              className="w-full"
              data-testid="button-go-to-login"
            >
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activationData) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Activate Your Parent Account</CardTitle>
          <CardDescription>
            Welcome, {activationData.parentName}! Set up your password to activate your account and your child's account ({activationData.studentName}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-2 p-4 bg-muted rounded-md">
            <div>
              <span className="text-sm font-medium">Name:</span>{" "}
              <span className="text-sm">{activationData.parentName}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Email:</span>{" "}
              <span className="text-sm">{activationData.parentEmail}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Child:</span>{" "}
              <span className="text-sm">{activationData.studentName}</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
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
                    <FormLabel>Confirm Password *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        {...field}
                        data-testid="input-confirm-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {activateMutation.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Activation Failed</AlertTitle>
                  <AlertDescription className="mt-2">
                    {(activateMutation.error as any)?.message || "Failed to activate account. Please try again or contact support if the problem persists."}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={activateMutation.isPending}
                data-testid="button-activate-account"
              >
                {activateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  "Activate Account"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
