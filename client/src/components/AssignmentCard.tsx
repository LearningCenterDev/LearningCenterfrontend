import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AssignmentCardProps {
  title: string;
  description: string;
  subject: string;
  dueDate?: Date;
  submittedDate?: Date;
  grade?: number;
  maxGrade?: number;
  status: "pending" | "submitted" | "graded" | "overdue";
  teacherComment?: string;
  onSubmit?: () => void;
  onView?: () => void;
  userRole?: "student" | "teacher" | "parent";
}

export function AssignmentCard({
  title,
  description,
  subject,
  dueDate,
  submittedDate,
  grade,
  maxGrade = 100,
  status,
  teacherComment,
  onSubmit,
  onView,
  userRole = "student"
}: AssignmentCardProps) {
  const statusConfig = {
    pending: { 
      color: "outline", 
      icon: Clock, 
      label: "Pending" 
    },
    submitted: { 
      color: "secondary", 
      icon: CheckCircle2, 
      label: "Submitted" 
    },
    graded: { 
      color: "default", 
      icon: CheckCircle2, 
      label: "Graded" 
    },
    overdue: { 
      color: "destructive", 
      icon: AlertCircle, 
      label: "Overdue" 
    }
  } as const;

  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const isOverdue = status === "overdue";
  const timeText = dueDate
    ? (isOverdue 
        ? `Due ${formatDistanceToNow(dueDate)} ago`
        : `Due ${formatDistanceToNow(dueDate)}`)
    : "No due date";

  return (
    <Card 
      className={`transition-colors hover:bg-accent/50 ${isOverdue ? 'border-destructive/20' : ''}`}
      data-testid={`card-assignment-${(title || 'untitled').toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-lg leading-tight flex-1 min-w-0">{title || 'Untitled Assignment'}</h3>
              <Badge variant={config.color as any} className="flex items-center gap-1 max-w-[120px] truncate flex-shrink-0">
                <StatusIcon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{config.label}</span>
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{subject || 'No subject'}</p>
            <p className="text-sm line-clamp-2">{description || 'No description'}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span className={isOverdue ? "text-destructive" : ""}>{timeText}</span>
            </div>
          )}
          {!dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span className="text-muted-foreground/60">No due date</span>
            </div>
          )}
          {submittedDate && (
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>Submitted {formatDistanceToNow(submittedDate)} ago</span>
            </div>
          )}
        </div>
        
        {grade !== undefined && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="font-medium">Grade:</span>
            <span className="text-lg font-semibold">
              {grade}/{maxGrade} ({Math.round((grade / maxGrade) * 100)}%)
            </span>
          </div>
        )}
        
        {teacherComment && (
          <div className="p-3 bg-muted/30 rounded-md">
            <p className="text-sm font-medium mb-1">Teacher Comment:</p>
            <p className="text-sm text-muted-foreground">{teacherComment}</p>
          </div>
        )}
        
        <div className="flex gap-2">
          {userRole === "student" && onSubmit && status === "pending" && (
            <Button 
              onClick={onSubmit} 
              className="flex-1" 
              variant={isOverdue ? "destructive" : "default"}
              data-testid="button-submit-assignment"
            >
              <Upload className="w-4 h-4 mr-2" />
              Submit Assignment
            </Button>
          )}
          {onView && (
            <Button 
              variant="outline" 
              onClick={onView} 
              className={userRole === "student" && status === "pending" ? "" : "flex-1"}
              data-testid="button-view-assignment"
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AssignmentCard;