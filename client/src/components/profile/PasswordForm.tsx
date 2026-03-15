import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type PasswordChangeData = z.infer<typeof passwordChangeSchema>;

export default function PasswordForm({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
    const { toast } = useToast();
    const form = useForm<PasswordChangeData>({
        resolver: zodResolver(passwordChangeSchema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    });

    const changePasswordMutation = useMutation({
        mutationFn: async (data: PasswordChangeData) => {
            const response = await apiRequest("POST", "/api/auth/change-password", {
                current_password: data.currentPassword,
                new_password: data.newPassword,
            });
            return response.json();
        },
        onSuccess: () => {
            toast({ title: "Password changed", description: "Your password has been updated." });
            form.reset();
            onSuccess();
        },
        onError: (error: any) => {
            toast({ title: "Failed to change password", description: error.message, variant: "destructive" });
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4">
                <FormField control={form.control} name="currentPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Current Password *</FormLabel>
                        <FormControl><Input type="password" {...field} data-testid="input-current-password" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="newPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel>New Password *</FormLabel>
                        <FormControl><Input type="password" {...field} data-testid="input-new-password" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Confirm New Password *</FormLabel>
                        <FormControl><Input type="password" {...field} data-testid="input-confirm-password" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className="flex justify-end">
                    <Button type="submit" disabled={changePasswordMutation.isPending} data-testid="button-change-password">
                        <Lock className="w-4 h-4 mr-2" />
                        {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
