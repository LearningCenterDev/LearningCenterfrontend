import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Upload, Link as LinkIcon, FileText, Image, Film, Download, Trash2, ExternalLink, List, Grid3x3, Table2, Users, UserCheck, Paperclip } from "lucide-react";
import type { CourseResource } from "@shared/schema";
import type { User } from "@shared/schema";

interface CourseResourcesProps {
  courseId: string;
  currentUser: User;
  canManage: boolean;
  teacherId?: string;
}

interface EnrolledStudent {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export function CourseResources({ courseId, currentUser, canManage, teacherId }: CourseResourcesProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [resourceType, setResourceType] = useState<"file" | "link">("file");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [resourceViewMode, setResourceViewMode] = useState<'list' | 'grid' | 'table'>('list');
  const [isSharedResource, setIsSharedResource] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    const savedMode = localStorage.getItem(`course-resources-view-${courseId}`);
    if (savedMode === 'grid' || savedMode === 'table') {
      setResourceViewMode(savedMode);
    }
  }, [courseId]);

  const handleResourceViewModeChange = (mode: 'list' | 'grid' | 'table') => {
    setResourceViewMode(mode);
    localStorage.setItem(`course-resources-view-${courseId}`, mode);
  };

  // Fetch resources
  const { data: resources = [], isLoading } = useQuery<CourseResource[]>({
    queryKey: ["/api/courses", courseId, "resources"],
  });

  // Fetch students assigned to this teacher for this course (only when teacherId is provided)
  const { data: assignedStudents = [] } = useQuery<EnrolledStudent[]>({
    queryKey: [`/api/courses/${courseId}/assigned-students/${teacherId}`],
    enabled: isAddDialogOpen && !!teacherId && canManage,
  });

  // Add resource mutation
  const addResourceMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("type", resourceType);
      formData.append("isShared", isSharedResource.toString());
      
      if (!isSharedResource && selectedStudentIds.length > 0) {
        formData.append("studentIds", JSON.stringify(selectedStudentIds));
      }
      
      if (resourceType === "file" && file) {
        formData.append("file", file);
      } else if (resourceType === "link") {
        formData.append("resourceUrl", resourceUrl);
      }

      const response = await fetch(`/api/courses/${courseId}/resources`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add resource");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "resources"] });
      const successMessage = isSharedResource 
        ? "Resource added and shared with all students" 
        : `Resource added and assigned to ${selectedStudentIds.length} student(s)`;
      toast({
        title: "Success",
        description: successMessage,
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add resource",
        variant: "destructive",
      });
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete resource");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "resources"] });
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete resource",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setResourceUrl("");
    setFile(null);
    setResourceType("file");
    setIsSharedResource(true);
    setSelectedStudentIds([]);
  };

  const handleStudentToggle = (studentId: string, checked: boolean) => {
    setSelectedStudentIds(prev => 
      checked 
        ? [...prev, studentId]
        : prev.filter(id => id !== studentId)
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === assignedStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(assignedStudents.map(s => s.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (resourceType === "file") {
      if (!file) {
        toast({
          title: "Error",
          description: "Please select a file to upload",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: "File size exceeds 10MB limit",
          variant: "destructive",
        });
        return;
      }
    }

    if (resourceType === "link" && !resourceUrl) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    // Validate student selection when individual mode is chosen
    if (!isSharedResource && selectedStudentIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student to assign this resource to",
        variant: "destructive",
      });
      return;
    }

    addResourceMutation.mutate();
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileText className="w-5 h-5" />;
    
    if (mimeType.startsWith("image/")) return <Image className="w-5 h-5" />;
    if (mimeType.startsWith("video/")) return <Film className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading resources...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Course Resources</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border rounded-lg p-1" data-testid="resource-view-mode-buttons">
              <Button
                size="sm"
                variant={resourceViewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => handleResourceViewModeChange('list')}
                data-testid="button-resource-view-list"
                className="hover-elevate"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={resourceViewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => handleResourceViewModeChange('grid')}
                data-testid="button-resource-view-grid"
                className="hover-elevate"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={resourceViewMode === 'table' ? 'default' : 'ghost'}
                onClick={() => handleResourceViewModeChange('table')}
                data-testid="button-resource-view-table"
                className="hover-elevate"
              >
                <Table2 className="w-4 h-4" />
              </Button>
            </div>
            {canManage && (
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-resource">
                <Upload className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl" data-testid="dialog-add-resource">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  Add New Resource
                </DialogTitle>
                <DialogDescription>
                  Upload a file or add a link to course materials
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <Tabs defaultValue="details">
                  <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-1 gap-1 border border-primary/20 flex-wrap w-full sm:w-auto" data-testid="resource-tabs-list">
                    <TabsTrigger 
                      value="details" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-white px-3 sm:px-4 py-2 rounded flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-sm" 
                      data-testid="tab-details"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Details</span>
                    </TabsTrigger>
                    {teacherId && canManage && (
                      <TabsTrigger 
                        value="assign" 
                        className="data-[state=active]:bg-primary data-[state=active]:text-white px-3 sm:px-4 py-2 rounded flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-sm" 
                        data-testid="tab-assign"
                      >
                        <Users className="w-4 h-4" />
                        <span>Assign</span>
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Details Tab Content */}
                  <TabsContent value="details" className="mt-4">
                    <ScrollArea className="h-[50vh]">
                      <div className="space-y-4 pr-4">
                        <div className="space-y-2">
                          <Label htmlFor="resource-type">Resource Type</Label>
                          <Select value={resourceType} onValueChange={(value: "file" | "link") => setResourceType(value)}>
                            <SelectTrigger data-testid="select-resource-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="file">File Upload</SelectItem>
                              <SelectItem value="link">External Link</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Resource title"
                            data-testid="input-resource-title"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the resource"
                            data-testid="input-resource-description"
                            rows={3}
                          />
                        </div>

                        {resourceType === "file" ? (
                          <div className="space-y-2">
                            <Label htmlFor="file">File *</Label>
                            <Input
                              id="file"
                              type="file"
                              onChange={(e) => setFile(e.target.files?.[0] || null)}
                              data-testid="input-resource-file"
                              required
                            />
                            <p className="text-sm text-muted-foreground">Maximum file size: 10MB</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="url">URL *</Label>
                            <Input
                              id="url"
                              type="url"
                              value={resourceUrl}
                              onChange={(e) => setResourceUrl(e.target.value)}
                              placeholder="https://example.com/resource"
                              data-testid="input-resource-url"
                              required
                            />
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Assign Tab Content */}
                  {teacherId && canManage && (
                    <TabsContent value="assign" className="mt-4">
                      <ScrollArea className="h-[50vh]">
                        <div className="space-y-4 pr-4">
                        <div className="space-y-2">
                          <Label className="text-base font-semibold">Assign Resource To</Label>
                          <p className="text-sm text-muted-foreground">
                            Choose whether to share this resource with all students or select specific students.
                          </p>
                        </div>
                        
                        {/* Shared vs Individual Toggle */}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={isSharedResource ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setIsSharedResource(true);
                              setSelectedStudentIds([]);
                            }}
                            data-testid="button-assign-all"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            All Students
                          </Button>
                          <Button
                            type="button"
                            variant={!isSharedResource ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsSharedResource(false)}
                            data-testid="button-assign-individual"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Select Students
                          </Button>
                        </div>

                        {isSharedResource && (
                          <div className="p-4 bg-muted/50 rounded-md">
                            <p className="text-sm text-muted-foreground">
                              This resource will be visible to all enrolled students in this course.
                            </p>
                          </div>
                        )}

                        {/* Individual Student Selection */}
                        {!isSharedResource && (
                          <div className="space-y-3">
                            {assignedStudents.length > 0 ? (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    Select students to receive this resource
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSelectAllStudents}
                                    data-testid="button-select-all-students"
                                  >
                                    {selectedStudentIds.length === assignedStudents.length ? "Deselect All" : "Select All"}
                                  </Button>
                                </div>
                                
                                <ScrollArea className="h-48 border rounded-md p-3">
                                  <div className="space-y-2">
                                    {assignedStudents.map((student) => (
                                      <div
                                        key={student.id}
                                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                                      >
                                        <Checkbox
                                          id={`student-${student.id}`}
                                          checked={selectedStudentIds.includes(student.id)}
                                          onCheckedChange={(checked) => handleStudentToggle(student.id, checked as boolean)}
                                          data-testid={`checkbox-student-${student.id}`}
                                        />
                                        <Avatar className="w-8 h-8">
                                          <AvatarImage src={student.avatarUrl || undefined} />
                                          <AvatarFallback className="text-xs">
                                            {student.firstName?.[0] || student.email?.[0] || "?"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <Label
                                          htmlFor={`student-${student.id}`}
                                          className="flex-1 cursor-pointer text-sm"
                                        >
                                          {student.firstName && student.lastName
                                            ? `${student.firstName} ${student.lastName}`
                                            : student.email || "Unknown Student"}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>

                                {selectedStudentIds.length > 0 && (
                                  <Badge variant="secondary" data-testid="selected-students-count">
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    {selectedStudentIds.length} student(s) selected
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <div className="p-4 bg-muted/50 rounded-md">
                                <p className="text-sm text-muted-foreground">
                                  No students assigned to you for this course yet.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  )}
                </Tabs>

                <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel-add">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addResourceMutation.isPending} data-testid="button-submit-resource">
                    {addResourceMutation.isPending ? "Adding..." : "Add Resource"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <p className="text-muted-foreground text-center py-8" data-testid="no-resources-message">
              No resources available yet
            </p>
          ) : (
            <>
              {resourceViewMode === 'list' && (
                <div className="space-y-3">
                  {resources.map((resource) => (
                    <div 
                      key={resource.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate cursor-pointer" 
                      data-testid={`resource-item-${resource.id}`}
                      onClick={() => window.open(resource.resourceUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {resource.type === "file" ? getFileIcon(resource.mimeType) : <LinkIcon className="w-5 h-5" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium" data-testid={`resource-title-${resource.id}`}>{resource.title}</p>
                            {resource.isShared === false && (
                              <Badge variant="outline" className="text-xs">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Individual
                              </Badge>
                            )}
                          </div>
                          {resource.description && <p className="text-sm text-muted-foreground line-clamp-1">{resource.description}</p>}
                          {resource.fileSize && <p className="text-xs text-muted-foreground" data-testid={`resource-size-${resource.id}`}>{formatFileSize(resource.fileSize)}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {resource.type === "file" ? (
                          <Button variant="ghost" size="sm" asChild data-testid={`button-download-${resource.id}`}>
                            <a href={resource.resourceUrl} download={resource.fileName || undefined}>
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" asChild data-testid={`button-open-link-${resource.id}`}>
                            <a href={resource.resourceUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {canManage && (
                          <Button variant="ghost" size="sm" onClick={() => deleteResourceMutation.mutate(resource.id)} disabled={deleteResourceMutation.isPending} data-testid={`button-delete-${resource.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {resourceViewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map((resource) => (
                    <div 
                      key={resource.id} 
                      className="border rounded-lg p-4 hover-elevate cursor-pointer" 
                      data-testid={`resource-grid-${resource.id}`}
                      onClick={() => window.open(resource.resourceUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {resource.type === "file" ? getFileIcon(resource.mimeType) : <LinkIcon className="w-5 h-5 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm line-clamp-2" data-testid={`resource-title-${resource.id}`}>{resource.title}</h4>
                          {resource.isShared === false && (
                            <Badge variant="outline" className="text-xs mt-1">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Individual
                            </Badge>
                          )}
                        </div>
                      </div>
                      {resource.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{resource.description}</p>}
                      {resource.fileSize && <p className="text-xs text-muted-foreground mb-3" data-testid={`resource-size-${resource.id}`}>{formatFileSize(resource.fileSize)}</p>}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {resource.type === "file" ? (
                          <Button variant="ghost" size="sm" asChild data-testid={`button-download-${resource.id}`}>
                            <a href={resource.resourceUrl} download={resource.fileName || undefined}>
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" asChild data-testid={`button-open-link-${resource.id}`}>
                            <a href={resource.resourceUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {canManage && (
                          <Button variant="ghost" size="sm" onClick={() => deleteResourceMutation.mutate(resource.id)} disabled={deleteResourceMutation.isPending} data-testid={`button-delete-${resource.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {resourceViewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Resource</th>
                        <th className="text-left p-3 font-semibold">Description</th>
                        <th className="text-left p-3 font-semibold">Size</th>
                        <th className="text-left p-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map((resource) => (
                        <tr 
                          key={resource.id} 
                          className="border-b hover-elevate cursor-pointer" 
                          data-testid={`resource-table-row-${resource.id}`}
                          onClick={() => window.open(resource.resourceUrl, '_blank', 'noopener,noreferrer')}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {resource.type === "file" ? getFileIcon(resource.mimeType) : <LinkIcon className="w-4 h-4" />}
                              <span data-testid={`resource-title-${resource.id}`}>{resource.title}</span>
                              {resource.isShared === false && (
                                <Badge variant="outline" className="text-xs">Individual</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs line-clamp-1">{resource.description || '-'}</td>
                          <td className="p-3 text-muted-foreground text-xs" data-testid={`resource-size-${resource.id}`}>{resource.fileSize ? formatFileSize(resource.fileSize) : '-'}</td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {resource.type === "file" ? (
                                <Button variant="ghost" size="sm" asChild data-testid={`button-download-${resource.id}`}>
                                  <a href={resource.resourceUrl} download={resource.fileName || undefined}>
                                    <Download className="w-4 h-4" />
                                  </a>
                                </Button>
                              ) : (
                                <Button variant="ghost" size="sm" asChild data-testid={`button-open-link-${resource.id}`}>
                                  <a href={resource.resourceUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                              {canManage && (
                                <Button variant="ghost" size="sm" onClick={() => deleteResourceMutation.mutate(resource.id)} disabled={deleteResourceMutation.isPending} data-testid={`button-delete-${resource.id}`}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
