import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, ImagePlus, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ImageUpload({
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
            if (!file.type.startsWith('image/')) {
                toast({
                    title: "Invalid file type",
                    description: "Please select an image file (JPG, PNG, GIF, etc.)",
                    variant: "destructive",
                });
                return;
            }
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
            const fileExtension = selectedFile.name.split('.').pop() || 'jpg';
            const urlResponse = await fetch('/api/upload/profile-image/url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, uploadType, fileExtension }),
            });
            if (!urlResponse.ok) throw new Error('Failed to get upload URL');
            const { uploadUrl, fileName } = await urlResponse.json();

            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: selectedFile,
                headers: { 'Content-Type': selectedFile.type },
            });
            if (!uploadResponse.ok) throw new Error('Failed to upload file');

            const completeResponse = await fetch('/api/upload/profile-image/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, uploadType, fileName }),
            });
            if (!completeResponse.ok) throw new Error('Failed to complete upload');

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
                <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id={`${uploadType}-upload`} />
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
                            <Button size="sm" onClick={handleUpload} disabled={isUploading} className="flex-1 bg-[#2FBF71] hover:bg-[#25a060]">
                                {isUploading ? "Uploading..." : "Upload Image"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setSelectedFile(null)} className="border-slate-200">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
