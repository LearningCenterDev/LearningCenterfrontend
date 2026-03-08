import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, GraduationCap, TrendingUp, MessageCircle, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { User } from "@shared/schema";

interface TeacherStudentsProps {
  teacherId: string;
}

interface StudentWithStats extends User {
  currentGrade?: number;
  attendanceRate?: number;
  assignmentsCompleted?: number;
  totalAssignments?: number;
  enrolledCourses?: number;
}

export default function TeacherStudents({ teacherId }: TeacherStudentsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  const { data: students = [], isLoading } = useQuery<StudentWithStats[]>({
    queryKey: ["/api/teacher/students", teacherId],
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchQuery === "" || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getPerformanceColor = (grade: number) => {
    if (grade >= 90) return 'default';
    if (grade >= 80) return 'secondary';
    if (grade >= 70) return 'outline';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Students</h1>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="teacher-students-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Students</h1>
          <Badge variant="secondary" data-testid="student-count">
            {students.length} {students.length === 1 ? 'Student' : 'Students'}
          </Badge>
        </div>
        <Button data-testid="button-add-student">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{students.length}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {students.length > 0 
                    ? (students.reduce((sum, s) => sum + (s.currentGrade || 0), 0) / students.length).toFixed(1)
                    : '0'
                  }%
                </div>
                <div className="text-sm text-muted-foreground">Average Grade</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {students.filter(s => (s.currentGrade || 0) >= 90).length}
                </div>
                <div className="text-sm text-muted-foreground">Honor Students</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {students.filter(s => (s.attendanceRate || 0) < 80).length}
                </div>
                <div className="text-sm text-muted-foreground">Need Attention</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-students"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCourse === "all" ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCourse("all")}
              >
                All Students
              </Button>
              <Button
                variant={selectedCourse === "struggling" ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCourse("struggling")}
              >
                Need Help
              </Button>
              <Button
                variant={selectedCourse === "honor" ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCourse("honor")}
              >
                Honor Roll
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? "No students found" : "No students enrolled"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? "Try adjusting your search criteria."
                : "Students will appear here once they're enrolled in your courses."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <Card 
              key={student.id} 
              className="hover-elevate cursor-pointer"
              data-testid={`student-${student.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={student.avatarUrl || undefined} />
                      <AvatarFallback>
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-base">{student.name}</h4>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="text-xs text-muted-foreground">
                          Enrolled: {student.enrolledCourses || 0} courses
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Attendance: {(student.attendanceRate || 0).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge 
                        variant={getPerformanceColor(student.currentGrade || 0)} 
                        className="mb-2"
                      >
                        {(student.currentGrade || 0).toFixed(1)}%
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {student.assignmentsCompleted || 0}/{student.totalAssignments || 0} assignments
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-message-${student.id}`}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`button-view-${student.id}`}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}