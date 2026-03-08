import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { User, Edit, Upload, Lock, Save, X, Camera, ImagePlus, MessageCircle, Calendar, Sparkles, Mail, Phone, MapPin, File, Download, ExternalLink, FileText, Image as ImageIcon, FileSpreadsheet, FileVideo, FileAudio, FileArchive, Globe, GraduationCap, Award } from "lucide-react";
import { getBrowserTimezone, COMMON_TIMEZONES, type TimezoneOption } from "@/lib/timezone";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import type { UserDocument } from "@shared/schema";
import { motion } from "framer-motion";
import StudentHistoryCard from "@/components/StudentHistoryCard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User as UserType, InsertUser } from "@shared/schema";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";

// Profile update schema (excluding password and role)
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
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  education: z.string().optional(),
  certifications: z.string().optional(),
});

// Password change schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
type PasswordChangeData = z.infer<typeof passwordChangeSchema>;

// Image Upload Component (for both avatar and cover photo)
function ImageUpload({ 
  currentImage, 
  userId, 
  uploadType,
  onSuccess 
}: { 
  currentImage?: string | null; 
  userId: string;
  uploadType: 'avatar' | 'cover';
  onSuccess: (newImageUrl: string) => void; 
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, GIF, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Step 1: Get presigned URL
      const fileExtension = selectedFile.name.split('.').pop() || 'jpg';
      const urlResponse = await fetch('/api/upload/profile-image/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          uploadType,
          fileExtension,
        }),
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileName } = await urlResponse.json();

      // Step 2: Upload file directly to object storage using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Step 3: Complete the upload by updating user profile
      const completeResponse = await fetch('/api/upload/profile-image/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          uploadType,
          fileName,
        }),
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete upload');
      }

      const result = await completeResponse.json();
      onSuccess(result.imageUrl);
      setSelectedFile(null);
      
      toast({
        title: `${uploadType === 'avatar' ? 'Avatar' : 'Cover photo'} updated successfully`,
        description: `Your ${uploadType === 'avatar' ? 'profile picture' : 'cover photo'} has been changed.`,
      });
    } catch (error) {
      console.error(`${uploadType} upload failed:`, error);
      toast({
        title: "Upload failed",
        description: `There was an error uploading your ${uploadType}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {uploadType === 'avatar' ? (
        <Avatar className="w-28 h-28 border-4 border-white shadow-xl">
          <AvatarImage src={currentImage || undefined} />
          <AvatarFallback className="text-2xl bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] text-white">
            <Camera className="w-10 h-10" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-full h-40 rounded-xl bg-gradient-to-r from-[#1F3A5F]/10 via-[#2FBF71]/5 to-[#1F3A5F]/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200">
          {currentImage ? (
            <img src={currentImage} alt="Cover" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="text-center">
              <div className="w-14 h-14 bg-[#1F3A5F]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <ImagePlus className="w-7 h-7 text-[#1F3A5F]/50" />
              </div>
              <p className="text-sm text-muted-foreground">Preview will appear here</p>
            </div>
          )}
        </div>
      )}
      
      <div className="flex flex-col items-center gap-3 w-full">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id={`${uploadType}-upload`}
          data-testid={`input-${uploadType}-upload`}
        />
        
        {!selectedFile ? (
          <label htmlFor={`${uploadType}-upload`} className="w-full">
            <div className="w-full p-4 rounded-xl border-2 border-dashed border-[#2FBF71]/30 bg-[#2FBF71]/5 hover:bg-[#2FBF71]/10 transition-colors cursor-pointer text-center">
              <div className="flex items-center justify-center gap-2 text-[#2FBF71] font-medium">
                <Upload className="w-5 h-5" />
                <span>Click to choose an image</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF (max 5MB)</p>
            </div>
          </label>
        ) : (
          <div className="w-full p-4 rounded-xl bg-[#1F3A5F]/5 border border-[#1F3A5F]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#2FBF71]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <ImagePlus className="w-5 h-5 text-[#2FBF71]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1F3A5F] truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={handleUpload} 
                disabled={isUploading}
                className="flex-1 bg-[#2FBF71] hover:bg-[#25a060]"
                data-testid={`button-upload-${uploadType}`}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </span>
                )}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setSelectedFile(null)}
                className="border-slate-200"
                data-testid={`button-cancel-${uploadType}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Profile Information Form
function ProfileForm({ user, onSuccess }: { user: UserType; onSuccess: () => void }) {
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
      // Auto-generate name from first and last name
      const updateData = {
        ...data,
        name: `${data.firstName} ${data.lastName}`.trim(),
      };

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
      
      toast({
        title: "Profile updated successfully",
        description: "Your profile information has been saved.",
      });
      
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update profile",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-6 max-w-full">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      data-testid="input-first-name"
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      data-testid="input-last-name"
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address *</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    {...field} 
                    data-testid="input-email"
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      data-testid="input-phone"
                      value={field.value || ""}
                      placeholder="+1 (555) 123-4567"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      data-testid="input-dob"
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    data-testid="input-bio"
                    value={field.value || ""}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {user.role === 'teacher' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Education & Certifications</h3>
            <FormField
              control={form.control}
              name="education"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      data-testid="input-education"
                      value={field.value || ""}
                      placeholder="e.g., M.Ed. in Mathematics Education, Tribhuvan University (2018)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="certifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certifications</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      data-testid="input-certifications"
                      value={field.value || ""}
                      placeholder="e.g., Certified Mathematics Teacher, Nepal Education Board (2019)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Address Information</h3>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    data-testid="input-address"
                    value={field.value || ""}
                    placeholder="123 Main St, Apt 4B"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      data-testid="input-city"
                      value={field.value || ""}
                      placeholder="San Francisco"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      data-testid="input-state"
                      value={field.value || ""}
                      placeholder="California"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip/Postal Code</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      data-testid="input-zip"
                      value={field.value || ""}
                      placeholder="94102"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      data-testid="input-country"
                      value={field.value || ""}
                      placeholder="United States"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={updateProfileMutation.isPending}
            data-testid="button-save-profile"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Password Change Form
function PasswordForm({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const { toast } = useToast();
  
  const form = useForm<PasswordChangeData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordChangeData) => {
      const response = await fetch(`/api/users/${userId}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed successfully",
        description: "Your password has been updated.",
      });
      
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to change password",
        description: error.message || "An error occurred while changing your password.",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password *</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  {...field} 
                  data-testid="input-current-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password *</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  {...field} 
                  data-testid="input-new-password"
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
              <FormLabel>Confirm New Password *</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  {...field} 
                  data-testid="input-confirm-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={changePasswordMutation.isPending}
            data-testid="button-change-password"
          >
            <Lock className="w-4 h-4 mr-2" />
            {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function PreferencesForm({ user, onSuccess }: { user: UserType; onSuccess: () => void }) {
  const { toast } = useToast();
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    user.timezone || getBrowserTimezone()
  );
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSaveTimezone = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ timezone: selectedTimezone }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update timezone");
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id] });
      toast({
        title: "Preferences Updated",
        description: "Your timezone preference has been saved.",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const browserTz = getBrowserTimezone();
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Timezone Settings</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Schedule times will be displayed in your selected timezone. Your browser's 
            detected timezone is: <Badge variant="outline">{browserTz.replace(/_/g, ' ')}</Badge>
          </p>
        </div>
        
        <div className="grid gap-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Timezone</label>
            <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
              <SelectTrigger data-testid="select-timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz: TimezoneOption) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSaveTimezone} 
              disabled={isSaving || selectedTimezone === user.timezone}
              data-testid="button-save-preferences"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyDocumentsCard({ userId }: { userId: string }) {
  const { data: documents = [], isLoading } = useQuery<UserDocument[]>({
    queryKey: ['/api/users', userId, 'documents'],
    enabled: !!userId,
  });

  const getFileIcon = (type?: string | null) => {
    if (!type) return <File className="w-4 h-4 text-muted-foreground" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (type.includes('image')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) 
      return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
    if (type.includes('video')) return <FileVideo className="w-4 h-4 text-purple-500" />;
    if (type.includes('audio')) return <FileAudio className="w-4 h-4 text-orange-500" />;
    if (type.includes('zip') || type.includes('archive') || type.includes('compressed')) 
      return <FileArchive className="w-4 h-4 text-yellow-500" />;
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="w-5 h-5" />
            My Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50">
          <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] rounded-xl flex items-center justify-center shadow-md">
              <File className="w-5 h-5 text-white" />
            </div>
            My Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="py-1.5 px-3 text-xs">Name</TableHead>
                  <TableHead className="py-1.5 px-3 text-xs">Description</TableHead>
                  <TableHead className="py-1.5 px-3 text-xs">Size</TableHead>
                  <TableHead className="py-1.5 px-3 text-xs">Date</TableHead>
                  <TableHead className="py-1.5 px-3 text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} className="h-10">
                    <TableCell className="py-1.5 px-3">
                      <div className="flex items-center gap-2">
                        {getFileIcon(doc.type)}
                        <span className="font-medium text-sm">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-1.5 px-3 text-sm text-muted-foreground max-w-[200px] truncate" title={doc.description || ''}>
                      {doc.description || '-'}
                    </TableCell>
                    <TableCell className="py-1.5 px-3 text-sm text-muted-foreground">
                      {formatFileSize(doc.size)}
                    </TableCell>
                    <TableCell className="py-1.5 px-3 text-sm text-muted-foreground">
                      {doc.createdAt ? format(new Date(doc.createdAt), "MMM d, yyyy") : '-'}
                    </TableCell>
                    <TableCell className="py-1.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => window.open(`/api/users/${userId}/documents/${doc.id}/download`, '_blank')}
                          title="View document"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          asChild
                          title="Download document"
                        >
                          <a href={`/api/users/${userId}/documents/${doc.id}/download`} download={doc.name}>
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Profile() {
  const { user, isLoading } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || user?.profileImageUrl || "");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(user?.coverPhotoUrl || "");
  const [showSettings, setShowSettings] = useState(false);
  const scrollPositionRef = useRef(0);
  const [, navigate] = useLocation();

  const handleToggleSettings = () => {
    // Save current scroll position
    scrollPositionRef.current = window.scrollY;
    setShowSettings(!showSettings);
  };

  // Prevent auto-scroll when settings expand
  useEffect(() => {
    if (showSettings) {
      // Restore scroll position after settings open
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
      });
    }
  }, [showSettings]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'teacher': return 'default';
      case 'parent': return 'outline';
      case 'student': return 'secondary';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="bg-gradient-to-r from-[#1F3A5F] via-[#1F3A5F] to-[#2a4a75] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="h-8 w-48 bg-white/20 rounded mb-2 animate-pulse" />
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-pulse space-y-4">
                <div className="w-24 h-24 bg-muted rounded-full mx-auto"></div>
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="bg-gradient-to-r from-[#1F3A5F] via-[#1F3A5F] to-[#2a4a75] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <User className="w-5 h-5 text-[#2FBF71]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Profile</h1>
            </div>
            <p className="text-white/60 text-sm sm:text-base">Manage your account settings and preferences</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Please log in to view your profile.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" data-testid="profile-page">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#1F3A5F]/10 via-[#1F3A5F]/5 to-[#2a4a75]/5 relative overflow-hidden border-b border-[#1F3A5F]/10">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, #1F3A5F 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#2FBF71]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-[#1F3A5F]/10 backdrop-blur-sm">
                  <User className="w-5 h-5 text-[#1F3A5F]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F] dark:text-white">Profile</h1>
              </div>
              <p className="text-[#1F3A5F]/60 dark:text-white/60 text-sm sm:text-base">Manage your account settings and preferences</p>
            </div>
            <Badge 
              variant={getRoleColor(user.role)} 
              className="self-start sm:self-auto px-4 py-2 text-sm font-semibold shadow-lg"
              data-testid="user-role-badge"
            >
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Cover Photo Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80">
          <div className="relative">
            <div className="h-40 sm:h-48 lg:h-56 w-full bg-gradient-to-r from-[#1F3A5F]/20 via-[#2FBF71]/10 to-[#1F3A5F]/20 overflow-hidden">
              {coverPhotoUrl || user.coverPhotoUrl ? (
                <img 
                  src={coverPhotoUrl || user.coverPhotoUrl || undefined} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                  data-testid="cover-photo"
                />
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1F3A5F]/5 via-[#2FBF71]/5 to-[#1F3A5F]/10 cursor-pointer hover:from-[#1F3A5F]/10 hover:via-[#2FBF71]/10 hover:to-[#1F3A5F]/15 transition-all group" data-testid="button-change-cover">
                      <div className="text-center px-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
                          <ImagePlus className="w-8 h-8 sm:w-10 sm:h-10 text-[#1F3A5F]/50 dark:text-[#2FBF71]/50 group-hover:text-[#2FBF71] transition-colors" />
                        </div>
                        <p className="text-[#1F3A5F]/70 dark:text-slate-300 font-medium group-hover:text-[#1F3A5F] dark:group-hover:text-white transition-colors text-sm sm:text-base">Personalize your profile</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Click here to add a cover photo</p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Cover Photo</DialogTitle>
                    </DialogHeader>
                    <ImageUpload 
                      currentImage={coverPhotoUrl || user.coverPhotoUrl}
                      userId={user.id}
                      uploadType="cover"
                      onSuccess={(newUrl) => {
                        setCoverPhotoUrl(newUrl);
                        queryClient.setQueryData(["/api/auth/user"], (oldUser: any) => 
                          oldUser ? { ...oldUser, coverPhotoUrl: newUrl } : oldUser
                        );
                      }}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {(coverPhotoUrl || user.coverPhotoUrl) && (
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600"
                      data-testid="button-edit-cover"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Change
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Cover Photo</DialogTitle>
                    </DialogHeader>
                    <ImageUpload 
                      currentImage={coverPhotoUrl || user.coverPhotoUrl}
                      userId={user.id}
                      uploadType="cover"
                      onSuccess={(newUrl) => {
                        setCoverPhotoUrl(newUrl);
                        queryClient.setQueryData(["/api/auth/user"], (oldUser: any) => 
                          oldUser ? { ...oldUser, coverPhotoUrl: newUrl } : oldUser
                        );
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Profile Overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleSettings}
                className="border-[#2FBF71]/30 text-[#2FBF71] hover:bg-[#2FBF71]/5"
                data-testid="button-edit-profile"
              >
                <Edit className="w-4 h-4 mr-2" />
                {showSettings ? "Hide Settings" : "Edit Profile"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Avatar and Name Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700/50">
              <div className="relative flex-shrink-0">
                <Avatar className="w-24 h-24 sm:w-20 sm:h-20 border-4 border-white dark:border-slate-700 shadow-lg">
                  <AvatarImage src={avatarUrl || user.avatarUrl || user.profileImageUrl || undefined} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-[#1F3A5F] to-[#2a4a75] text-white">
                    {user.name ? user.name.split(' ').map((n: string) => n[0]).join('') : user.email?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <Dialog>
                  <DialogTrigger asChild>
                    <button 
                      className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#2FBF71] text-white hover:bg-[#25a060] transition-colors shadow-lg"
                      data-testid="button-change-avatar"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Profile Picture</DialogTitle>
                    </DialogHeader>
                    <ImageUpload 
                      currentImage={avatarUrl || user.avatarUrl || user.profileImageUrl}
                      userId={user.id}
                      uploadType="avatar"
                      onSuccess={(newUrl) => {
                        setAvatarUrl(newUrl);
                        queryClient.setQueryData(["/api/auth/user"], (oldUser: any) => 
                          oldUser ? { ...oldUser, avatarUrl: newUrl, profileImageUrl: newUrl } : oldUser
                        );
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h2 className="text-xl sm:text-xl font-bold text-[#1F3A5F] dark:text-slate-100 truncate" data-testid="display-name">
                  {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Not set'}
                </h2>
                <p className="text-sm text-muted-foreground truncate" data-testid="display-email">{user.email}</p>
                <div className="mt-2 sm:hidden">
                  <Badge variant={getRoleColor(user.role)} className="shadow-sm" data-testid="display-role-badge">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>
              </div>
              <Badge variant={getRoleColor(user.role)} className="shadow-sm hidden sm:inline-flex flex-shrink-0" data-testid="display-role-badge-desktop">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>

          {/* Information Grid */}
          <div className="space-y-5">
            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <div className="w-9 h-9 rounded-lg bg-[#1F3A5F]/10 dark:bg-[#1F3A5F]/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-[#1F3A5F] dark:text-[#2FBF71]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200 truncate text-sm" data-testid="display-email-full">{user.email || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <div className="w-9 h-9 rounded-lg bg-[#2FBF71]/10 dark:bg-[#2FBF71]/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-[#2FBF71]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200 text-sm" data-testid="display-phone">{user.phone || 'Not set'}</p>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1F3A5F]/10 dark:bg-[#1F3A5F]/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1F3A5F] dark:text-[#2FBF71]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className={`font-medium text-sm capitalize ${user.gender ? 'text-slate-700 dark:text-slate-200' : 'text-muted-foreground italic'}`} data-testid="display-gender">{user.gender || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1F3A5F]/10 dark:bg-[#1F3A5F]/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1F3A5F] dark:text-[#2FBF71]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Birthday</p>
                  <p className={`font-medium text-sm ${user.dateOfBirth ? 'text-slate-700 dark:text-slate-200' : 'text-muted-foreground italic'}`} data-testid="display-dob">
                    {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#2FBF71]/10 dark:bg-[#2FBF71]/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2FBF71]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200 text-sm" data-testid="display-join-date">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1F3A5F]/10 dark:bg-[#1F3A5F]/20 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1F3A5F] dark:text-[#2FBF71]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Timezone</p>
                  <p className={`font-medium text-sm ${user.timezone ? 'text-slate-700 dark:text-slate-200' : 'text-muted-foreground italic'}`} data-testid="display-timezone">
                    {user.timezone ? user.timezone.replace(/_/g, ' ') : 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            {/* Address Information - always visible */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <h3 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1F3A5F] dark:text-[#2FBF71]" />
                Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="sm:col-span-2 lg:col-span-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-muted-foreground mb-1">Street Address</p>
                  <p className={`font-medium text-sm ${user.address ? 'text-slate-700 dark:text-slate-200' : 'text-muted-foreground italic'}`} data-testid="display-address">{user.address || 'Not set'}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-muted-foreground mb-1">City</p>
                  <p className={`font-medium text-sm ${user.city ? 'text-slate-700 dark:text-slate-200' : 'text-muted-foreground italic'}`} data-testid="display-city">{user.city || 'Not set'}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-muted-foreground mb-1">State/Province</p>
                  <p className={`font-medium text-sm ${user.state ? 'text-slate-700 dark:text-slate-200' : 'text-muted-foreground italic'}`} data-testid="display-state">{user.state || 'Not set'}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-muted-foreground mb-1">Zip/Postal Code</p>
                  <p className={`font-medium text-sm ${user.zipCode ? 'text-slate-700 dark:text-slate-200' : 'text-muted-foreground italic'}`} data-testid="display-zip">{user.zipCode || 'Not set'}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-muted-foreground mb-1">Country</p>
                  <p className={`font-medium text-sm ${user.country ? 'text-slate-700 dark:text-slate-200' : 'text-muted-foreground italic'}`} data-testid="display-country">{user.country || 'Not set'}</p>
                </div>
              </div>
            </div>

            {/* Bio - always visible */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <h3 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#1F3A5F] dark:text-[#2FBF71]" />
                About Me
              </h3>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <p className={`text-sm leading-relaxed ${user.bio ? 'text-slate-700 dark:text-slate-200' : 'text-muted-foreground italic'}`} data-testid="display-bio">{user.bio || 'No bio added yet. Click "Edit Profile" to add one.'}</p>
              </div>
            </div>

            {/* Education & Certifications - teacher only */}
            {user.role === 'teacher' && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <h3 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#1F3A5F] dark:text-[#2FBF71]" />
                  Education & Certifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap className="w-3.5 h-3.5 text-[#1F3A5F] dark:text-[#2FBF71]" />
                      <p className="text-xs text-muted-foreground">Education</p>
                    </div>
                    <p className={`text-sm leading-relaxed whitespace-pre-line ${user.education ? 'text-slate-700 dark:text-slate-200' : 'text-muted-foreground italic'}`} data-testid="display-education">{user.education || 'Not set'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-3.5 h-3.5 text-[#1F3A5F] dark:text-[#2FBF71]" />
                      <p className="text-xs text-muted-foreground">Certifications</p>
                    </div>
                    <p className={`text-sm leading-relaxed whitespace-pre-line ${user.certifications ? 'text-slate-700 dark:text-slate-200' : 'text-muted-foreground italic'}`} data-testid="display-certifications">{user.certifications || 'Not set'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* My Documents - Read-only view of user documents */}
      <MyDocumentsCard userId={user.id} />

      {/* Student History - Only for students */}
      {user.role === 'student' && (
        <StudentHistoryCard studentId={user.id} />
      )}

      {/* Profile Settings - Only shown when Edit is clicked */}
      <Collapsible open={showSettings} onOpenChange={setShowSettings}>
        <CollapsibleContent className="overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900/80 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50">
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2FBF71] to-[#25a060] rounded-xl flex items-center justify-center shadow-md">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20 flex-wrap w-full sm:w-auto">
                    <TabsTrigger 
                      value="profile" 
                      className="flex-1 sm:flex-none data-[state=active]:bg-[#1F3A5F] data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
                      data-testid="tab-profile-info"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">Profile Information</span>
                      <span className="sm:hidden">Profile</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="security" 
                      className="flex-1 sm:flex-none data-[state=active]:bg-[#1F3A5F] data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
                      data-testid="tab-security"
                    >
                      <Edit className="w-4 h-4" />
                      Security
                    </TabsTrigger>
                    <TabsTrigger 
                      value="preferences" 
                      className="flex-1 sm:flex-none data-[state=active]:bg-[#1F3A5F] data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
                      data-testid="tab-preferences"
                    >
                      <Globe className="w-4 h-4" />
                      Preferences
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="profile" className="mt-6">
                    <ProfileForm user={user} onSuccess={() => {}} />
                  </TabsContent>
                  
                  <TabsContent value="security" className="mt-6">
                    <PasswordForm userId={user.id} onSuccess={() => {}} />
                  </TabsContent>
                  
                  <TabsContent value="preferences" className="mt-6">
                    <PreferencesForm user={user} onSuccess={() => {}} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
      </div>
    </div>
  );
}