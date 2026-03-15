import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertUserSchema, type User as UserType } from "@shared/schema";

const profileUpdateSchema = insertUserSchema.pick({
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    address: true,
    city: true,
    state: true,
    zipCode: true,
    country: true,
    bio: true,
    dateOfBirth: true,
    gender: true,
    education: true,
    certifications: true,
}).extend({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

export default function ProfileForm({ user, onSuccess }: { user: UserType; onSuccess: () => void }) {
    const { toast } = useToast();
    const form = useForm<ProfileUpdateData>({
        resolver: zodResolver(profileUpdateSchema),
        defaultValues: {
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phone || "",
            address: user.address || "",
            city: user.city || "",
            state: user.state || "",
            zipCode: user.zipCode || "",
            country: user.country || "",
            bio: user.bio || "",
            dateOfBirth: user.dateOfBirth || "",
            gender: user.gender || "",
            education: user.education || "",
            certifications: user.certifications || "",
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: ProfileUpdateData) => {
            // Convert empty date string to null for backend validation
            const payload = {
                ...data,
                dateOfBirth: data.dateOfBirth === "" ? null : data.dateOfBirth,
            };
            const response = await apiRequest("PATCH", "/api/auth/user", payload);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            toast({ title: "Profile updated", description: "Your profile information has been saved." });
            onSuccess();
        },
        onError: (error: any) => {
            toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                            <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input {...field} value={field.value || ""} data-testid="input-first-name" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                            <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input {...field} value={field.value || ""} data-testid="input-last-name" /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email Address *</FormLabel><FormControl><Input type="email" {...field} value={field.value || ""} data-testid="input-email" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="+1 (555) 123-4567" data-testid="input-phone" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                            <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} data-testid="input-dob" /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl><SelectTrigger data-testid="select-gender"><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem><SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem></SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="bio" render={({ field }) => (
                        <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea {...field} value={field.value || ""} placeholder="Tell us about yourself..." rows={4} data-testid="input-bio" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                {user.role === 'teacher' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Education & Certifications</h3>
                        <FormField control={form.control} name="education" render={({ field }) => (
                            <FormItem><FormLabel>Education</FormLabel><FormControl><Textarea {...field} value={field.value || ""} placeholder="e.g., M.Ed. in Mathematics Education" rows={3} data-testid="input-education" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="certifications" render={({ field }) => (
                            <FormItem><FormLabel>Certifications</FormLabel><FormControl><Textarea {...field} value={field.value || ""} placeholder="e.g., Certified Mathematics Teacher" rows={3} data-testid="input-certifications" /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                )}

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Address Information</h3>
                    <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="123 Main St" data-testid="input-address" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="City" data-testid="input-city" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="state" render={({ field }) => (
                            <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="State" data-testid="input-state" /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="zipCode" render={({ field }) => (
                            <FormItem><FormLabel>Zip Code</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Zip Code" data-testid="input-zipcode" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="country" render={({ field }) => (
                            <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Country" data-testid="input-country" /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-save-profile">
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
