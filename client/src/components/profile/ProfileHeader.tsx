import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Edit, Mail, Phone, User, Calendar, Sparkles, Globe, MapPin, MessageCircle, GraduationCap, Award, ImagePlus } from "lucide-react";
import { motion } from "framer-motion";
import ImageUpload from "./ImageUpload";
import { queryClient } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

export default function ProfileHeader({
    user,
    avatarUrl,
    setAvatarUrl,
    coverPhotoUrl,
    setCoverPhotoUrl,
    showSettings,
    onToggleSettings
}: {
    user: UserType;
    avatarUrl: string;
    setAvatarUrl: (url: string) => void;
    coverPhotoUrl: string;
    setCoverPhotoUrl: (url: string) => void;
    showSettings: boolean;
    onToggleSettings: () => void;
}) {
    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'destructive';
            case 'teacher': return 'default';
            case 'parent': return 'outline';
            case 'student': return 'secondary';
            default: return 'default';
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-[#1F3A5F]/10 via-[#1F3A5F]/5 to-[#2a4a75]/5 relative overflow-hidden border-b border-[#1F3A5F]/10 rounded-t-3xl">
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 rounded-lg bg-[#1F3A5F]/10 text-[#1F3A5F]"><User className="w-5 h-5" /></div>
                                <h1 className="text-2xl font-bold text-[#1F3A5F]">Profile</h1>
                            </div>
                            <p className="text-[#1F3A5F]/60">Manage your account settings and preferences</p>
                        </div>
                        <Badge variant={getRoleColor(user.role)} className="px-4 py-2 text-sm font-semibold shadow-lg">
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                    </div>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden border-0 shadow-lg bg-white relative">
                    <div className="h-48 w-full bg-slate-100 relative group">
                        {coverPhotoUrl ? (
                            <img src={coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1F3A5F]/5 to-[#2FBF71]/5">
                                <ImagePlus className="w-10 h-10 text-slate-300" />
                            </div>
                        )}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="absolute bottom-4 right-4 bg-white/90 shadow-md">
                                    <Camera className="w-4 h-4 mr-2" /> Change Cover
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Change Cover Photo</DialogTitle></DialogHeader>
                                <ImageUpload currentImage={coverPhotoUrl} userId={user.id} uploadType="cover" onSuccess={(newUrl) => {
                                    setCoverPhotoUrl(newUrl);
                                    queryClient.setQueryData(["/api/auth/user"], (oldUser: any) => oldUser ? { ...oldUser, coverPhotoUrl: newUrl } : oldUser);
                                }} />
                            </DialogContent>
                        </Dialog>
                    </div>

                    <CardContent className="pt-0 px-6 pb-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-10 sm:-mt-12 mb-6">
                            <div className="relative group">
                                <Avatar className="w-28 h-28 border-4 border-white shadow-xl">
                                    <AvatarImage src={avatarUrl || undefined} />
                                    <AvatarFallback className="text-2xl bg-[#1F3A5F] text-white">
                                        {user.name?.[0] || user.email?.[0] || '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="absolute bottom-1 right-1 p-2 bg-[#2FBF71] text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                                            <Camera className="w-4 h-4" />
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Change Profile Picture</DialogTitle></DialogHeader>
                                        <ImageUpload currentImage={avatarUrl} userId={user.id} uploadType="avatar" onSuccess={(newUrl) => {
                                            setAvatarUrl(newUrl);
                                            queryClient.setQueryData(["/api/auth/user"], (oldUser: any) =>
                                                oldUser ? { ...oldUser, avatarUrl: newUrl, profileImageUrl: newUrl } : oldUser
                                            );
                                        }} />
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h2 className="text-2xl font-bold text-[#1F3A5F]">{user.name || 'Not set'}</h2>
                                <p className="text-slate-500">{user.email}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={onToggleSettings} className="border-[#2FBF71]/30 text-[#2FBF71]">
                                    <Edit className="w-4 h-4 mr-2" /> {showSettings ? "Hide Settings" : "Edit Profile"}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <Mail className="w-4 h-4 text-[#1F3A5F]" />
                                <div><p className="text-xs text-slate-500">Email</p><p className="font-medium text-sm">{user.email || 'Not set'}</p></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <Phone className="w-4 h-4 text-[#2FBF71]" />
                                <div><p className="text-xs text-slate-500">Phone</p><p className="font-medium text-sm">{user.phone || 'Not set'}</p></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
                            {[
                                { label: 'Gender', val: user.gender, icon: User },
                                { label: 'Birthday', val: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not set', icon: Calendar },
                                { label: 'Member Since', val: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown', icon: Sparkles },
                                { label: 'Timezone', val: user.timezone?.replace(/_/g, ' ') || 'Not set', icon: Globe }
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-2 text-slate-500"><item.icon className="w-3.5 h-3.5" /><span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span></div>
                                    <p className="text-sm font-semibold text-slate-700 capitalize">{item.val}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 bg-slate-50 rounded-2xl">
                            <h3 className="text-sm font-bold text-[#1F3A5F] mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Address</h3>
                            <p className="text-sm text-slate-600">
                                {user.address ? `${user.address}, ${user.city || ''}, ${user.state || ''} ${user.zipCode || ''}, ${user.country || ''}` : 'No address provided'}
                            </p>
                        </div>

                        <div className="mt-6 p-4 bg-slate-50 rounded-2xl">
                            <h3 className="text-sm font-bold text-[#1F3A5F] mb-2 flex items-center gap-2"><MessageCircle className="w-4 h-4" /> About Me</h3>
                            <p className="text-sm text-slate-600 leading-relaxed italic">{user.bio || 'Tell us something about yourself...'}</p>
                        </div>

                        {user.role === 'teacher' && (
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <h3 className="text-sm font-bold text-[#1F3A5F] mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Education</h3>
                                    <p className="text-sm text-slate-600">{user.education || 'Not set'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <h3 className="text-sm font-bold text-[#1F3A5F] mb-2 flex items-center gap-2"><Award className="w-4 h-4" /> Certifications</h3>
                                    <p className="text-sm text-slate-600">{user.certifications || 'Not set'}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
