import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, Enrollment, StudentTeacherAssignment } from "@shared/schema";
import { Users, UserCheck } from "lucide-react";

interface TeacherAssignmentModalProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface StudentAssignment {
  studentId: string;
  selectedTeacherId: string;
}

export function TeacherAssignmentModal({ courseId, isOpen, onClose }: TeacherAssignmentModalProps) {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/courses", courseId, "enrollments"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/courses/${courseId}/enrollments`);
      return response.json();
    },
    enabled: isOpen && !!courseId,
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<User[]>({
    queryKey: ["/api/users", "students"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      const users: User[] = await response.json();
      return users.filter(u => u.role === "student");
    },
    enabled: isOpen,
  });

  const { data: teachers = [], isLoading: teachersLoading } = useQuery<User[]>({
    queryKey: ["/api/users", "teachers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      const users: User[] = await response.json();
      return users.filter(u => u.role === "teacher");
    },
    enabled: isOpen,
  });

  const { data: existingAssignments = [], isLoading: assignmentsLoading } = useQuery<StudentTeacherAssignment[]>({
    queryKey: ["/api/student-teacher-assignments/course", courseId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/student-teacher-assignments/course/${courseId}`);
      return response.json();
    },
    enabled: isOpen && !!courseId,
  });

  useEffect(() => {
    if (existingAssignments.length > 0) {
      const assignmentMap: Record<string, string> = {};
      existingAssignments.forEach((assignment) => {
        assignmentMap[assignment.studentId] = assignment.teacherId;
      });
      setAssignments(assignmentMap);
    }
  }, [existingAssignments]);

  const assignTeacherMutation = useMutation({
    mutationFn: async (data: StudentAssignment) => {
      const response = await apiRequest("POST", "/api/student-teacher-assignments", {
        studentId: data.studentId,
        courseId,
        teacherId: data.selectedTeacherId,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student-teacher-assignments/course", courseId] });
      
      // Invalidate student-specific queries to dynamically update their portal
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'teachers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', variables.studentId, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/user', variables.studentId] });
      
      // Dynamically update the assigned teacher's dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/teachers', variables.selectedTeacherId, 'courses'] });
      
      // Invalidate all teacher assignment queries for this student (using predicate to catch all patterns)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          if (typeof key === 'string' && key.includes('/api/student-teacher-assignments')) {
            const hasStudentId = query.queryKey.some(part => 
              typeof part === 'object' && part !== null && 'studentId' in part && part.studentId === variables.studentId
            ) || query.queryKey.includes(variables.studentId);
            return hasStudentId;
          }
          return false;
        }
      });
      
      toast({
        title: "Success",
        description: "Teacher assignment updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign teacher",
        variant: "destructive",
      });
    },
  });

  const handleAssignTeacher = (studentId: string, teacherId: string) => {
    assignTeacherMutation.mutate({ studentId, selectedTeacherId: teacherId });
  };

  const enrolledStudents = students.filter(student =>
    enrollments.some(enrollment => enrollment.studentId === student.id)
  );

  const getStudentName = (student: User) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.name || student.email || "Unknown";
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return "Unknown";
    if (teacher.firstName && teacher.lastName) {
      return `${teacher.firstName} ${teacher.lastName}`;
    }
    return teacher.name || teacher.email || "Unknown";
  };

  const isLoading = enrollmentsLoading || studentsLoading || teachersLoading || assignmentsLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="teacher-assignment-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assign Teachers to Students
          </DialogTitle>
          <DialogDescription>
            Assign individual teachers to students enrolled in this course
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-9 w-48" />
                </div>
              ))}
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Students Enrolled</h3>
              <p className="text-muted-foreground">
                There are no students enrolled in this course yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledStudents.map((student) => {
                const currentTeacherId = assignments[student.id];
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover-elevate"
                    data-testid={`student-assignment-${student.id}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatarUrl || undefined} />
                      <AvatarFallback>
                        {getStudentName(student).split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{getStudentName(student)}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {currentTeacherId ? (
                          <Badge variant="outline" className="text-xs">
                            <UserCheck className="w-3 h-3 mr-1" />
                            {getTeacherName(currentTeacherId)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            No Teacher Assigned
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={currentTeacherId || ""}
                        onValueChange={(value) => {
                          setAssignments(prev => ({ ...prev, [student.id]: value }));
                          handleAssignTeacher(student.id, value);
                        }}
                      >
                        <SelectTrigger
                          className="w-48"
                          data-testid={`select-teacher-${student.id}`}
                        >
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => {
                            const displayName = teacher.firstName && teacher.lastName 
                              ? `${teacher.firstName} ${teacher.lastName}`
                              : teacher.name || teacher.email || "Unknown";
                            return (
                              <SelectItem
                                key={teacher.id}
                                value={teacher.id}
                                data-testid={`teacher-option-${teacher.id}-${student.id}`}
                              >
                                {displayName}
                                {currentTeacherId === teacher.id && " (Current)"}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-close-assignment-modal"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
