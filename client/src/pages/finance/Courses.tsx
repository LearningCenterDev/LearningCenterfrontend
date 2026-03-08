import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Search, Eye, Calendar, GraduationCap, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Course, User } from "@shared/schema";
import { ViewModeToggle, type ViewMode } from "@/components/ViewModeToggle";

interface FinanceCoursesProps {
  financeAdminId: string;
}

interface CourseWithDetails extends Course {
  teacher?: User;
  enrollmentCount?: number;
}

export default function FinanceCourses({ financeAdminId }: FinanceCoursesProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(null);

  const { data: courses = [], isLoading } = useQuery<CourseWithDetails[]>({
    queryKey: ["/api/admin/courses"],
  });

  const subjects = [...new Set(courses.map(c => c.subject))].filter(Boolean);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchQuery === "" || 
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && course.isActive) ||
      (statusFilter === "inactive" && !course.isActive);
    const matchesSubject = subjectFilter === "all" || course.subject === subjectFilter;
    return matchesSearch && matchesStatus && matchesSubject;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-secondary" />
            Course Directory
          </h1>
          <p className="text-muted-foreground mt-1">Read-only view of all platform courses</p>
        </div>
        <Badge variant="secondary" className="bg-[#000000] text-xs px-2 py-1">
          <Eye className="w-3 h-3 mr-1" />
          View Only
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle>All Courses ({filteredCourses.length})</CardTitle>
          <ViewModeToggle currentMode={viewMode} onModeChange={setViewMode} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search courses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-courses"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-subject-filter">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : viewMode === "table" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow 
                    key={course.id} 
                    data-testid={`course-row-${course.id}`}
                    className="cursor-pointer hover-elevate"
                    onClick={() => setSelectedCourse(course)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{course.title}</div>
                        {course.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">{course.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{course.subject}</Badge>
                    </TableCell>
                    <TableCell>{course.grade}</TableCell>
                    <TableCell>
                      {course.duration || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={course.isActive ? 'default' : 'secondary'}>
                        {course.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCourses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                      <p className="text-muted-foreground">No courses found matching your criteria</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {filteredCourses.map((course) => (
                <div 
                  key={course.id} 
                  className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30 cursor-pointer hover-elevate" 
                  data-testid={`course-list-${course.id}`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{course.title}</div>
                    {course.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">{course.description}</div>
                    )}
                  </div>
                  <Badge variant="outline">{course.subject}</Badge>
                  <Badge variant="secondary">Grade {course.grade}</Badge>
                  {course.duration && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {course.duration}
                    </div>
                  )}
                  <Badge variant={course.isActive ? 'default' : 'secondary'}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
              {filteredCourses.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">No courses found matching your criteria</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <Card 
                  key={course.id} 
                  className="bg-muted/30 cursor-pointer hover-elevate" 
                  data-testid={`course-card-${course.id}`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="font-medium line-clamp-2">{course.title}</h4>
                      <Badge variant={course.isActive ? 'default' : 'secondary'} className="shrink-0">
                        {course.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline">{course.subject}</Badge>
                      <Badge variant="secondary">Grade {course.grade}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {course.duration && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {course.duration}
                        </div>
                      )}
                      {course.startDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          Starts: {new Date(course.startDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredCourses.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">No courses found matching your criteria</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedCourse} onOpenChange={(open) => !open && setSelectedCourse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="course-details-modal">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-xl font-bold" data-testid="modal-course-title">
                {selectedCourse?.title}
              </DialogTitle>
              <Badge variant={selectedCourse?.isActive ? 'default' : 'secondary'} className="shrink-0">
                {selectedCourse?.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </DialogHeader>
          
          {selectedCourse && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {selectedCourse.subject}
                </Badge>
                <Badge variant="secondary">Grade {selectedCourse.grade}</Badge>
                {selectedCourse.duration && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedCourse.duration}
                  </Badge>
                )}
              </div>

              {selectedCourse.description && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedCourse.description}</p>
                </div>
              )}

              {selectedCourse.startDate && (
                <div>
                  <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Start Date
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedCourse.startDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {selectedCourse.learningObjectives && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Learning Objectives</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedCourse.learningObjectives}</p>
                </div>
              )}

              {selectedCourse.prerequisites && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Prerequisites</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedCourse.prerequisites}</p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedCourse(null)}
                  data-testid="button-close-modal"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
