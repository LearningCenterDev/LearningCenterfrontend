import { useState, useEffect } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Upload, X, Loader2, Users, FileText, Layers } from "lucide-react";
import type { User, Course, Subject } from "@shared/schema";

interface CourseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
}

const getInitialFormData = (course: Course | null) => {
  if (!course) {
    return {
      title: "",
      description: "",
      subject: "",
      grade: "",
      teacherId: "",
      startDate: "",
      duration: "",
      isActive: true,
      philosophy: "",
      prerequisites: "",
      learningObjectives: "",
      curriculum: [{ heading: "", description: "" }],
      practicalSessions: "",
      coverImageUrl: "",
    };
  }
  return {
    title: course.title,
    description: course.description || "",
    subject: course.subject,
    grade: course.grade.toString(),
    teacherId: course.teacherId || "",
    startDate: course.startDate || "",
    duration: course.duration || "",
    isActive: course.isActive || false,
    philosophy: course.philosophy || "",
    prerequisites: course.prerequisites || "",
    learningObjectives: course.learningObjectives || "",
    curriculum: (course.curriculum && Array.isArray(course.curriculum) && course.curriculum.length > 0) ? course.curriculum : [{ heading: "", description: "" }],
    practicalSessions: course.practicalSessions || "",
    coverImageUrl: course.coverImageUrl || "",
  };
};

export function CourseEditModal({ isOpen, onClose, course }: CourseEditModalProps) {
  const [formData, setFormData] = useState(() => getInitialFormData(course));

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [existingCoverImage, setExistingCoverImage] = useState<string>(() => course?.coverImageUrl || "");
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all teachers for assignment dropdown
  const { data: teachers = [] } = useQuery<User[]>({
    queryKey: ["/api/users", { role: "teacher" }],
    queryFn: async () => {
      const response = await fetch("/api/users?role=teacher");
      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }
      return response.json();
    },
    enabled: isOpen,
  });

  // Get all subjects from database
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    enabled: isOpen,
  });

  // Update form data when modal opens or course changes
  useEffect(() => {
    if (isOpen && course) {
      setIsLoading(true);
      // Simulate data preload with a short delay to ensure state updates
      const timer = setTimeout(() => {
        setFormData(getInitialFormData(course));
        setExistingCoverImage(course.coverImageUrl || "");
        setCoverImageFile(null);
        setCoverImagePreview("");
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, course]);

  const uploadCoverImage = async (): Promise<boolean> => {
    if (!coverImageFile) {
      return true; // No image to upload is fine
    }

    try {
      // Get presigned upload URL
      const fileExtension = coverImageFile.name.split('.').pop() || 'jpg';
      const urlResponse = await fetch("/api/upload/course-cover/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileExtension }),
      });

      if (!urlResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, fileName, publicUrl } = await urlResponse.json();

      // Upload file to presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": coverImageFile.type },
        body: coverImageFile,
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
      setFormData(prev => ({ ...prev, coverImageUrl: imageUrl }));
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload cover image",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateCourseMutation = useMutation({
    mutationFn: async (courseData: Partial<Course>) => {
      if (!course?.id) throw new Error("No course ID provided");
      
      const response = await apiRequest("PUT", `/api/courses/${course.id}`, courseData);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${course?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      
      // Dynamically update the old teacher's dashboard
      if (course?.teacherId) {
        queryClient.invalidateQueries({ queryKey: ["/api/teachers", course.teacherId, "courses"] });
      }
      
      // Dynamically update the new teacher's dashboard if teacher changed
      if (variables.teacherId && variables.teacherId !== course?.teacherId) {
        queryClient.invalidateQueries({ queryKey: ["/api/teachers", variables.teacherId, "courses"] });
      }
      
      toast({
        title: "Success",
        description: "Course updated successfully!",
      });
      
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update course",
      });
    },
  });

  const handleClose = () => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description || "",
        subject: course.subject,
        grade: course.grade.toString(),
        teacherId: course.teacherId || "",
        startDate: course.startDate || "",
        duration: course.duration || "",
        isActive: course.isActive || false,
        philosophy: course.philosophy || "",
        prerequisites: course.prerequisites || "",
        learningObjectives: course.learningObjectives || "",
        curriculum: (course.curriculum && Array.isArray(course.curriculum) && course.curriculum.length > 0) ? course.curriculum : [{ heading: "", description: "" }],
        practicalSessions: course.practicalSessions || "",
        coverImageUrl: course.coverImageUrl || "",
      });
      setExistingCoverImage(course.coverImageUrl || "");
      setCoverImageFile(null);
      setCoverImagePreview("");
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.subject || !formData.grade) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Upload cover image if selected
    if (coverImageFile) {
      const uploadSuccess = await uploadCoverImage();
      if (!uploadSuccess) {
        return;
      }
    }

    // Filter out empty curriculum entries
    const filteredCurriculum = formData.curriculum.filter(item => item.heading.trim() || item.description.trim());

    // Prepare data, converting empty strings to undefined for optional fields
    const courseData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      subject: formData.subject.trim(),
      grade: formData.grade,
      teacherId: formData.teacherId || undefined,
      startDate: formData.startDate || undefined,
      duration: formData.duration.trim() || undefined,
      isActive: formData.isActive,
      philosophy: formData.philosophy.trim() || undefined,
      prerequisites: formData.prerequisites.trim() || undefined,
      learningObjectives: formData.learningObjectives.trim() || undefined,
      curriculum: filteredCurriculum,
      practicalSessions: formData.practicalSessions.trim() || undefined,
      coverImageUrl: formData.coverImageUrl || undefined,
    };

    updateCourseMutation.mutate(courseData);
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} key={`${isOpen}-${course?.id}`}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="course-edit-modal">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            Update the course information. Changes will be applied immediately.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-edit-modal" />
              <p className="text-sm text-muted-foreground">Loading course data...</p>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full" key={`tabs-${course?.id}`}>
            <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20 flex-wrap w-full" data-testid="course-edit-tabs-list">
              <TabsTrigger 
                value="basic" 
                data-testid="tab-basic-setup"
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Basic Setup
              </TabsTrigger>
              <TabsTrigger 
                value="details" 
                data-testid="tab-course-details"
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Course Details
              </TabsTrigger>
              <TabsTrigger 
                value="curriculum" 
                data-testid="tab-curriculum"
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                Curriculum
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-4">
              <ScrollArea className="h-[50vh]">
                <div className="space-y-4 pr-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Course Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Introduction to Mathematics"
                        data-testid="input-course-title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => setFormData({ ...formData, subject: value })}
                        required
                      >
                        <SelectTrigger data-testid="select-course-subject">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject: Subject) => (
                            <SelectItem key={subject.id} value={subject.name}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade Level</Label>
                      <Input
                        id="grade"
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        placeholder="e.g., 9, 10, 11, 12"
                        data-testid="input-course-grade"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacher">Assign Teacher (Optional)</Label>
                      <Select
                        value={formData.teacherId}
                        onValueChange={(value) => setFormData({ ...formData, teacherId: value })}
                      >
                        <SelectTrigger data-testid="select-teacher">
                          <SelectValue placeholder="No teacher assigned" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher: User) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name || `${teacher.firstName} ${teacher.lastName}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        data-testid="input-course-start-date"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g., 12 weeks, 3 months"
                        data-testid="input-course-duration"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Course Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Provide a brief description of the course content, objectives, and what students will learn..."
                      rows={4}
                      data-testid="textarea-course-description"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="isActive" className="text-base font-medium">
                        Course Status
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Active courses are visible to students for browsing and enrollment
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      data-testid="switch-course-active"
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <ScrollArea className="h-[50vh]">
                <div className="space-y-4 pr-4">
                  <div className="space-y-2">
                    <Label htmlFor="philosophy">Course Philosophy</Label>
                    <Textarea
                      id="philosophy"
                      placeholder="Enter the course philosophy and teaching approach..."
                      value={formData.philosophy}
                      onChange={(e) => setFormData(prev => ({ ...prev, philosophy: e.target.value }))}
                      data-testid="input-philosophy"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prerequisites">Prerequisites</Label>
                    <Textarea
                      id="prerequisites"
                      placeholder="Enter any prerequisites or required knowledge..."
                      value={formData.prerequisites}
                      onChange={(e) => setFormData(prev => ({ ...prev, prerequisites: e.target.value }))}
                      data-testid="input-prerequisites"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="learningObjectives">Learning Objectives</Label>
                    <Textarea
                      id="learningObjectives"
                      placeholder="Enter the learning objectives and goals..."
                      value={formData.learningObjectives}
                      onChange={(e) => setFormData(prev => ({ ...prev, learningObjectives: e.target.value }))}
                      data-testid="input-learning-objectives"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="practicalSessions">Practical Sessions</Label>
                    <Textarea
                      id="practicalSessions"
                      placeholder="Enter information about practical sessions and hands-on activities..."
                      value={formData.practicalSessions}
                      onChange={(e) => setFormData(prev => ({ ...prev, practicalSessions: e.target.value }))}
                      data-testid="input-practical-sessions"
                      rows={3}
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="curriculum" className="mt-4">
              <ScrollArea className="h-[50vh]">
                <div className="space-y-4 pr-4">
                  <div className="space-y-3">
                    {formData.curriculum.map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-sm">Section {index + 1}</h3>
                          {formData.curriculum.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  curriculum: prev.curriculum.filter((_, i) => i !== index)
                                }));
                              }}
                              data-testid={`button-remove-curriculum-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`curriculum-heading-${index}`} className="text-sm">Heading</Label>
                          <Input
                            id={`curriculum-heading-${index}`}
                            placeholder="e.g., Introduction to Algebra"
                            value={item.heading}
                            onChange={(e) => {
                              setFormData(prev => {
                                const newCurriculum = [...prev.curriculum];
                                newCurriculum[index].heading = e.target.value;
                                return { ...prev, curriculum: newCurriculum };
                              });
                            }}
                            data-testid={`input-curriculum-heading-${index}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`curriculum-description-${index}`} className="text-sm">Description</Label>
                          <Textarea
                            id={`curriculum-description-${index}`}
                            placeholder="Enter section description..."
                            value={item.description}
                            onChange={(e) => {
                              setFormData(prev => {
                                const newCurriculum = [...prev.curriculum];
                                newCurriculum[index].description = e.target.value;
                                return { ...prev, curriculum: newCurriculum };
                              });
                            }}
                            data-testid={`input-curriculum-description-${index}`}
                            rows={3}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        curriculum: [...prev.curriculum, { heading: "", description: "" }]
                      }));
                    }}
                    className="w-full"
                    data-testid="button-add-curriculum"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={updateCourseMutation.isPending}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateCourseMutation.isPending}
              data-testid="button-save-course"
            >
              {updateCourseMutation.isPending ? "Updating..." : "Update Course"}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
