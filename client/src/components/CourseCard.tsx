import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Users, BookOpen } from "lucide-react";

interface CourseCardProps {
  title: string;
  description: string;
  instructor: string;
  enrolledStudents: number;
  duration: string;
  schedule: string;
  progress?: number;
  status: "active" | "completed" | "upcoming";
  onEnroll?: () => void;
  onView?: () => void;
  userRole?: "student" | "teacher" | "admin";
}

export function CourseCard({
  title,
  description,
  instructor,
  enrolledStudents,
  duration,
  schedule,
  progress,
  status,
  onEnroll,
  onView,
  userRole = "student"
}: CourseCardProps) {
  const statusColors = {
    active: "default",
    completed: "secondary",
    upcoming: "outline"
  } as const;

  return (
    <Card className="transition-colors hover:bg-accent/50" data-testid={`card-course-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg leading-tight">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
        <Badge variant={statusColors[status]} className="w-fit">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{enrolledStudents} students</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{schedule}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <span>Instructor: {instructor}</span>
        </div>
        
        {progress !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-3">
        <div className="flex gap-2 w-full">
          {userRole === "student" && onEnroll && status === "upcoming" && (
            <Button onClick={onEnroll} className="flex-1" data-testid="button-enroll">
              Enroll Now
            </Button>
          )}
          {onView && (
            <Button 
              variant={userRole === "student" && status === "upcoming" ? "outline" : "default"} 
              onClick={onView} 
              className="flex-1"
              data-testid="button-view-course"
            >
              {userRole === "teacher" ? "Manage" : "View Course"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default CourseCard;