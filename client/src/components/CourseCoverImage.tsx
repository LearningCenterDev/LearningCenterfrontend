import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Course } from "@shared/schema";

interface CourseCoverImageProps {
  course: Course;
  courseId: string;
  isAdmin?: boolean;
}

export function CourseCoverImage({ course, courseId, isAdmin = false }: CourseCoverImageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const displayImageUrl = uploadedImageUrl || course.coverImageUrl;

  const handleCoverImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Get presigned upload URL
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const urlResponse = await fetch("/api/upload/course-cover/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileExtension }),
      });

      if (!urlResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, fileName } = await urlResponse.json();

      // Upload file to presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      // Complete the upload
      const completeResponse = await fetch("/api/upload/course-cover/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName }),
      });

      if (!completeResponse.ok) {
        throw new Error("Failed to complete upload");
      }

      const { imageUrl } = await completeResponse.json();

      // Save cover image URL to database
      const saveResponse = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImageUrl: imageUrl }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save cover image to database");
      }

      // Set the uploaded image immediately
      setUploadedImageUrl(imageUrl);

      toast({
        title: "Success",
        description: "Cover image uploaded successfully",
      });

      // Refresh the course query
      queryClient.refetchQueries({ queryKey: [`/api/courses/${courseId}`] });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload cover image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className="relative h-48 bg-gradient-to-br from-primary/40 via-primary/20 to-primary/10 overflow-hidden bg-cover bg-center group"
      style={displayImageUrl ? { backgroundImage: `url(${displayImageUrl})` } : {}}
      data-testid="cover-image"
    >
      <div className="absolute inset-0 bg-grid-white/5 pointer-events-none" />
      
      {!displayImageUrl && (
        <svg className="absolute inset-0 w-full h-full p-8 text-white/30" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" data-testid="svg-cover-placeholder">
          <rect x="10" y="10" width="180" height="140" rx="8" fill="currentColor" opacity="0.05" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.2"/>
          <circle cx="60" cy="50" r="15" fill="currentColor" opacity="0.1"/>
          <rect x="30" y="75" width="140" height="8" rx="4" fill="currentColor" opacity="0.1"/>
          <rect x="30" y="90" width="110" height="8" rx="4" fill="currentColor" opacity="0.08"/>
          <path d="M 100 120 Q 130 100 160 120" stroke="currentColor" strokeWidth="2" strokeOpacity="0.1" fill="none"/>
        </svg>
      )}

      {isAdmin && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleButtonClick}
            disabled={isUploading}
            className="bg-black/40 hover:bg-black/60 text-white"
            data-testid="button-upload-cover"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverImageSelect}
        className="hidden"
        data-testid="input-cover-image"
      />
    </div>
  );
}
